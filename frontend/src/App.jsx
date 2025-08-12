import React, { useState, useEffect, useCallback } from 'react'
import PacketTable from './components/PacketTable'

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

function App() {
  const [packets, setPackets] = useState([])
  const [captureStatus, setCaptureStatus] = useState({
    is_capturing: false,
    packets_captured: 0,
    capture_start_time: null
  })
  const [websocket, setWebsocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [filters, setFilters] = useState({
    protocol: '',
    source_ip: '',
    destination_ip: ''
  })
  const [error, setError] = useState(null)

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/packets`)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setError(null)
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'status') {
            setCaptureStatus(data.data)
          } else {
            // New packet data
            const newPacket = {
              ...data,
              timestamp: new Date(data.timestamp)
            }
            setPackets(prev => {
              const updated = [...prev, newPacket]
              // Keep only last 1000 packets
              return updated.slice(-1000)
            })
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }
      
      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        setError('WebSocket connection lost. Trying to reconnect...')
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('WebSocket connection error')
      }
      
      setWebsocket(ws)
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      setError('Failed to connect to WebSocket')
    }
  }, [])

  // Connect to WebSocket on component mount
  useEffect(() => {
    connectWebSocket()
    
    return () => {
      if (websocket) {
        websocket.close()
      }
    }
  }, [connectWebSocket])

  // API functions
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (err) {
      console.error('API call error:', err)
      setError(err.message)
      throw err
    }
  }

  const startCapture = async () => {
    try {
      await apiCall('/api/capture/start', { method: 'POST' })
      setError(null)
    } catch (err) {
      // Error already set by apiCall
    }
  }

  const stopCapture = async () => {
    try {
      await apiCall('/api/capture/stop', { method: 'POST' })
      setError(null)
    } catch (err) {
      // Error already set by apiCall
    }
  }

  const pauseCapture = async () => {
    try {
      await apiCall('/api/capture/pause', { method: 'POST' })
      setError(null)
    } catch (err) {
      // Error already set by apiCall
    }
  }

  const resumeCapture = async () => {
    try {
      await apiCall('/api/capture/resume', { method: 'POST' })
      setError(null)
    } catch (err) {
      // Error already set by apiCall
    }
  }

  const clearPackets = async () => {
    try {
      await apiCall('/api/packets', { method: 'DELETE' })
      setPackets([])
      setError(null)
    } catch (err) {
      // Error already set by apiCall
    }
  }

  const loadFilteredPackets = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.protocol) params.append('protocol', filters.protocol)
      if (filters.source_ip) params.append('source_ip', filters.source_ip)
      if (filters.destination_ip) params.append('destination_ip', filters.destination_ip)
      params.append('limit', '100')
      
      const data = await apiCall(`/api/packets?${params.toString()}`)
      setPackets(data.packets.map(p => ({
        ...p,
        timestamp: new Date(p.timestamp)
      })))
      setError(null)
    } catch (err) {
      // Error already set by apiCall
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const applyFilters = () => {
    loadFilteredPackets()
  }

  const clearFilters = () => {
    setFilters({
      protocol: '',
      source_ip: '',
      destination_ip: ''
    })
    loadFilteredPackets()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Packet Sniffer</h1>
              <p className="text-sm text-gray-500">Real-time network packet monitoring</p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Capture Status */}
              <div className="flex items-center space-x-2">
                <span className={`status-indicator ${
                  captureStatus.is_capturing ? 'status-capturing' : 'status-stopped'
                }`}>
                  {captureStatus.is_capturing ? 'Capturing' : 'Stopped'}
                </span>
                <span className="text-sm text-gray-600">
                  {captureStatus.packets_captured} packets
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Capture Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={startCapture}
                disabled={captureStatus.is_capturing}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Capture
              </button>
              <button
                onClick={stopCapture}
                disabled={!captureStatus.is_capturing}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Stop Capture
              </button>
              <button
                onClick={pauseCapture}
                disabled={!captureStatus.is_capturing}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pause
              </button>
              <button
                onClick={resumeCapture}
                disabled={captureStatus.is_capturing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resume
              </button>
            </div>

            {/* Data Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={loadFilteredPackets}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Refresh
              </button>
              <button
                onClick={clearPackets}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Protocol
              </label>
              <select
                value={filters.protocol}
                onChange={(e) => handleFilterChange('protocol', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Protocols</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
                <option value="IP">IP</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source IP
              </label>
              <input
                type="text"
                value={filters.source_ip}
                onChange={(e) => handleFilterChange('source_ip', e.target.value)}
                placeholder="e.g., 192.168.1.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination IP
              </label>
              <input
                type="text"
                value={filters.destination_ip}
                onChange={(e) => handleFilterChange('destination_ip', e.target.value)}
                placeholder="e.g., 8.8.8.8"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Packet Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Captured Packets ({packets.length})
            </h3>
          </div>
          <PacketTable packets={packets} />
        </div>
      </main>
    </div>
  )
}

export default App

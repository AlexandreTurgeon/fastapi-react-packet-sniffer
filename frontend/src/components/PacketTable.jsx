import React from 'react'

const PacketTable = ({ packets }) => {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  const formatIP = (ip) => {
    if (!ip) return '-'
    return ip
  }

  const formatPort = (port) => {
    if (!port) return '-'
    return port.toString()
  }

  const getProtocolBadgeClass = (protocol) => {
    const protocolLower = protocol?.toLowerCase()
    switch (protocolLower) {
      case 'tcp':
        return 'protocol-badge protocol-tcp'
      case 'udp':
        return 'protocol-badge protocol-udp'
      case 'icmp':
        return 'protocol-badge protocol-icmp'
      default:
        return 'protocol-badge protocol-ip'
    }
  }

  const formatFlags = (flags) => {
    if (!flags) return '-'
    return flags
  }

  if (packets.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No packets captured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start packet capture to see network traffic data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="packet-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Protocol</th>
            <th>Source IP</th>
            <th>Source Port</th>
            <th>Destination IP</th>
            <th>Destination Port</th>
            <th>Size (bytes)</th>
            <th>TTL</th>
            <th>Flags</th>
          </tr>
        </thead>
        <tbody>
          {packets.map((packet, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="font-mono text-xs">
                {formatTimestamp(packet.timestamp)}
              </td>
              <td>
                <span className={getProtocolBadgeClass(packet.protocol)}>
                  {packet.protocol || 'IP'}
                </span>
              </td>
              <td className="font-mono text-sm">
                {formatIP(packet.source_ip)}
              </td>
              <td className="font-mono text-sm text-gray-600">
                {formatPort(packet.source_port)}
              </td>
              <td className="font-mono text-sm">
                {formatIP(packet.destination_ip)}
              </td>
              <td className="font-mono text-sm text-gray-600">
                {formatPort(packet.destination_port)}
              </td>
              <td className="font-mono text-sm text-gray-600">
                {packet.packet_size?.toLocaleString() || '-'}
              </td>
              <td className="font-mono text-sm text-gray-600">
                {packet.ttl || '-'}
              </td>
              <td className="font-mono text-xs text-gray-600">
                {formatFlags(packet.flags)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PacketTable

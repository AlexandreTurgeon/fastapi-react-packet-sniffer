from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import asyncio
from typing import List, Optional
import uvicorn

from models import PacketData, PacketResponse, CaptureStatus
from packet_capture import packet_capture

# Create FastAPI app
app = FastAPI(
    title="Packet Sniffer API",
    description="Real-time network packet capture and analysis API",
    version="1.0.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_packet(self, packet: PacketData):
        """Send packet data to all connected WebSocket clients"""
        if self.active_connections:
            packet_dict = packet.dict()
            packet_dict["timestamp"] = packet_dict["timestamp"].isoformat()
            
            # Convert to JSON and send to all connections
            message = json.dumps(packet_dict)
            disconnected = []
            
            for connection in self.active_connections:
                try:
                    await connection.send_text(message)
                except:
                    disconnected.append(connection)
            
            # Remove disconnected clients
            for connection in disconnected:
                self.disconnect(connection)

manager = ConnectionManager()

# WebSocket callback for packet streaming
def packet_callback(packet: PacketData):
    """Callback function to send packets to WebSocket clients"""
    asyncio.create_task(manager.send_packet(packet))

# Add callback to packet capture
packet_capture.add_callback(packet_callback)

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Packet Sniffer API",
        "version": "1.0.0",
        "endpoints": {
            "packets": "/api/packets",
            "capture_status": "/api/capture/status",
            "websocket": "/ws/packets"
        }
    }

@app.get("/api/packets", response_model=PacketResponse)
async def get_packets(
    protocol: Optional[str] = Query(None, description="Filter by protocol (TCP, UDP, ICMP, IP)"),
    source_ip: Optional[str] = Query(None, description="Filter by source IP address"),
    destination_ip: Optional[str] = Query(None, description="Filter by destination IP address"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of packets to return")
):
    """Get captured packets with optional filtering"""
    try:
        packets = packet_capture.get_packets(
            protocol=protocol,
            source_ip=source_ip,
            destination_ip=destination_ip,
            limit=limit
        )
        
        total_count = len(packet_capture.packets)
        filtered_count = len(packets)
        
        return PacketResponse(
            packets=packets,
            total_count=total_count,
            filtered_count=filtered_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving packets: {str(e)}")

@app.get("/api/capture/status", response_model=CaptureStatus)
async def get_capture_status():
    """Get current packet capture status"""
    try:
        status = packet_capture.get_status()
        return CaptureStatus(
            is_capturing=status["is_capturing"],
            packets_captured=status["packets_captured"],
            capture_start_time=status["capture_start_time"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving status: {str(e)}")

@app.post("/api/capture/start")
async def start_capture():
    """Start packet capture"""
    try:
        success = packet_capture.start_capture()
        if success:
            return {"message": "Packet capture started successfully"}
        else:
            raise HTTPException(status_code=400, detail="Packet capture is already running")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting capture: {str(e)}")

@app.post("/api/capture/stop")
async def stop_capture():
    """Stop packet capture"""
    try:
        success = packet_capture.stop_capture()
        if success:
            return {"message": "Packet capture stopped successfully"}
        else:
            raise HTTPException(status_code=400, detail="Packet capture is not running")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping capture: {str(e)}")

@app.post("/api/capture/pause")
async def pause_capture():
    """Pause packet capture"""
    try:
        success = packet_capture.pause_capture()
        if success:
            return {"message": "Packet capture paused successfully"}
        else:
            raise HTTPException(status_code=400, detail="Packet capture is not running")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error pausing capture: {str(e)}")

@app.post("/api/capture/resume")
async def resume_capture():
    """Resume packet capture"""
    try:
        success = packet_capture.resume_capture()
        if success:
            return {"message": "Packet capture resumed successfully"}
        else:
            raise HTTPException(status_code=400, detail="Packet capture is already running")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resuming capture: {str(e)}")

@app.delete("/api/packets")
async def clear_packets():
    """Clear all stored packets"""
    try:
        packet_capture.clear_packets()
        return {"message": "All packets cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing packets: {str(e)}")

@app.websocket("/ws/packets")
async def websocket_packets(websocket: WebSocket):
    """WebSocket endpoint for real-time packet streaming"""
    await manager.connect(websocket)
    try:
        # Send initial status
        status = packet_capture.get_status()
        await websocket.send_text(json.dumps({
            "type": "status",
            "data": status
        }))
        
        # Keep connection alive and handle incoming messages
        while True:
            # Wait for any message from client (ping/pong or commands)
            data = await websocket.receive_text()
            
            # Handle client commands if needed
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                # Ignore non-JSON messages
                pass
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    # Run the application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PacketData(BaseModel):
    """Model for individual packet data"""
    timestamp: datetime
    source_ip: str
    destination_ip: str
    protocol: str
    packet_size: int
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    ttl: Optional[int] = None
    flags: Optional[str] = None

class PacketResponse(BaseModel):
    """Model for API response containing packets"""
    packets: List[PacketData]
    total_count: int
    filtered_count: int

class CaptureStatus(BaseModel):
    """Model for capture status response"""
    is_capturing: bool
    packets_captured: int
    capture_start_time: Optional[datetime] = None

class FilterParams(BaseModel):
    """Model for packet filtering parameters"""
    protocol: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    limit: Optional[int] = 100

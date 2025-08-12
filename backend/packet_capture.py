import threading
import time
from datetime import datetime
from typing import List, Optional, Callable
from scapy.all import sniff, IP, TCP, UDP, ICMP
from models import PacketData

class PacketCapture:
    """Handles real-time packet capture using Scapy"""
    
    def __init__(self, max_packets: int = 1000):
        self.max_packets = max_packets
        self.packets: List[PacketData] = []
        self.is_capturing = False
        self.capture_thread: Optional[threading.Thread] = None
        self.capture_start_time: Optional[datetime] = None
        self.packet_callbacks: List[Callable[[PacketData], None]] = []
        self._lock = threading.Lock()
    
    def start_capture(self, interface: str = None) -> bool:
        """Start packet capture in a background thread"""
        if self.is_capturing:
            return False
        
        self.is_capturing = True
        self.capture_start_time = datetime.now()
        
        # Start capture in background thread
        self.capture_thread = threading.Thread(
            target=self._capture_packets,
            args=(interface,),
            daemon=True
        )
        self.capture_thread.start()
        return True
    
    def stop_capture(self) -> bool:
        """Stop packet capture"""
        if not self.is_capturing:
            return False
        
        self.is_capturing = False
        if self.capture_thread:
            self.capture_thread.join(timeout=2)
        return True
    
    def pause_capture(self) -> bool:
        """Pause packet capture"""
        if not self.is_capturing:
            return False
        
        self.is_capturing = False
        return True
    
    def resume_capture(self, interface: str = None) -> bool:
        """Resume packet capture"""
        if self.is_capturing:
            return False
        
        return self.start_capture(interface)
    
    def _capture_packets(self, interface: str = None):
        """Background thread function for packet capture"""
        try:
            # Start sniffing packets
            sniff(
                iface=interface,
                prn=self._process_packet,
                store=False,
                stop_filter=lambda _: not self.is_capturing
            )
        except Exception as e:
            print(f"Packet capture error: {e}")
            self.is_capturing = False
    
    def _process_packet(self, packet):
        """Process and store captured packet"""
        if not self.is_capturing:
            return
        
        try:
            # Extract IP layer
            if IP not in packet:
                return
            
            ip_layer = packet[IP]
            
            # Determine protocol
            protocol = "IP"
            source_port = None
            destination_port = None
            ttl = ip_layer.ttl
            flags = None
            
            # Check for TCP
            if TCP in packet:
                protocol = "TCP"
                tcp_layer = packet[TCP]
                source_port = tcp_layer.sport
                destination_port = tcp_layer.dport
                flags = self._get_tcp_flags(tcp_layer)
            
            # Check for UDP
            elif UDP in packet:
                protocol = "UDP"
                udp_layer = packet[UDP]
                source_port = udp_layer.sport
                destination_port = udp_layer.dport
            
            # Check for ICMP
            elif ICMP in packet:
                protocol = "ICMP"
            
            # Create packet data object
            packet_data = PacketData(
                timestamp=datetime.now(),
                source_ip=ip_layer.src,
                destination_ip=ip_layer.dst,
                protocol=protocol,
                packet_size=len(packet),
                source_port=source_port,
                destination_port=destination_port,
                ttl=ttl,
                flags=flags
            )
            
            # Store packet with thread safety
            with self._lock:
                self.packets.append(packet_data)
                
                # Maintain max packet limit
                if len(self.packets) > self.max_packets:
                    self.packets.pop(0)
            
            # Notify callbacks (for WebSocket streaming)
            for callback in self.packet_callbacks:
                try:
                    callback(packet_data)
                except Exception as e:
                    print(f"Callback error: {e}")
                    
        except Exception as e:
            print(f"Error processing packet: {e}")
    
    def _get_tcp_flags(self, tcp_layer) -> str:
        """Extract TCP flags as string"""
        flags = []
        if tcp_layer.flags & 0x01:  # FIN
            flags.append("FIN")
        if tcp_layer.flags & 0x02:  # SYN
            flags.append("SYN")
        if tcp_layer.flags & 0x04:  # RST
            flags.append("RST")
        if tcp_layer.flags & 0x08:  # PSH
            flags.append("PSH")
        if tcp_layer.flags & 0x10:  # ACK
            flags.append("ACK")
        if tcp_layer.flags & 0x20:  # URG
            flags.append("URG")
        return ", ".join(flags) if flags else None
    
    def get_packets(self, 
                   protocol: Optional[str] = None,
                   source_ip: Optional[str] = None,
                   destination_ip: Optional[str] = None,
                   limit: int = 100) -> List[PacketData]:
        """Get filtered packets"""
        with self._lock:
            filtered_packets = self.packets.copy()
        
        # Apply filters
        if protocol:
            filtered_packets = [p for p in filtered_packets if p.protocol.upper() == protocol.upper()]
        
        if source_ip:
            filtered_packets = [p for p in filtered_packets if p.source_ip == source_ip]
        
        if destination_ip:
            filtered_packets = [p for p in filtered_packets if p.destination_ip == destination_ip]
        
        # Apply limit and return most recent packets
        return filtered_packets[-limit:] if limit else filtered_packets
    
    def get_status(self) -> dict:
        """Get current capture status"""
        with self._lock:
            return {
                "is_capturing": self.is_capturing,
                "packets_captured": len(self.packets),
                "capture_start_time": self.capture_start_time,
                "max_packets": self.max_packets
            }
    
    def add_callback(self, callback: Callable[[PacketData], None]):
        """Add callback for new packet notifications"""
        self.packet_callbacks.append(callback)
    
    def remove_callback(self, callback: Callable[[PacketData], None]):
        """Remove callback"""
        if callback in self.packet_callbacks:
            self.packet_callbacks.remove(callback)
    
    def clear_packets(self):
        """Clear stored packets"""
        with self._lock:
            self.packets.clear()

# Global packet capture instance
packet_capture = PacketCapture()

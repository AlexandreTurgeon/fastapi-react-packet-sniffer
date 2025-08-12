# Packet Sniffer Web App

A real-time network packet sniffer with a FastAPI backend and React frontend. Capture, analyze, and monitor network traffic through a web interface.

## Features

### Backend (FastAPI)
- Real-time packet capture using Scapy
- REST API for packet retrieval and filtering
- WebSocket streaming for live packet updates
- Background packet capture thread
- In-memory packet storage
- Protocol and IP-based filtering

### Frontend (React)
- Real-time packet table display
- WebSocket connection for live updates
- Filter controls for protocol and IP
- Responsive design with TailwindCSS

## Project Structure

```
Packet_Sniffer_Project/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── packet_capture.py    # Scapy packet capture logic
│   ├── models.py            # Pydantic models
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── PacketTable.jsx
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

**Note:** Packet capture requires administrator/root privileges on most systems.

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the frontend:**
   ```bash
   npm run dev
   ```

## API Endpoints

### REST API
- `GET /api/packets` - Get recent packets
- `GET /api/packets?protocol=tcp` - Filter by protocol
- `GET /api/packets?source_ip=192.168.1.1` - Filter by source IP
- `GET /api/packets?dest_ip=8.8.8.8` - Filter by destination IP
- `POST /api/capture/pause` - Pause packet capture
- `POST /api/capture/resume` - Resume packet capture

### WebSocket
- `ws://localhost:8000/ws/packets` - Real-time packet stream

## Deployment

### Backend (Render/Railway)
1. Set environment variables:
   - `PORT`: Port number (usually auto-assigned)
   - `HOST`: Host address (usually 0.0.0.0)

2. Deploy with the following build command:
   ```bash
   pip install -r requirements.txt
   ```

3. Start command:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### Frontend (Vercel)
1. Connect your repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Configure environment variables for backend URL

## Security Considerations

- Packet capture requires elevated privileges
- Consider implementing authentication for production use
- Be aware of privacy implications when capturing network traffic
- Only capture on networks you own or have permission to monitor

## Dependencies

### Backend
- FastAPI: Web framework
- Scapy: Packet manipulation and capture
- uvicorn: ASGI server
- websockets: WebSocket support

### Frontend
- React: UI framework
- TailwindCSS: Styling
- Vite: Build tool

## License

MIT License

Copyright (c) 2024 Packet Sniffer Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

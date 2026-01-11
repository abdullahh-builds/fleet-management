# Fleet Management System - REST API

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Server
```bash
npm start
```

### 3. Access Application
Open browser: http://localhost:3000

## 📡 API Endpoints

### Vehicles (Hash Table - O(1))
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Add new vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Drivers (Queue - FIFO)
- `GET /api/drivers` - Get all drivers
- `POST /api/drivers/assign` - Assign driver to vehicle

### Maintenance (Min Heap - O(log n))
- `GET /api/maintenance` - Get priority maintenance queue

### Routes (Dijkstra - O(E log V))
- `POST /api/routes` - Calculate shortest route
- `GET /api/locations` - Get all locations

### System
- `GET /api/stats` - Get system statistics

## 🧪 Test with cURL

```bash
# Get all vehicles
curl http://localhost:3000/api/vehicles

# Add vehicle
curl -X POST http://localhost:3000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{"registration":"KA-01-XY-1234","model":"Toyota Innova","type":"Van","year":2022}'

# Calculate route
curl -X POST http://localhost:3000/api/routes \
  -H "Content-Type: application/json" \
  -d '{"from":0,"to":4}'

# Get maintenance priority
curl http://localhost:3000/api/maintenance
```

## 📊 Data Structures Used

- **Hash Table**: O(1) vehicle lookup
- **Queue**: FIFO driver assignment
- **Min Heap**: Priority-based maintenance
- **Graph + Dijkstra**: Shortest path routing
- **B-Tree**: Sorted vehicle indexing

## 🎓 For Teacher Demo

1. Start server: `npm start`
2. Open browser: http://localhost:3000
3. Show each tab demonstrating different DSA
4. Use API endpoints for testing
5. View console logs for operation details

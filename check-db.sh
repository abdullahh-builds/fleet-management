#!/bin/bash
# Script to check database data on EC2

echo "Checking database contents..."
echo ""

echo "=== USERS ==="
sudo -u postgres psql -d fleet_management -c "SELECT id, email, role, name FROM users;"

echo ""
echo "=== VEHICLES ==="
sudo -u postgres psql -d fleet_management -c "SELECT id, make, model, year, license_plate, status FROM vehicles;"

echo ""
echo "=== DRIVERS ==="
sudo -u postgres psql -d fleet_management -c "SELECT id, name, email, license_number, phone FROM drivers;"

echo ""
echo "=== FUEL REQUESTS ==="
sudo -u postgres psql -d fleet_management -c "SELECT id, driver_id, vehicle_id, fuel_type, quantity_liters, status, created_at FROM fuel_requests ORDER BY created_at DESC LIMIT 10;"

echo ""
echo "=== TRIPS ==="
sudo -u postgres psql -d fleet_management -c "SELECT id, driver_id, vehicle_id, status, start_time FROM trips ORDER BY start_time DESC LIMIT 10;"

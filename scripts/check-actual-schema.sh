#!/bin/bash
# Check actual database schema

echo "=== ALL TABLES ==="
sudo -u postgres psql -d fleet_management -c "\dt"

echo ""
echo "=== USERS TABLE STRUCTURE ==="
sudo -u postgres psql -d fleet_management -c "\d users"

echo ""
echo "=== VEHICLES TABLE STRUCTURE ==="
sudo -u postgres psql -d fleet_management -c "\d vehicles"

echo ""
echo "=== TRIPS TABLE STRUCTURE ==="
sudo -u postgres psql -d fleet_management -c "\d trips"

echo ""
echo "=== USERS DATA ==="
sudo -u postgres psql -d fleet_management -c "SELECT * FROM users LIMIT 5;"

echo ""
echo "=== VEHICLES DATA ==="
sudo -u postgres psql -d fleet_management -c "SELECT * FROM vehicles LIMIT 5;"

echo ""
echo "=== TRIPS DATA ==="
sudo -u postgres psql -d fleet_management -c "SELECT * FROM trips LIMIT 5;"

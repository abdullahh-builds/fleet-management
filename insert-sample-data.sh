#!/bin/bash
# Script to insert sample data into PostgreSQL database

echo "Inserting sample data into fleet_management database..."

# Insert sample vehicles
echo "Adding vehicles..."
sudo -u postgres psql -d fleet_management << EOF
INSERT INTO vehicles (make, model, year, license_plate, vin_number, fuel_type, status)
VALUES 
    ('Toyota', 'Corolla', 2022, 'ABC-123', 'VIN001', 'Petrol', 'available'),
    ('Honda', 'Civic', 2021, 'XYZ-456', 'VIN002', 'Petrol', 'available'),
    ('Toyota', 'Hilux', 2023, 'DEF-789', 'VIN003', 'Diesel', 'available'),
    ('Suzuki', 'Alto', 2020, 'GHI-012', 'VIN004', 'Petrol', 'available'),
    ('Honda', 'City', 2022, 'JKL-345', 'VIN005', 'Petrol', 'available')
ON CONFLICT (license_plate) DO NOTHING;
EOF

# Insert sample drivers
echo "Adding drivers..."
sudo -u postgres psql -d fleet_management << EOF
INSERT INTO drivers (name, email, phone, license_number, license_expiry, hire_date)
VALUES 
    ('Ali Ahmed', 'ali@fleet.com', '+92-300-1234567', 'DL001', '2025-12-31', '2023-01-15'),
    ('Hassan Khan', 'hassan@fleet.com', '+92-301-2345678', 'DL002', '2025-10-20', '2023-02-10'),
    ('Usman Malik', 'usman@fleet.com', '+92-302-3456789', 'DL003', '2026-03-15', '2023-03-05'),
    ('Bilal Shah', 'bilal@fleet.com', '+92-303-4567890', 'DL004', '2025-08-25', '2023-04-12')
ON CONFLICT (email) DO NOTHING;
EOF

# Assign vehicles to drivers
echo "Assigning vehicles to drivers..."
sudo -u postgres psql -d fleet_management << EOF
UPDATE drivers SET assigned_vehicle_id = (SELECT id FROM vehicles WHERE license_plate = 'ABC-123') WHERE email = 'ali@fleet.com';
UPDATE drivers SET assigned_vehicle_id = (SELECT id FROM vehicles WHERE license_plate = 'XYZ-456') WHERE email = 'hassan@fleet.com';
UPDATE drivers SET assigned_vehicle_id = (SELECT id FROM vehicles WHERE license_plate = 'DEF-789') WHERE email = 'usman@fleet.com';
UPDATE drivers SET assigned_vehicle_id = (SELECT id FROM vehicles WHERE license_plate = 'GHI-012') WHERE email = 'bilal@fleet.com';

UPDATE vehicles SET driver_id = (SELECT id FROM drivers WHERE email = 'ali@fleet.com') WHERE license_plate = 'ABC-123';
UPDATE vehicles SET driver_id = (SELECT id FROM drivers WHERE email = 'hassan@fleet.com') WHERE license_plate = 'XYZ-456';
UPDATE vehicles SET driver_id = (SELECT id FROM drivers WHERE email = 'usman@fleet.com') WHERE license_plate = 'DEF-789';
UPDATE vehicles SET driver_id = (SELECT id FROM drivers WHERE email = 'bilal@fleet.com') WHERE license_plate = 'GHI-012';
EOF

# Update employee user with assigned vehicle
echo "Assigning vehicle to employee user..."
sudo -u postgres psql -d fleet_management << EOF
UPDATE users SET assigned_vehicle = (SELECT id FROM vehicles WHERE license_plate = 'ABC-123')::text WHERE email = 'abdullah@fleet.com';
EOF

echo ""
echo "Sample data inserted successfully!"
echo ""
echo "Summary:"
sudo -u postgres psql -d fleet_management -c "SELECT COUNT(*) as total_vehicles FROM vehicles;"
sudo -u postgres psql -d fleet_management -c "SELECT COUNT(*) as total_drivers FROM drivers;"
sudo -u postgres psql -d fleet_management -c "SELECT COUNT(*) as total_users FROM users;"

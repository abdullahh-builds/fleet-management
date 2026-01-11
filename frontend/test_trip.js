const http = require('http');

const testData = {
    driver_id: 'test@test.com',
    driver_name: 'Test Driver',
    vehicle_id: 'V001',
    vehicle_name: 'Test Vehicle',
    start_location: 'DHA EME Sector, Khanpur, Lahore',
    start_lat: 31.4697,
    start_lon: 74.4075,
    destination: 'Arfa Karim Tower, Lahore',
    dest_lat: 31.4707,
    dest_lon: 74.2728,
    purpose: 'Delivery',
    start_odometer: 0,
    start_time: new Date().toISOString(),
    status: 'ONGOING',
    notes: 'Test trip',
    estimated_distance: 13
};

console.log('Testing trip API...');
console.log('Data:', JSON.stringify(testData, null, 2));

const data = JSON.stringify(testData);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/trips/start',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Response:', body);
        const result = JSON.parse(body);
        process.exit(result.success ? 0 : 1);
    });
});

req.on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
});

req.write(data);
req.end();

#include <iostream>
#include "core/vehicle.h"
#include "core/driver.h"
#include "data_structures/hash_table.h"
#include "data_structures/driver_queue.h"
#include "data_structures/min_heap.h"
#include "data_structures/graph.h"
#include "data_structures/btree.h"
using namespace std;

int main() {
    cout << "==================================" << endl;
    cout << "  Fleet Management System v1.0   " << endl;
    cout << "  DSA Implementation Project      " << endl;
    cout << "==================================" << endl;

    // Create Hash Table for Vehicle Management
    HashTable vehicleDB;

    cout << "\n--- MODULE 1: HASH TABLE DEMO ---" << endl;
    cout << "Testing O(1) Vehicle Lookup\n" << endl;

    // Add vehicles
    Vehicle* v1 = new Vehicle("V001", "MH-12-AB-1234", "Tata Ace", "Truck", 2020);
    v1->kilometersRun = 12000;
    v1->daysSinceLastService = 95;
    vehicleDB.insert(v1);

    Vehicle* v2 = new Vehicle("V002", "DL-01-CD-5678", "Mahindra Bolero", "Van", 2019);
    v2->kilometersRun = 8500;
    v2->daysSinceLastService = 45;
    vehicleDB.insert(v2);

    Vehicle* v3 = new Vehicle("V003", "KA-03-EF-9012", "Maruti Eeco", "Car", 2021);
    v3->kilometersRun = 15000;
    v3->daysSinceLastService = 120;
    vehicleDB.insert(v3);

    Vehicle* v4 = new Vehicle("V004", "TN-09-GH-3456", "Ashok Leyland", "Truck", 2018);
    v4->kilometersRun = 25000;
    v4->daysSinceLastService = 150;
    vehicleDB.insert(v4);

    // Display all vehicles
    vehicleDB.displayAll();

    // Test Search - O(1)
    cout << "\n--- TESTING SEARCH (O(1)) ---" << endl;
    cout << "Searching for V003..." << endl;
    Vehicle* found = vehicleDB.search("V003");
    if(found != NULL) {
        found->display();
    } else {
        cout << "Vehicle not found!" << endl;
    }

    // Test Search for non-existent
    cout << "Searching for V999 (doesn't exist)..." << endl;
    Vehicle* notFound = vehicleDB.search("V999");
    if(notFound == NULL) {
        cout << "❌ Vehicle V999 not found (as expected)\n" << endl;
    }

    // Display hash table statistics
    vehicleDB.displayStats();

    // Test Delete
    cout << "\n--- TESTING DELETE ---" << endl;
    vehicleDB.deleteVehicle("V002");
    cout << "\nAfter deletion:" << endl;
    vehicleDB.displayStats();
    cout << "\n✅ Hash Table Module Complete!" << endl;
    cout << "✅ O(1) Insert, Search, Delete implemented!" << endl;

    // ============================================
    // MODULE 2: DRIVER QUEUE (FIFO)
    // ============================================
    
    cout << "\n\n--- MODULE 2: DRIVER QUEUE DEMO ---" << endl;
    cout << "Testing FIFO Driver Assignment\n" << endl;

    DriverQueue driverQueue;

    // Create drivers
    Driver* d1 = new Driver("D001", "Rajesh Kumar", "DL-1234567890", "+91-9876543210", 5);
    Driver* d2 = new Driver("D002", "Amit Sharma", "DL-2345678901", "+91-9876543211", 8);
    Driver* d3 = new Driver("D003", "Priya Singh", "DL-3456789012", "+91-9876543212", 3);
    Driver* d4 = new Driver("D004", "Vikram Patel", "DL-4567890123", "+91-9876543213", 10);
    Driver* d5 = new Driver("D005", "Sunita Verma", "DL-5678901234", "+91-9876543214", 6);

    // Add drivers to queue
    cout << "\n📥 Adding drivers to queue..." << endl;
    driverQueue.enqueue(d1);
    driverQueue.enqueue(d2);
    driverQueue.enqueue(d3);
    driverQueue.enqueue(d4);
    driverQueue.enqueue(d5);

    // Display queue
    driverQueue.displayQueue();
    driverQueue.displayStats();

    // Assign drivers (FIFO)
    cout << "\n--- TESTING FIFO ASSIGNMENT ---" << endl;
    cout << "\nAssigning drivers to vehicles in order...\n" << endl;

    // Assignment 1
    Driver* assigned1 = driverQueue.dequeue();
    if(assigned1 != NULL) {
        assigned1->status = "ON_DUTY";
        assigned1->assignedVehicleId = "V001";
        cout << "Assigned to Vehicle V001" << endl;
    }

    // Assignment 2
    Driver* assigned2 = driverQueue.dequeue();
    if(assigned2 != NULL) {
        assigned2->status = "ON_DUTY";
        assigned2->assignedVehicleId = "V003";
        cout << "Assigned to Vehicle V003" << endl;
    }

    cout << "\n📋 Queue after 2 assignments:" << endl;
    driverQueue.displayStats();
    driverQueue.displayQueue();

    // Peek next driver
    cout << "\n--- TESTING PEEK (View without removing) ---" << endl;
    Driver* nextDriver = driverQueue.peek();
    if(nextDriver != NULL) {
        cout << "Next driver in queue: " << nextDriver->name << endl;
        cout << "Experience: " << nextDriver->experience << " years" << endl;
    }

    // Assignment 3
    cout << "\n--- ONE MORE ASSIGNMENT ---" << endl;
    Driver* assigned3 = driverQueue.dequeue();
    if(assigned3 != NULL) {
        assigned3->status = "ON_DUTY";
        assigned3->assignedVehicleId = "V004";
        cout << "Assigned to Vehicle V004" << endl;
    }

    // Final queue status
    cout << "\n📋 Final Queue Status:" << endl;
    driverQueue.displayStats();
    driverQueue.displayQueue();
    cout << "\n✅ Queue Module Complete!" << endl;
    cout << "✅ FIFO Driver Assignment implemented!" << endl;

    // ============================================
    // MODULE 3: MIN HEAP (PRIORITY QUEUE)
    // ============================================
    
    cout << "\n\n--- MODULE 3: MAINTENANCE PRIORITY HEAP ---" << endl;
    cout << "Testing Min Heap for Urgent Maintenance\n" << endl;

    MinHeap maintenanceHeap;

    // Create vehicles with different maintenance priorities
    cout << "\n🚗 Adding vehicles to maintenance heap..." << endl;
    
    Vehicle* vm1 = new Vehicle("V101", "MH-01-XY-1111", "Tata Super Ace", "Truck", 2017);
    vm1->kilometersRun = 28000;
    vm1->daysSinceLastService = 180;
    maintenanceHeap.insert(vm1);

    Vehicle* vm2 = new Vehicle("V102", "DL-02-AB-2222", "Maruti Suzuki", "Car", 2020);
    vm2->kilometersRun = 9500;
    vm2->daysSinceLastService = 60;
    maintenanceHeap.insert(vm2);

    Vehicle* vm3 = new Vehicle("V103", "KA-05-CD-3333", "Mahindra Pickup", "Truck", 2016);
    vm3->kilometersRun = 35000;
    vm3->daysSinceLastService = 200;
    maintenanceHeap.insert(vm3);

    Vehicle* vm4 = new Vehicle("V104", "TN-07-EF-4444", "Hyundai i10", "Car", 2021);
    vm4->kilometersRun = 6000;
    vm4->daysSinceLastService = 40;
    maintenanceHeap.insert(vm4);

    Vehicle* vm5 = new Vehicle("V105", "UP-09-GH-5555", "Tata Ace", "Truck", 2018);
    vm5->kilometersRun = 18000;
    vm5->daysSinceLastService = 150;
    maintenanceHeap.insert(vm5);

    Vehicle* vm6 = new Vehicle("V106", "RJ-11-IJ-6666", "Force Traveller", "Van", 2019);
    vm6->kilometersRun = 22000;
    vm6->daysSinceLastService = 170;
    maintenanceHeap.insert(vm6);

    // Display heap
    maintenanceHeap.displayHeap();
    maintenanceHeap.displayStats();

    // Show top 3 priority vehicles
    maintenanceHeap.displayTop3();

    // Extract highest priority vehicles
    cout << "\n--- SCHEDULING MAINTENANCE (Extracting Min) ---\n" << endl;
    
    cout << "🔧 Scheduling 1st vehicle..." << endl;
    Vehicle* scheduled1 = maintenanceHeap.extractMin();
    if(scheduled1 != NULL) {
        scheduled1->status = "MAINTENANCE";
        cout << "Vehicle " << scheduled1->vehicleId << " sent to workshop\n" << endl;
    }

    cout << "🔧 Scheduling 2nd vehicle..." << endl;
    Vehicle* scheduled2 = maintenanceHeap.extractMin();
    if(scheduled2 != NULL) {
        scheduled2->status = "MAINTENANCE";
        cout << "Vehicle " << scheduled2->vehicleId << " sent to workshop\n" << endl;
    }

    cout << "🔧 Scheduling 3rd vehicle..." << endl;
    Vehicle* scheduled3 = maintenanceHeap.extractMin();
    if(scheduled3 != NULL) {
        scheduled3->status = "MAINTENANCE";
        cout << "Vehicle " << scheduled3->vehicleId << " sent to workshop\n" << endl;
    }

    // Display remaining heap
    cout << "\n📋 Remaining vehicles in maintenance queue:" << endl;
    maintenanceHeap.displayStats();
    maintenanceHeap.displayHeap();

    // Peek next vehicle
    cout << "\n--- TESTING PEEK (Next Priority Vehicle) ---" << endl;
    Vehicle* nextMaintenance = maintenanceHeap.peekMin();
    if(nextMaintenance != NULL) {
        cout << "Next vehicle for maintenance: " << nextMaintenance->vehicleId << endl;
        cout << "Model: " << nextMaintenance->model << endl;
        cout << "Priority Score: " << nextMaintenance->getMaintenancePriority() << endl;
    }
    cout << "\n✅ Min Heap Module Complete!" << endl;
    cout << "✅ O(log n) Priority-based Maintenance Scheduling implemented!" << endl;

    // ============================================
    // MODULE 4: GRAPH + DIJKSTRA
    // ============================================
    
    cout << "\n\n--- MODULE 4: ROUTE OPTIMIZATION (GRAPH + DIJKSTRA) ---" << endl;
    cout << "Testing Shortest Path Algorithm\n" << endl;

    Graph cityMap;

    // Add locations (vertices)
    cout << "🗺️ Building city map...\n" << endl;
    cityMap.addLocation("Warehouse");           // 0
    cityMap.addLocation("City Center");         // 1
    cityMap.addLocation("Service Station");     // 2
    cityMap.addLocation("Highway Junction");    // 3
    cityMap.addLocation("Delivery Hub");        // 4
    cityMap.addLocation("Industrial Area");     // 5

    cout << endl;

    // Add roads (edges with distances in km)
    cout << "🛣️ Adding road network...\n" << endl;
    cityMap.addRoad(0, 1, 15);  // Warehouse <-> City Center (15 km)
    cityMap.addRoad(0, 2, 8);   // Warehouse <-> Service Station (8 km)
    cityMap.addRoad(1, 3, 12);  // City Center <-> Highway Junction (12 km)
    cityMap.addRoad(2, 3, 10);  // Service Station <-> Highway Junction (10 km)
    cityMap.addRoad(3, 4, 18);  // Highway Junction <-> Delivery Hub (18 km)
    cityMap.addRoad(1, 4, 25);  // City Center <-> Delivery Hub (25 km)
    cityMap.addRoad(2, 5, 14);  // Service Station <-> Industrial Area (14 km)
    cityMap.addRoad(4, 5, 20);  // Delivery Hub <-> Industrial Area (20 km)

    // Display graph
    cityMap.displayGraph();

    // Test Case 1: Warehouse to Delivery Hub
    cout << "\n========================================" << endl;
    cout << "  TEST CASE 1: Warehouse to Delivery Hub" << endl;
    cout << "========================================" << endl;
    cityMap.dijkstra(0, 4);

    // Test Case 2: Warehouse to Industrial Area
    cout << "\n========================================" << endl;
    cout << "  TEST CASE 2: Warehouse to Industrial Area" << endl;
    cout << "========================================" << endl;
    cityMap.dijkstra(0, 5);

    // Test Case 3: City Center to Service Station
    cout << "\n========================================" << endl;
    cout << "  TEST CASE 3: City Center to Service Station" << endl;
    cout << "========================================" << endl;
    cityMap.dijkstra(1, 2);

    // Test Case 4: Service Station to Delivery Hub
    cout << "\n========================================" << endl;
    cout << "  TEST CASE 4: Service Station to Delivery Hub" << endl;
    cout << "========================================" << endl;
    cityMap.dijkstra(2, 4);

    cout << "\n✅ Graph + Dijkstra Module Complete!" << endl;
    cout << "✅ O(E log V) Shortest Path Algorithm implemented!" << endl;

    // ============================================
    // MODULE 5: B-TREE (SORTED INDEXING)
    // ============================================
    
    cout << "\n\n--- MODULE 5: B-TREE VEHICLE INDEX ---" << endl;
    cout << "Testing Sorted Storage & Range Queries\n" << endl;

    BTree vehicleIndex;

    // Insert vehicles in random order - B-Tree keeps them sorted
    cout << "🚗 Adding vehicles to B-Tree index (random order)...\n" << endl;
    
    Vehicle* vb1 = new Vehicle("V205", "RJ-14-XY-7890", "Eicher Truck", "Truck", 2019);
    vb1->kilometersRun = 15000;
    vehicleIndex.insert(vb1);

    Vehicle* vb2 = new Vehicle("V203", "GJ-01-AB-1234", "Tata Winger", "Van", 2020);
    vb2->kilometersRun = 9000;
    vehicleIndex.insert(vb2);

    Vehicle* vb3 = new Vehicle("V208", "MH-14-CD-5678", "Mahindra Scorpio", "SUV", 2021);
    vb3->kilometersRun = 7500;
    vehicleIndex.insert(vb3);

    Vehicle* vb4 = new Vehicle("V201", "DL-08-EF-9012", "Maruti Omni", "Van", 2018);
    vb4->kilometersRun = 20000;
    vehicleIndex.insert(vb4);

    Vehicle* vb5 = new Vehicle("V207", "KA-05-GH-3456", "Ashok Leyland", "Truck", 2019);
    vb5->kilometersRun = 18000;
    vehicleIndex.insert(vb5);

    Vehicle* vb6 = new Vehicle("V202", "TN-09-IJ-7890", "Force Traveller", "Van", 2020);
    vb6->kilometersRun = 12000;
    vehicleIndex.insert(vb6);

    cout << endl;

    // Display sorted vehicles
    vehicleIndex.displayAll();

    // Display statistics
    vehicleIndex.displayStats();

    // Test Search - O(log n) binary search
    cout << "\n--- TESTING BINARY SEARCH (O(log n)) ---" << endl;
    cout << "Searching for V205..." << endl;
    Vehicle* foundVehicle = vehicleIndex.search("V205");
    if(foundVehicle != NULL) {
        cout << "✅ Found: " << foundVehicle->model << " (" << foundVehicle->vehicleId << ")" << endl;
        cout << "   Registration: " << foundVehicle->registrationNumber << endl;
    } else {
        cout << "❌ Vehicle not found!" << endl;
    }

    cout << "\nSearching for V201..." << endl;
    Vehicle* foundVehicle2 = vehicleIndex.search("V201");
    if(foundVehicle2 != NULL) {
        cout << "✅ Found: " << foundVehicle2->model << " (" << foundVehicle2->vehicleId << ")" << endl;
    } else {
        cout << "❌ Vehicle not found!" << endl;
    }

    cout << "\nSearching for V999 (doesn't exist)..." << endl;
    Vehicle* notFoundBTree = vehicleIndex.search("V999");
    if(notFoundBTree == NULL) {
        cout << "❌ Vehicle not found (as expected)\n" << endl;
    }

    // Test Range Query
    vehicleIndex.displayRange("V203", "V207");

    cout << "\n✅ B-Tree Module Complete!" << endl;
    cout << "✅ O(log n) Binary Search & Sorted Storage implemented!" << endl;
    cout << "\n--- TESTING DUPLICATE PREVENTION ---" << endl;
    Vehicle* duplicate = new Vehicle("VB99", "KA-03-CC-3333", "Duplicate Car", "Car", 2023);
    vehicleIndex.insert(duplicate);

    cout << "\n✅ B-Tree Module Complete!" << endl;
    cout << "✅ O(log n) Sorted Indexing & Range Queries implemented!" << endl;

    // ============================================
    // FINAL SUMMARY
    // ============================================
    
    cout << "\n\n========================================" << endl;
    cout << "  🎉 ALL MODULES COMPLETED! 🎉" << endl;
    cout << "========================================" << endl;
    cout << "\n📊 DSA Implementation Summary:\n" << endl;
    cout << "✅ MODULE 1: Hash Table" << endl;
    cout << "   → O(1) Vehicle Management" << endl;
    cout << "   → Insert, Search, Delete operations" << endl;
    cout << endl;
    cout << "✅ MODULE 2: Queue (FIFO)" << endl;
    cout << "   → Fair Driver Assignment" << endl;
    cout << "   → Enqueue, Dequeue operations" << endl;
    cout << endl;
    cout << "✅ MODULE 3: Min Heap" << endl;
    cout << "   → O(log n) Priority Scheduling" << endl;
    cout << "   → Maintenance based on priority" << endl;
    cout << endl;
    cout << "✅ MODULE 4: Graph + Dijkstra" << endl;
    cout << "   → O(E log V) Route Optimization" << endl;
    cout << "   → Shortest path calculation" << endl;
    cout << endl;
    cout << "✅ MODULE 5: B-Tree" << endl;
    cout << "   → O(log n) Sorted Indexing" << endl;
    cout << "   → Balanced tree for disk-based storage" << endl;
    cout << endl;
    cout << "========================================" << endl;
    cout << "  Ready for Teacher Demonstration! 🚀" << endl;
    cout << "========================================\n" << endl;

    return 0;
}

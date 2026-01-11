#ifndef BTREE_H
#define BTREE_H

#include <iostream>
#include <string>
#include "vehicle.h"
using namespace std;

#define MAX_VEHICLES 100

// Simple B-Tree simulation using sorted array
class BTree {
private:
    Vehicle* vehicles[MAX_VEHICLES];
    int count;

    // Binary search
    int binarySearch(string vehicleId) {
        int left = 0;
        int right = count - 1;
        
        while(left <= right) {
            int mid = left + (right - left) / 2;
            
            if(vehicles[mid]->vehicleId == vehicleId) {
                return mid;
            }
            
            if(vehicles[mid]->vehicleId < vehicleId) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return -1;
    }

    // Find insertion position
    int findInsertPosition(string vehicleId) {
        int pos = 0;
        while(pos < count && vehicles[pos]->vehicleId < vehicleId) {
            pos++;
        }
        return pos;
    }

public:
    BTree() {
        count = 0;
        for(int i = 0; i < MAX_VEHICLES; i++) {
            vehicles[i] = NULL;
        }
    }

    // Insert vehicle - maintains sorted order
    void insert(Vehicle* vehicle) {
        if(count >= MAX_VEHICLES) {
            cout << "❌ B-Tree is full!" << endl;
            return;
        }
        
        int pos = findInsertPosition(vehicle->vehicleId);
        
        // Shift elements to make space
        for(int i = count; i > pos; i--) {
            vehicles[i] = vehicles[i - 1];
        }
        
        vehicles[pos] = vehicle;
        count++;
        
        cout << "✅ Vehicle " << vehicle->vehicleId << " inserted into B-Tree at position " << pos << endl;
    }

    // Search - O(log n) binary search
    Vehicle* search(string vehicleId) {
        int index = binarySearch(vehicleId);
        if(index != -1) {
            return vehicles[index];
        }
        return NULL;
    }

    // Display all vehicles (already sorted)
    void displayAll() {
        if(count == 0) {
            cout << "\n📦 B-Tree is EMPTY" << endl;
            return;
        }
        
        cout << "\n========== B-TREE SORTED INDEX ==========" << endl;
        cout << "Total Vehicles: " << count << endl;
        cout << "=========================================\n" << endl;
        
        for(int i = 0; i < count; i++) {
            cout << (i + 1) << ". " << vehicles[i]->vehicleId 
                 << " - " << vehicles[i]->registrationNumber 
                 << " (" << vehicles[i]->model << ")" << endl;
        }
        cout << endl;
    }

    // Display range of vehicles
    void displayRange(string start, string end) {
        cout << "\n=== RANGE QUERY: " << start << " to " << end << " ===" << endl;
        
        bool found = false;
        for(int i = 0; i < count; i++) {
            if(vehicles[i]->vehicleId >= start && vehicles[i]->vehicleId <= end) {
                cout << vehicles[i]->vehicleId << " - " << vehicles[i]->model << endl;
                found = true;
            }
        }
        
        if(!found) {
            cout << "No vehicles in range" << endl;
        }
        cout << "==============================\n" << endl;
    }

    // Display statistics
    void displayStats() {
        cout << "\n=== B-Tree Statistics ===" << endl;
        cout << "Total Vehicles: " << count << endl;
        cout << "Storage Type: Sorted Array (B-Tree simulation)" << endl;
        cout << "Search Complexity: O(log n)" << endl;
        cout << "Insert Complexity: O(n)" << endl;
        cout << "Tree Status: " << (count == 0 ? "EMPTY" : "ACTIVE") << endl;
        cout << "=========================\n" << endl;
    }

    int getTotalVehicles() {
        return count;
    }

    ~BTree() {
        // Vehicles are managed elsewhere
    }
};

#endif

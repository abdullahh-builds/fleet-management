#ifndef MIN_HEAP_H
#define MIN_HEAP_H

#include <iostream>
#include <string>
#include "vehicle.h"
using namespace std;

#define MAX_HEAP_SIZE 100

class MinHeap {
private:
    Vehicle* heap[MAX_HEAP_SIZE];
    int size;

    // Get parent index
    int parent(int i) {
        return (i - 1) / 2;
    }

    // Get left child index
    int leftChild(int i) {
        return 2 * i + 1;
    }

    // Get right child index
    int rightChild(int i) {
        return 2 * i + 2;
    }

    // Swap two vehicles
    void swap(int i, int j) {
        Vehicle* temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }

    // Heapify up - maintain min heap property upward
    void heapifyUp(int index) {
        while(index > 0 && heap[parent(index)]->getMaintenancePriority() > heap[index]->getMaintenancePriority()) {
            swap(index, parent(index));
            index = parent(index);
        }
    }

    // Heapify down - maintain min heap property downward
    void heapifyDown(int index) {
        int minIndex = index;
        int left = leftChild(index);
        int right = rightChild(index);

        if(left < size && heap[left]->getMaintenancePriority() < heap[minIndex]->getMaintenancePriority()) {
            minIndex = left;
        }

        if(right < size && heap[right]->getMaintenancePriority() < heap[minIndex]->getMaintenancePriority()) {
            minIndex = right;
        }

        if(index != minIndex) {
            swap(index, minIndex);
            heapifyDown(minIndex);
        }
    }

public:
    MinHeap() {
        size = 0;
        for(int i = 0; i < MAX_HEAP_SIZE; i++) {
            heap[i] = NULL;
        }
    }

    // Insert vehicle - O(log n)
    bool insert(Vehicle* vehicle) {
        if(size >= MAX_HEAP_SIZE) {
            cout << "❌ Heap is full!" << endl;
            return false;
        }

        heap[size] = vehicle;
        heapifyUp(size);
        size++;
        
        cout << "✅ Vehicle " << vehicle->vehicleId << " added to maintenance heap (Priority: " 
             << vehicle->getMaintenancePriority() << ")" << endl;
        return true;
    }

    // Extract min (highest priority) - O(log n)
    Vehicle* extractMin() {
        if(isEmpty()) {
            cout << "❌ Heap is empty!" << endl;
            return NULL;
        }

        Vehicle* minVehicle = heap[0];
        heap[0] = heap[size - 1];
        size--;
        
        if(size > 0) {
            heapifyDown(0);
        }

        cout << "✅ Vehicle " << minVehicle->vehicleId << " scheduled for maintenance (Priority: " 
             << minVehicle->getMaintenancePriority() << ")" << endl;
        return minVehicle;
    }

    // Peek min without removing
    Vehicle* peekMin() {
        if(isEmpty()) {
            return NULL;
        }
        return heap[0];
    }

    // Check if empty
    bool isEmpty() {
        return size == 0;
    }

    // Get size
    int getSize() {
        return size;
    }

    // Display heap (level order)
    void displayHeap() {
        if(isEmpty()) {
            cout << "\n🔧 Maintenance Heap is EMPTY" << endl;
            return;
        }

        cout << "\n========== MAINTENANCE PRIORITY HEAP ==========" << endl;
        cout << "Total Vehicles Pending Maintenance: " << size << endl;
        cout << "===============================================\n" << endl;

        for(int i = 0; i < size; i++) {
            cout << "Priority Rank " << (i + 1) << ":" << endl;
            cout << "  Vehicle: " << heap[i]->vehicleId << " (" << heap[i]->model << ")" << endl;
            cout << "  Priority Score: " << heap[i]->getMaintenancePriority() << endl;
            cout << "  Kilometers: " << heap[i]->kilometersRun << " km" << endl;
            cout << "  Days Since Service: " << heap[i]->daysSinceLastService << " days" << endl;
            cout << "  Needs Maintenance: " << (heap[i]->needsMaintenance() ? "YES ⚠️" : "NO") << endl;
            cout << endl;
        }
    }

    // Display next 3 vehicles for maintenance
    void displayTop3() {
        cout << "\n=== TOP 3 PRIORITY VEHICLES ===" << endl;
        int limit = (size < 3) ? size : 3;
        
        for(int i = 0; i < limit; i++) {
            cout << (i + 1) << ". " << heap[i]->vehicleId << " - " << heap[i]->model 
                 << " (Priority: " << heap[i]->getMaintenancePriority() << ")" << endl;
        }
        cout << "================================\n" << endl;
    }

    // Display statistics
    void displayStats() {
        cout << "\n=== Min Heap Statistics ===" << endl;
        cout << "Total Vehicles: " << size << endl;
        cout << "Heap Status: " << (isEmpty() ? "EMPTY" : "ACTIVE") << endl;
        
        if(!isEmpty()) {
            cout << "Highest Priority: " << heap[0]->vehicleId << " (Priority: " 
                 << heap[0]->getMaintenancePriority() << ")" << endl;
        }
        
        // Count urgent vehicles
        int urgentCount = 0;
        for(int i = 0; i < size; i++) {
            if(heap[i]->needsMaintenance()) {
                urgentCount++;
            }
        }
        cout << "Urgent Maintenance Needed: " << urgentCount << " vehicles" << endl;
        cout << "===========================\n" << endl;
    }

    ~MinHeap() {
        // Heap doesn't own the vehicles, just holds pointers
    }
};

#endif

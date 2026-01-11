#ifndef HASH_TABLE_H
#define HASH_TABLE_H

#include <iostream>
#include <string>
#include "vehicle.h"
using namespace std;

#define TABLE_SIZE 100

// Node for chaining (handling collisions)
struct HashNode {
    string key;           // Vehicle ID
    Vehicle* vehicle;     // Pointer to vehicle
    HashNode* next;       // For chaining
    
    HashNode(string k, Vehicle* v) {
        key = k;
        vehicle = v;
        next = NULL;
    }
};

class HashTable {
private:
    HashNode* table[TABLE_SIZE];
    int totalVehicles;

    // Hash function - converts string key to index
    int hashFunction(string key) {
        int hash = 0;
        for(int i = 0; i < key.length(); i++) {
            hash += key[i];
        }
        return hash % TABLE_SIZE;
    }

public:
    HashTable() {
        totalVehicles = 0;
        for(int i = 0; i < TABLE_SIZE; i++) {
            table[i] = NULL;
        }
    }

    // Insert vehicle - O(1) average
    bool insert(Vehicle* v) {
        if(v == NULL) return false;
        
        string key = v->vehicleId;
        int index = hashFunction(key);
        
        // Check if already exists
        HashNode* current = table[index];
        while(current != NULL) {
            if(current->key == key) {
                cout << "❌ Vehicle ID already exists!" << endl;
                return false;
            }
            current = current->next;
        }
        
        // Insert at beginning of chain
        HashNode* newNode = new HashNode(key, v);
        newNode->next = table[index];
        table[index] = newNode;
        totalVehicles++;
        
        cout << "✅ Vehicle " << key << " inserted successfully!" << endl;
        return true;
    }

    // Search vehicle - O(1) average
    Vehicle* search(string vehicleId) {
        int index = hashFunction(vehicleId);
        HashNode* current = table[index];
        
        while(current != NULL) {
            if(current->key == vehicleId) {
                return current->vehicle;
            }
            current = current->next;
        }
        
        return NULL;  // Not found
    }

    // Delete vehicle - O(1) average
    bool deleteVehicle(string vehicleId) {
        int index = hashFunction(vehicleId);
        HashNode* current = table[index];
        HashNode* prev = NULL;
        
        while(current != NULL) {
            if(current->key == vehicleId) {
                if(prev == NULL) {
                    // First node
                    table[index] = current->next;
                } else {
                    prev->next = current->next;
                }
                delete current->vehicle;
                delete current;
                totalVehicles--;
                cout << "✅ Vehicle " << vehicleId << " deleted!" << endl;
                return true;
            }
            prev = current;
            current = current->next;
        }
        
        cout << "❌ Vehicle not found!" << endl;
        return false;
    }

    // Display all vehicles
    void displayAll() {
        cout << "\n========== ALL VEHICLES ==========" << endl;
        cout << "Total Vehicles: " << totalVehicles << endl;
        cout << "==================================\n" << endl;
        
        for(int i = 0; i < TABLE_SIZE; i++) {
            HashNode* current = table[i];
            while(current != NULL) {
                current->vehicle->display();
                current = current->next;
            }
        }
    }

    // Get total count
    int getTotalVehicles() {
        return totalVehicles;
    }

    // Display hash table statistics (for DSA demonstration)
    void displayStats() {
        int usedSlots = 0;
        int maxChainLength = 0;
        
        for(int i = 0; i < TABLE_SIZE; i++) {
            if(table[i] != NULL) {
                usedSlots++;
                int chainLength = 0;
                HashNode* current = table[i];
                while(current != NULL) {
                    chainLength++;
                    current = current->next;
                }
                if(chainLength > maxChainLength) {
                    maxChainLength = chainLength;
                }
            }
        }
        
        cout << "\n=== Hash Table Statistics ===" << endl;
        cout << "Table Size: " << TABLE_SIZE << endl;
        cout << "Used Slots: " << usedSlots << endl;
        cout << "Load Factor: " << (float)totalVehicles/TABLE_SIZE << endl;
        cout << "Max Chain Length: " << maxChainLength << endl;
        cout << "============================\n" << endl;
    }

    ~HashTable() {
        for(int i = 0; i < TABLE_SIZE; i++) {
            HashNode* current = table[i];
            while(current != NULL) {
                HashNode* temp = current;
                current = current->next;
                delete temp->vehicle;
                delete temp;
            }
        }
    }
};

#endif

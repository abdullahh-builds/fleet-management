#ifndef VEHICLE_H
#define VEHICLE_H

#include <iostream>
#include <string>
using namespace std;

class Vehicle {
public:
    string vehicleId;
    string registrationNumber;
    string model;
    string type;  // Truck, Van, Car
    int year;
    double kilometersRun;
    int daysSinceLastService;
    string status;  // "AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED"
    string assignedDriverId;

    // Constructor
    Vehicle() {
        vehicleId = "";
        registrationNumber = "";
        model = "";
        type = "";
        year = 0;
        kilometersRun = 0.0;
        daysSinceLastService = 0;
        status = "AVAILABLE";
        assignedDriverId = "";
    }

    Vehicle(string id, string regNum, string mdl, string tp, int yr) {
        vehicleId = id;
        registrationNumber = regNum;
        model = mdl;
        type = tp;
        year = yr;
        kilometersRun = 0.0;
        daysSinceLastService = 0;
        status = "AVAILABLE";
        assignedDriverId = "";
    }

    // Calculate maintenance priority (lower = higher priority)
    int getMaintenancePriority() {
        int priority = 0;
        
        // Every 5000 km adds to priority
        priority += (int)(kilometersRun / 5000);
        
        // Days since last service
        priority += daysSinceLastService / 30;  // Every 30 days
        
        return priority;
    }

    bool needsMaintenance() {
        return (kilometersRun > 10000) || (daysSinceLastService > 90);
    }

    void display() {
        cout << "\n=== Vehicle Information ===" << endl;
        cout << "ID: " << vehicleId << endl;
        cout << "Registration: " << registrationNumber << endl;
        cout << "Model: " << model << endl;
        cout << "Type: " << type << endl;
        cout << "Year: " << year << endl;
        cout << "Kilometers: " << kilometersRun << " km" << endl;
        cout << "Days Since Service: " << daysSinceLastService << " days" << endl;
        cout << "Status: " << status << endl;
        cout << "Maintenance Priority: " << getMaintenancePriority() << endl;
        cout << "Needs Maintenance: " << (needsMaintenance() ? "YES" : "NO") << endl;
        if(assignedDriverId != "") {
            cout << "Assigned Driver: " << assignedDriverId << endl;
        }
        cout << "==========================\n" << endl;
    }
};

#endif

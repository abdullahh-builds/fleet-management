#ifndef DRIVER_H
#define DRIVER_H

#include <iostream>
#include <string>
using namespace std;

class Driver {
public:
    string driverId;
    string name;
    string licenseNumber;
    string phoneNumber;
    int experience;  // years
    string status;  // "AVAILABLE", "ON_DUTY", "ON_LEAVE", "INACTIVE"
    string assignedVehicleId;

    // Constructor
    Driver() {
        driverId = "";
        name = "";
        licenseNumber = "";
        phoneNumber = "";
        experience = 0;
        status = "AVAILABLE";
        assignedVehicleId = "";
    }

    Driver(string id, string nm, string license, string phone, int exp) {
        driverId = id;
        name = nm;
        licenseNumber = license;
        phoneNumber = phone;
        experience = exp;
        status = "AVAILABLE";
        assignedVehicleId = "";
    }

    bool isAvailable() {
        return status == "AVAILABLE";
    }

    void display() {
        cout << "\n=== Driver Information ===" << endl;
        cout << "ID: " << driverId << endl;
        cout << "Name: " << name << endl;
        cout << "License: " << licenseNumber << endl;
        cout << "Phone: " << phoneNumber << endl;
        cout << "Experience: " << experience << " years" << endl;
        cout << "Status: " << status << endl;
        if(assignedVehicleId != "") {
            cout << "Assigned Vehicle: " << assignedVehicleId << endl;
        }
        cout << "==========================\n" << endl;
    }
};

#endif

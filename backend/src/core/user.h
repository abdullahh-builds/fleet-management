#ifndef USER_H
#define USER_H

#include <iostream>
#include <string>
using namespace std;

class User {
public:
    string userId;
    string email;
    string password;
    string name;
    string role;      // "ADMIN" or "EMPLOYEE"
    string status;    // "ACTIVE", "PENDING", "INACTIVE"
    
    User() {
        userId = "";
        email = "";
        password = "";
        name = "";
        role = "EMPLOYEE";
        status = "PENDING";
    }
    
    User(string id, string e, string p, string n, string r, string s) {
        userId = id;
        email = e;
        password = p;
        name = n;
        role = r;
        status = s;
    }
    
    void display() {
        cout << "\n=== User Information ===" << endl;
        cout << "User ID: " << userId << endl;
        cout << "Name: " << name << endl;
        cout << "Email: " << email << endl;
        cout << "Role: " << role << endl;
        cout << "Status: " << status << endl;
        cout << "========================\n" << endl;
    }
};

#endif

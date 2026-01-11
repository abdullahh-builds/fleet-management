#ifndef AUTH_SYSTEM_H
#define AUTH_SYSTEM_H

#include <iostream>
#include <string>
#include "../core/user.h"
using namespace std;

#define AUTH_TABLE_SIZE 100

class AuthNode {
public:
    string email;
    User* user;
    AuthNode* next;
    
    AuthNode(string e, User* u) {
        email = e;
        user = u;
        next = NULL;
    }
};

class AuthSystem {
private:
    AuthNode* table[AUTH_TABLE_SIZE];
    int totalUsers;
    
    int hashFunction(string email) {
        int hash = 0;
        for(int i = 0; i < email.length(); i++) {
            hash = (hash * 31 + email[i]) % AUTH_TABLE_SIZE;
        }
        return hash >= 0 ? hash : -hash;
    }
    
public:
    AuthSystem() {
        totalUsers = 0;
        for(int i = 0; i < AUTH_TABLE_SIZE; i++) {
            table[i] = NULL;
        }
        initializeAdmin();
    }
    
    void initializeAdmin() {
        // Hardcoded admin - only this email can be admin
        User* admin = new User("U001", "admin@fleet.com", "admin123", "System Administrator", "ADMIN", "ACTIVE");
        int index = hashFunction(admin->email);
        AuthNode* newNode = new AuthNode(admin->email, admin);
        table[index] = newNode;
        totalUsers++;
        cout << "✅ Admin account initialized: admin@fleet.com" << endl;
    }
    
    bool registerUser(string email, string password, string name) {
        int index = hashFunction(email);
        
        // Check if email already exists
        AuthNode* current = table[index];
        while(current != NULL) {
            if(current->email == email) {
                return false;  // Email already registered
            }
            current = current->next;
        }
        
        // Generate user ID
        string userId = "U" + to_string(totalUsers + 1);
        
        // Check if this is admin email
        string role = "EMPLOYEE";
        string status = "PENDING";
        
        if(email == "admin@fleet.com") {
            return false;  // Admin already exists
        }
        
        // Create new user
        User* newUser = new User(userId, email, password, name, role, status);
        
        // Insert into hash table
        AuthNode* newNode = new AuthNode(email, newUser);
        newNode->next = table[index];
        table[index] = newNode;
        totalUsers++;
        
        cout << "✅ User registered: " << email << " (Status: PENDING)" << endl;
        return true;
    }
    
    User* login(string email, string password) {
        int index = hashFunction(email);
        AuthNode* current = table[index];
        
        while(current != NULL) {
            if(current->email == email && current->user->password == password) {
                return current->user;
            }
            current = current->next;
        }
        
        return NULL;  // Login failed
    }
    
    User* getUserByEmail(string email) {
        int index = hashFunction(email);
        AuthNode* current = table[index];
        
        while(current != NULL) {
            if(current->email == email) {
                return current->user;
            }
            current = current->next;
        }
        
        return NULL;
    }
    
    bool updateUserStatus(string email, string newStatus) {
        User* user = getUserByEmail(email);
        if(user != NULL) {
            user->status = newStatus;
            cout << "✅ User status updated: " << email << " -> " << newStatus << endl;
            return true;
        }
        return false;
    }
    
    void displayAllUsers() {
        cout << "\n=== All Registered Users ===" << endl;
        cout << "Total Users: " << totalUsers << endl;
        cout << "============================\n" << endl;
        
        for(int i = 0; i < AUTH_TABLE_SIZE; i++) {
            AuthNode* current = table[i];
            while(current != NULL) {
                current->user->display();
                current = current->next;
            }
        }
    }
    
    void displayPendingUsers() {
        cout << "\n=== Pending User Approvals ===" << endl;
        int pendingCount = 0;
        
        for(int i = 0; i < AUTH_TABLE_SIZE; i++) {
            AuthNode* current = table[i];
            while(current != NULL) {
                if(current->user->status == "PENDING") {
                    current->user->display();
                    pendingCount++;
                }
                current = current->next;
            }
        }
        
        if(pendingCount == 0) {
            cout << "No pending user approvals." << endl;
        }
        cout << "\nTotal Pending: " << pendingCount << endl;
        cout << "==============================\n" << endl;
    }
    
    int getTotalUsers() {
        return totalUsers;
    }
};

#endif

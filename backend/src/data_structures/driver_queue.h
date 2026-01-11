#ifndef DRIVER_QUEUE_H
#define DRIVER_QUEUE_H

#include <iostream>
#include <string>
#include "driver.h"
using namespace std;

// Queue Node
struct QueueNode {
    Driver* driver;
    QueueNode* next;
    
    QueueNode(Driver* d) {
        driver = d;
        next = NULL;
    }
};

class DriverQueue {
private:
    QueueNode* front;
    QueueNode* rear;
    int size;

public:
    DriverQueue() {
        front = NULL;
        rear = NULL;
        size = 0;
    }

    // Enqueue - Add driver to queue (FIFO)
    void enqueue(Driver* driver) {
        if(driver == NULL) return;
        
        QueueNode* newNode = new QueueNode(driver);
        
        if(rear == NULL) {
            // Queue is empty
            front = rear = newNode;
        } else {
            rear->next = newNode;
            rear = newNode;
        }
        size++;
        cout << "✅ Driver " << driver->name << " added to queue" << endl;
    }

    // Dequeue - Remove and return front driver (FIFO)
    Driver* dequeue() {
        if(isEmpty()) {
            cout << "❌ Queue is empty!" << endl;
            return NULL;
        }
        
        QueueNode* temp = front;
        Driver* driver = temp->driver;
        front = front->next;
        
        if(front == NULL) {
            rear = NULL;  // Queue became empty
        }
        
        delete temp;
        size--;
        
        cout << "✅ Driver " << driver->name << " assigned from queue" << endl;
        return driver;
    }

    // Peek - View front driver without removing
    Driver* peek() {
        if(isEmpty()) {
            return NULL;
        }
        return front->driver;
    }

    // Check if empty
    bool isEmpty() {
        return front == NULL;
    }

    // Get size
    int getSize() {
        return size;
    }

    // Display all drivers in queue
    void displayQueue() {
        if(isEmpty()) {
            cout << "\n📋 Driver Queue is EMPTY" << endl;
            return;
        }
        
        cout << "\n========== DRIVER QUEUE ==========" << endl;
        cout << "Total Drivers Waiting: " << size << endl;
        cout << "==================================\n" << endl;
        
        QueueNode* current = front;
        int position = 1;
        
        while(current != NULL) {
            cout << "Position " << position << ":" << endl;
            current->driver->display();
            current = current->next;
            position++;
        }
    }

    // Display statistics
    void displayStats() {
        cout << "\n=== Queue Statistics ===" << endl;
        cout << "Total Drivers: " << size << endl;
        cout << "Queue Status: " << (isEmpty() ? "EMPTY" : "ACTIVE") << endl;
        if(!isEmpty()) {
            cout << "Next Driver: " << front->driver->name << endl;
        }
        cout << "=======================\n" << endl;
    }

    ~DriverQueue() {
        while(!isEmpty()) {
            dequeue();
        }
    }
};

#endif

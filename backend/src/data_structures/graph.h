#ifndef GRAPH_H
#define GRAPH_H

#include <iostream>
#include <string>
#include <climits>
using namespace std;

#define MAX_VERTICES 20
#define INF INT_MAX

// Edge structure
struct Edge {
    int destination;
    int weight;
    Edge* next;
    
    Edge(int dest, int w) {
        destination = dest;
        weight = w;
        next = NULL;
    }
};

// Location structure
struct Location {
    string name;
    int id;
    
    Location() {
        name = "";
        id = -1;
    }
    
    Location(string n, int i) {
        name = n;
        id = i;
    }
};

class Graph {
private:
    Edge* adjacencyList[MAX_VERTICES];
    Location locations[MAX_VERTICES];
    int numVertices;

public:
    Graph() {
        numVertices = 0;
        for(int i = 0; i < MAX_VERTICES; i++) {
            adjacencyList[i] = NULL;
        }
    }

    // Add location (vertex)
    void addLocation(string name) {
        if(numVertices >= MAX_VERTICES) {
            cout << "❌ Maximum locations reached!" << endl;
            return;
        }
        
        locations[numVertices] = Location(name, numVertices);
        numVertices++;
        cout << "✅ Location added: " << name << " (ID: " << (numVertices-1) << ")" << endl;
    }

    // Add road (edge) - undirected graph
    void addRoad(int source, int destination, int distance) {
        if(source >= numVertices || destination >= numVertices) {
            cout << "❌ Invalid location!" << endl;
            return;
        }

        // Add edge from source to destination
        Edge* newEdge1 = new Edge(destination, distance);
        newEdge1->next = adjacencyList[source];
        adjacencyList[source] = newEdge1;

        // Add edge from destination to source (undirected)
        Edge* newEdge2 = new Edge(source, distance);
        newEdge2->next = adjacencyList[destination];
        adjacencyList[destination] = newEdge2;

        cout << "✅ Road added: " << locations[source].name << " <-> " 
             << locations[destination].name << " (" << distance << " km)" << endl;
    }

    // Find minimum distance vertex (for Dijkstra)
    int findMinDistance(int dist[], bool visited[]) {
        int minDist = INF;
        int minIndex = -1;

        for(int i = 0; i < numVertices; i++) {
            if(!visited[i] && dist[i] < minDist) {
                minDist = dist[i];
                minIndex = i;
            }
        }

        return minIndex;
    }

    // Dijkstra's Algorithm - Find shortest path
    void dijkstra(int source, int destination) {
        if(source >= numVertices || destination >= numVertices) {
            cout << "❌ Invalid locations!" << endl;
            return;
        }

        int dist[MAX_VERTICES];
        bool visited[MAX_VERTICES];
        int parent[MAX_VERTICES];

        // Initialize
        for(int i = 0; i < numVertices; i++) {
            dist[i] = INF;
            visited[i] = false;
            parent[i] = -1;
        }

        dist[source] = 0;

        cout << "\n🚗 Calculating shortest route..." << endl;
        cout << "From: " << locations[source].name << endl;
        cout << "To: " << locations[destination].name << endl;
        cout << "\n--- DIJKSTRA'S ALGORITHM EXECUTION ---" << endl;

        // Process all vertices
        for(int count = 0; count < numVertices - 1; count++) {
            int u = findMinDistance(dist, visited);
            
            if(u == -1) break;
            
            visited[u] = true;
            cout << "Processing: " << locations[u].name << " (Distance: " << dist[u] << " km)" << endl;

            // Update distances of adjacent vertices
            Edge* current = adjacencyList[u];
            while(current != NULL) {
                int v = current->destination;
                int weight = current->weight;

                if(!visited[v] && dist[u] != INF && dist[u] + weight < dist[v]) {
                    dist[v] = dist[u] + weight;
                    parent[v] = u;
                    cout << "  → Updated " << locations[v].name << " distance to " << dist[v] << " km" << endl;
                }

                current = current->next;
            }
        }

        // Display result
        cout << "\n========== ROUTE RESULT ==========" << endl;
        
        if(dist[destination] == INF) {
            cout << "❌ No route exists!" << endl;
            cout << "==================================\n" << endl;
            return;
        }

        cout << "✅ Shortest Distance: " << dist[destination] << " km" << endl;
        
        // Reconstruct path
        cout << "\n📍 Route Path:" << endl;
        int path[MAX_VERTICES];
        int pathLength = 0;
        
        int current = destination;
        while(current != -1) {
            path[pathLength++] = current;
            current = parent[current];
        }

        // Print path in correct order
        for(int i = pathLength - 1; i >= 0; i--) {
            cout << locations[path[i]].name;
            if(i > 0) {
                // Find distance between consecutive nodes
                int from = path[i];
                int to = path[i-1];
                int distance = 0;
                
                Edge* edge = adjacencyList[from];
                while(edge != NULL) {
                    if(edge->destination == to) {
                        distance = edge->weight;
                        break;
                    }
                    edge = edge->next;
                }
                
                cout << " --(" << distance << " km)--> ";
            }
        }
        cout << "\n\n==================================\n" << endl;
    }

    // Display all locations and roads
    void displayGraph() {
        cout << "\n========== FLEET NETWORK MAP ==========" << endl;
        cout << "Total Locations: " << numVertices << endl;
        cout << "=======================================\n" << endl;

        for(int i = 0; i < numVertices; i++) {
            cout << locations[i].name << " (ID: " << i << ") connects to:" << endl;
            
            Edge* current = adjacencyList[i];
            if(current == NULL) {
                cout << "  → No connections" << endl;
            } else {
                while(current != NULL) {
                    cout << "  → " << locations[current->destination].name 
                         << " (" << current->weight << " km)" << endl;
                    current = current->next;
                }
            }
            cout << endl;
        }
    }

    // Get location name by ID
    string getLocationName(int id) {
        if(id >= 0 && id < numVertices) {
            return locations[id].name;
        }
        return "Unknown";
    }

    // Get total vertices
    int getNumVertices() {
        return numVertices;
    }

    ~Graph() {
        for(int i = 0; i < numVertices; i++) {
            Edge* current = adjacencyList[i];
            while(current != NULL) {
                Edge* temp = current;
                current = current->next;
                delete temp;
            }
        }
    }
};

#endif

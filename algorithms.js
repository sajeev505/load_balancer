// algorithms.js - Load balancing strategies

class LoadBalancingAlgorithms {
  constructor() {
    this.currentIndex = -1;
    this.activeConnections = new Map();
  }

  // Round Robin - Distributes requests evenly
  roundRobin(servers) {
    if (servers.length === 0) return null;
    this.currentIndex = (this.currentIndex + 1) % servers.length;
    return servers[this.currentIndex];
  }

  // Weighted Round Robin - Servers with higher weight get more requests
  weightedRoundRobin(servers) {
    if (servers.length === 0) return null;
    
    const weightedServers = [];
    servers.forEach((server) => {
      const weight = server.weight || 1;
      for (let i = 0; i < weight; i++) {
        weightedServers.push(server);
      }
    });

    this.currentIndex = (this.currentIndex + 1) % weightedServers.length;
    return weightedServers[this.currentIndex];
  }

  // Least Connections - Routes to server with fewest active connections
  leastConnections(servers) {
    if (servers.length === 0) return null;

    // Initialize connection count for new servers
    servers.forEach((server) => {
      if (!this.activeConnections.has(server.url)) {
        this.activeConnections.set(server.url, 0);
      }
    });

    // Find server with minimum connections
    let minConnections = Infinity;
    let selectedServer = null;

    servers.forEach((server) => {
      const connections = this.activeConnections.get(server.url);
      if (connections < minConnections) {
        minConnections = connections;
        selectedServer = server;
      }
    });

    return selectedServer;
  }

  // Weighted Least Connections - Combines weight and connection count
  weightedLeastConnections(servers) {
    if (servers.length === 0) return null;

    servers.forEach((server) => {
      if (!this.activeConnections.has(server.url)) {
        this.activeConnections.set(server.url, 0);
      }
    });

    let minRatio = Infinity;
    let selectedServer = null;

    servers.forEach((server) => {
      const weight = server.weight || 1;
      const connections = this.activeConnections.get(server.url);
      const ratio = connections / weight;

      if (ratio < minRatio) {
        minRatio = ratio;
        selectedServer = server;
      }
    });

    return selectedServer;
  }

  incrementConnections(serverUrl) {
    const current = this.activeConnections.get(serverUrl) || 0;
    this.activeConnections.set(serverUrl, current + 1);
  }

  decrementConnections(serverUrl) {
    const current = this.activeConnections.get(serverUrl) || 0;
    this.activeConnections.set(serverUrl, Math.max(0, current - 1));
  }

  selectServer(servers, algorithm) {
    switch (algorithm) {
      case 'weighted-round-robin':
        return this.weightedRoundRobin(servers);
      case 'least-connections':
        return this.leastConnections(servers);
      case 'weighted-least-connections':
        return this.weightedLeastConnections(servers);
      default:
        return this.roundRobin(servers);
    }
  }
}

export default LoadBalancingAlgorithms;

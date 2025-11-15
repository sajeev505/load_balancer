// monitoringServer.js - Real-time dashboard backend

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MonitoringServer {
  constructor(port = 4001) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server);
    this.port = port;
    this.stats = {
      totalRequests: 0,
      serverStats: {},
      healthyServers: [],
      deadServers: [],
      algorithm: 'round-robin',
      uptime: Date.now()
    };

    this.setupRoutes();
    this.setupWebSocket();
  }

  setupRoutes() {
    this.app.use(express.static(path.join(__dirname, 'public')));

    this.app.get('/api/stats', (req, res) => {
      res.json(this.stats);
    });

    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log('Dashboard client connected');
      
      // Send initial stats
      socket.emit('stats-update', this.stats);

      socket.on('disconnect', () => {
        console.log('Dashboard client disconnected');
      });
    });
  }

  updateStats(newStats) {
    this.stats = { ...this.stats, ...newStats };
    this.io.emit('stats-update', this.stats);
  }

  incrementRequest(serverUrl) {
    this.stats.totalRequests++;
    if (!this.stats.serverStats[serverUrl]) {
      this.stats.serverStats[serverUrl] = { requests: 0, errors: 0 };
    }
    this.stats.serverStats[serverUrl].requests++;
    this.io.emit('stats-update', this.stats);
  }

  incrementError(serverUrl) {
    if (!this.stats.serverStats[serverUrl]) {
      this.stats.serverStats[serverUrl] = { requests: 0, errors: 0 };
    }
    this.stats.serverStats[serverUrl].errors++;
    this.io.emit('stats-update', this.stats);
  }

  updateServerHealth(healthy, dead) {
    this.stats.healthyServers = healthy;
    this.stats.deadServers = dead;
    this.io.emit('stats-update', this.stats);
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`Monitoring dashboard running on http://localhost:${this.port}`);
    });
  }
}

export default MonitoringServer;

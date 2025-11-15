import express from "express";
import axios from "axios";
import logger from "./logServer.js";
import cron from "node-cron";
import chalk from "chalk";
import Table from 'cli-table3';
import fs from 'fs';
import LoadBalancingAlgorithms from './algorithms.js';
import SessionManager from './sessionManager.js';
import RouteMatcher from './routeMatcher.js';
import MonitoringServer from './monitoringServer.js';

const app = express();

// Load configuration
let config;
try {
  config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
} catch (error) {
  console.error(chalk.red('Error loading config.json'), error.message);
  process.exit(1);
}

// Initialize components
const lbAlgorithm = new LoadBalancingAlgorithms();
const sessionManager = new SessionManager();
const routeMatcher = new RouteMatcher(config.routes, config.servers);
const monitoringServer = new MonitoringServer(4001);

let healthyServers = [];
const allServers = config.servers.map(s => s.url);

var table = new Table({ 
  head: [chalk.white("Time"), chalk.blue("Total Servers"), chalk.green("Healthy"), "Dead"] 
});

const changeServer = (req) => {
  // Path-based routing
  const availableServers = routeMatcher.matchRoute(req.path);
  const healthyAvailable = availableServers.filter(s => 
    healthyServers.some(hs => hs.url === s.url)
  );

  if (healthyAvailable.length === 0) {
    return null;
  }

  // Sticky sessions
  if (config.enableStickySession) {
    const sessionId = sessionManager.getSessionId(req);
    if (sessionId) {
      const sessions = sessionManager.sessions;
      if (sessions.has(sessionId)) {
        const serverUrl = sessions.get(sessionId);
        const server = healthyAvailable.find(s => s.url === serverUrl);
        if (server) {
          return server;
        }
      }
    }
  }

  // Select server using configured algorithm
  const server = lbAlgorithm.selectServer(healthyAvailable, config.algorithm);
  return server;
};

const makeRequestToServer = async (req, res, server) => {
  try {
    lbAlgorithm.incrementConnections(server.url);
    monitoringServer.incrementRequest(server.url);

    const { data } = await axios({
      method: req.method,
      url: `${server.url}${req.originalUrl}`,
      headers: req.headers,
      data: req.body,
      timeout: 5000
    });

    lbAlgorithm.decrementConnections(server.url);
    
    return res.status(200).json({
      success: true,
      data,
      server: server.url
    });
  } catch (error) {
    lbAlgorithm.decrementConnections(server.url);
    monitoringServer.incrementError(server.url);
    
    throw error;
  }
};

const handleRequest = async (req, res) => {
  try {
    logger.info(`Request from ${req.ip} to ${req.path}`);

    const server = changeServer(req);

    if (!server) {
      return res.status(503).json({
        success: false,
        error: "All servers are unavailable",
        message: "Please try again later"
      });
    }

    // Handle sticky sessions
    if (config.enableStickySession) {
      const session = sessionManager.getServerForSession(req, server);
      if (session.isNew) {
        sessionManager.setSessionCookie(res, session.sessionId);
      }
    }

    return makeRequestToServer(req, res, server);
  } catch (error) {
    logger.error(`Request error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const healthCheck = async () => {
  console.log(chalk.blue(`----- Health check (${config.healthCheck.interval}s) -----`));
  
  const healthyUrls = [];
  const deadUrls = [];

  for (const server of config.servers) {
    try {
      await axios.get(`${server.url}${config.healthCheck.endpoint}`, { 
        timeout: 3000 
      });
      
      healthyUrls.push(server.url);
      
      if (!healthyServers.find(s => s.url === server.url)) {
        healthyServers.push(server);
        console.log(chalk.green(`✓ Server ${server.url} is now healthy`));
      }
    } catch (error) {
      deadUrls.push(server.url);
      
      const index = healthyServers.findIndex(s => s.url === server.url);
      if (index > -1) {
        healthyServers.splice(index, 1);
        console.log(chalk.red(`✗ Server ${server.url} is down`));
      }
      
      logger.error(`Health check failed for ${server.url}: ${error.message}`);
    }
  }

  // Update monitoring dashboard
  monitoringServer.updateServerHealth(healthyUrls, deadUrls);

  table.splice(0, table.length);
  table.push([
    new Date().toTimeString().split(' ')[0],
    config.servers.length,
    healthyServers.length,
    config.servers.length - healthyServers.length
  ]);

  console.log(table.toString());
};

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.all("*", (req, res) => {
  handleRequest(req, res);
});

const startServer = () => {
  const PORT = config.port || 4000;
  
  app.listen(PORT, () => {
    console.log(chalk.green(`\n🚀 Load Balancer Started`));
    console.log(chalk.cyan(`   Port: ${PORT}`));
    console.log(chalk.cyan(`   Algorithm: ${config.algorithm}`));
    console.log(chalk.cyan(`   Sticky Sessions: ${config.enableStickySession ? 'Enabled' : 'Disabled'}`));
    console.log(chalk.cyan(`   Health Check: ${config.healthCheck.interval}s\n`));

    // Initial health check
    healthCheck();

    // Schedule periodic health checks
    cron.schedule(`*/${config.healthCheck.interval} * * * * *`, healthCheck);

    // Start monitoring dashboard
    monitoringServer.start();
    monitoringServer.updateStats({ algorithm: config.algorithm });
  });
};

export default startServer;

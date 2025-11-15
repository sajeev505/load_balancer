import fs from 'fs';
import startServer from './server.js';
import logger from './logServer.js';

console.log('Starting Advanced Load Balancer...');

let config;
try {
  const configData = fs.readFileSync('./config.json', 'utf8');
  config = JSON.parse(configData);
} catch (error) {
  console.error('Failed to read or parse config.json:', error.message);
  logger.error('Failed to read or parse config.json:', error.message);
  process.exit(1);
}

// Sort routes from most specific to least specific
// This ensures "/api/v2" is matched before "/api" or "/*"
config.routes.sort((a, b) => {
    return b.path.length - a.path.length;
});

// Pass the validated config to the server
startServer(config);
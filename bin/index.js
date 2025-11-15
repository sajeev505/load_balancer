#!/usr/bin/env node

import chalk from "chalk";
import startServer from "../server.js";
import fs from 'fs';

console.log(chalk.green("🎯 Starting Load Balancer from config.json\n"));

// Check if config file exists
if (!fs.existsSync('./config.json')) {
  console.error(chalk.red('Error: config.json not found!'));
  console.log(chalk.yellow('Please create a config.json file in the project root.'));
  process.exit(1);
}

startServer();

#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('   ROCK Apparel Store — Unified Development Engine  ');
console.log('====================================================');

// 1. Launch Backend (API & DB connection)
const backend = spawn('npm', ['start', '--prefix', 'backend'], {
  cwd: rootDir,
  stdio: 'inherit',
});

// 2. Launch Frontend (Angular Dev Server)
const frontend = spawn('npm', ['start', '--prefix', 'frontend'], {
  cwd: rootDir,
  stdio: 'inherit',
});

// 3. Launch Stripe Auto-Forwarder (if stripe binary exists or is installed)
let stripe = null;
const stripeScript = path.resolve(rootDir, 'scripts/stripe-listen.js');
const localStripeBin = path.resolve(rootDir, 'bin/stripe');

if (fs.existsSync(stripeScript) && (fs.existsSync(localStripeBin) || process.env.ENABLE_STRIPE === 'true')) {
  stripe = spawn('node', [stripeScript], {
    cwd: rootDir,
    stdio: 'inherit',
  });
}

const cleanup = () => {
  console.log('\n[Shutdown] Stopping all services...');
  if (backend) backend.kill();
  if (frontend) frontend.kill();
  if (stripe) stripe.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

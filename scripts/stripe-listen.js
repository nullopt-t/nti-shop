#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Determine port from environment or backend/.env file (fallback to 5000)
let port = process.env.PORT || 5000;
const envPath = path.resolve(__dirname, '../backend/.env');

if (!process.env.PORT && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/^PORT\s*=\s*(\d+)/m);
  if (match) {
    port = match[1];
  }
}

const targetUrl = `localhost:${port}/api/stripe/webhook`;
console.log(`[Stripe Listen] Forwarding webhook events to http://${targetUrl}`);

const stripeProcess = spawn('stripe', ['listen', '--forward-to', targetUrl], {
  stdio: 'inherit',
});

stripeProcess.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('\n[Error] The Stripe CLI ("stripe") is not installed or not in your PATH.');
    console.error('Install Stripe CLI: https://docs.stripe.com/stripe-cli');
  } else {
    console.error(`\n[Error] Stripe process error: ${err.message}`);
  }
  process.exit(1);
});

stripeProcess.on('exit', (code) => {
  process.exit(code || 0);
});

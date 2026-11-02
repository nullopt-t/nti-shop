#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.resolve(rootDir, 'backend/.env');

// 1. Read configuration from backend/.env
let port = process.env.PORT || 5000;
let apiKey = process.env.STRIPE_SECRET_KEY || '';
let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const portMatch = content.match(/^PORT\s*=\s*(\d+)/m);
  if (portMatch) port = portMatch[1];

  const keyMatch = content.match(/^STRIPE_SECRET_KEY\s*=\s*(.+)/m);
  if (keyMatch) apiKey = keyMatch[1].trim();

  const secretMatch = content.match(/^STRIPE_WEBHOOK_SECRET\s*=\s*(.+)/m);
  if (secretMatch) webhookSecret = secretMatch[1].trim();
}

// 2. Locate stripe binary (local bin/stripe or system PATH)
const localStripeBin = path.resolve(rootDir, 'bin/stripe');
const stripeCmd = fs.existsSync(localStripeBin) ? localStripeBin : 'stripe';

const targetUrl = `localhost:${port}/api/stripe/webhook`;
console.log(`[Stripe Auto-Forwarder] Forwarding events to http://${targetUrl}`);

const args = ['listen', '--events', 'checkout.session.completed', '--forward-to', targetUrl];
if (apiKey) {
  args.push('--api-key', apiKey);
}

const stripeProcess = spawn(stripeCmd, args, {
  stdio: ['inherit', 'pipe', 'inherit'],
});

stripeProcess.stdout.on('data', (data) => {
  const text = data.toString();
  process.stdout.write(text);

  // Auto-detect and write webhook signing secret to backend/.env if missing
  const secretMatch = text.match(/whsec_[a-zA-Z0-9]+/);
  if (secretMatch && (!webhookSecret || webhookSecret !== secretMatch[0])) {
    const discoveredSecret = secretMatch[0];
    try {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('STRIPE_WEBHOOK_SECRET=')) {
        envContent = envContent.replace(
          /^STRIPE_WEBHOOK_SECRET=.*$/m,
          `STRIPE_WEBHOOK_SECRET=${discoveredSecret}`
        );
      } else {
        envContent += `\nSTRIPE_WEBHOOK_SECRET=${discoveredSecret}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log(`[Stripe Auto-Forwarder] ✓ Automatically synced STRIPE_WEBHOOK_SECRET to backend/.env`);
    } catch (err) {
      console.warn(`[Stripe Auto-Forwarder] Notice: Could not auto-update backend/.env: ${err.message}`);
    }
  }
});

stripeProcess.on('error', (err) => {
  console.warn(`[Stripe Auto-Forwarder] Notice: Stripe CLI forwarding not active: ${err.message}`);
});

process.on('SIGINT', () => {
  stripeProcess.kill();
  process.exit();
});
process.on('SIGTERM', () => {
  stripeProcess.kill();
  process.exit();
});

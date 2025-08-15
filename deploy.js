#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Anonymous Chat Deployment Helper\n');

// Check if git is initialized
if (!fs.existsSync('.git')) {
    console.log('📁 Initializing Git repository...');
    execSync('git init', { stdio: 'inherit' });
    execSync('git branch -M main', { stdio: 'inherit' });
}

// Check if package.json has correct scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!packageJson.scripts.start) {
    console.log('📝 Adding start script to package.json...');
    packageJson.scripts.start = 'node server.js';
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
}

// Add all files and commit
console.log('📦 Adding files to Git...');
execSync('git add .', { stdio: 'inherit' });

try {
    execSync('git commit -m "Deploy anonymous chat mobile app"', { stdio: 'inherit' });
    console.log('✅ Files committed successfully!');
} catch (error) {
    console.log('ℹ️  No changes to commit or already committed.');
}

console.log('\n🌐 Deployment Options:');
console.log('');
console.log('1️⃣  RENDER.COM (Recommended - Free):');
console.log('   • Go to https://render.com');
console.log('   • Sign up with GitHub');
console.log('   • New + → Web Service');
console.log('   • Connect this repository');
console.log('   • Build: npm install');
console.log('   • Start: npm start');
console.log('');
console.log('2️⃣  RAILWAY (Fast):');
console.log('   • npm install -g @railway/cli');
console.log('   • railway login');
console.log('   • railway init');
console.log('   • railway up');
console.log('');
console.log('3️⃣  HEROKU:');
console.log('   • heroku create your-app-name');
console.log('   • git push heroku main');
console.log('');
console.log('4️⃣  VERCEL:');
console.log('   • npm install -g vercel');
console.log('   • vercel');
console.log('');
console.log('📱 After deployment, users can install your chat app from any mobile browser!');
console.log('🔗 Share your deployed URL and users can install it like a native app.');
console.log('');
console.log('✨ Your WhatsApp-style anonymous chat is ready for the world! 🌍');
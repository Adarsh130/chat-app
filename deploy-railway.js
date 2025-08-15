#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Railway Deployment for Anonymous Chat\n');

// Check if Railway CLI is installed
try {
    execSync('railway --version', { stdio: 'pipe' });
    console.log('✅ Railway CLI is installed');
} catch (error) {
    console.log('📦 Installing Railway CLI...');
    try {
        execSync('npm install -g @railway/cli', { stdio: 'inherit' });
        console.log('✅ Railway CLI installed successfully');
    } catch (installError) {
        console.log('❌ Failed to install Railway CLI');
        console.log('Please run: npm install -g @railway/cli');
        process.exit(1);
    }
}

// Check if git is initialized
if (!fs.existsSync('.git')) {
    console.log('📁 Initializing Git repository...');
    execSync('git init', { stdio: 'inherit' });
    execSync('git branch -M main', { stdio: 'inherit' });
}

// Add and commit files
console.log('📦 Preparing files for deployment...');
execSync('git add .', { stdio: 'inherit' });

try {
    execSync('git commit -m "Deploy anonymous chat to Railway"', { stdio: 'inherit' });
    console.log('✅ Files committed successfully!');
} catch (error) {
    console.log('ℹ️  No changes to commit or already committed.');
}

console.log('\n🚀 Starting Railway deployment...\n');

try {
    // Login to Railway
    console.log('🔐 Logging in to Railway...');
    execSync('railway login', { stdio: 'inherit' });
    
    // Initialize Railway project
    console.log('📁 Initializing Railway project...');
    execSync('railway init', { stdio: 'inherit' });
    
    // Deploy to Railway
    console.log('🚀 Deploying to Railway...');
    execSync('railway up', { stdio: 'inherit' });
    
    console.log('\n🎉 Deployment successful!');
    console.log('\n📱 Your mobile chat app is now live!');
    console.log('🔗 Get your URL with: railway domain');
    console.log('📱 Users can now install your app from any mobile browser!');
    
    // Try to get the domain
    try {
        console.log('\n🌐 Your app URL:');
        execSync('railway domain', { stdio: 'inherit' });
    } catch (domainError) {
        console.log('Run "railway domain" to get your live URL');
    }
    
} catch (error) {
    console.log('\n❌ Deployment failed');
    console.log('Please check the error above and try again');
    console.log('\nManual deployment steps:');
    console.log('1. railway login');
    console.log('2. railway init');
    console.log('3. railway up');
}

console.log('\n✨ Your WhatsApp-style anonymous chat is ready for the world! 🌍📱');
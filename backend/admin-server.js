require('dotenv').config();
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const ADMIN_PORT = process.env.ADMIN_PORT || 5000;

// Development mode: proxy to React dev server
if (process.env.NODE_ENV === 'development') {
  console.log(`Starting Admin Dashboard in development mode on port ${ADMIN_PORT}...`);
  
  // Check if we're already running from the admin directory
  const adminDir = path.join(__dirname, 'admin');
  process.chdir(adminDir);
  
  // Set the PORT environment variable for React to use
  process.env.PORT = ADMIN_PORT;
  
  // Start React development server
  const reactProcess = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: ADMIN_PORT,
      BROWSER: 'none' // Prevent automatic browser opening
    }
  });
  
  reactProcess.on('error', (error) => {
    console.error('Failed to start React dev server:', error);
    process.exit(1);
  });
  
  reactProcess.on('close', (code) => {
    console.log(`React dev server exited with code ${code}`);
    process.exit(code);
  });
  
} else {
  // Production mode: serve built React app
  const buildPath = path.join(__dirname, 'admin', 'build');
  
  // Serve static files from the React app build directory
  app.use(express.static(buildPath));
  
  // Handle React Router - serve index.html for all routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
  
  app.listen(ADMIN_PORT, () => {
    console.log(`Admin Dashboard running on http://localhost:${ADMIN_PORT}`);
  });
}

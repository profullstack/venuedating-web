import os from 'os';
import fs from 'fs';
import path from 'path';

/**
 * Utility to determine the correct Chrome executable path for Puppeteer
 * based on the current environment
 */
export const getPuppeteerConfig = () => {
  const config = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  // If PUPPETEER_EXECUTABLE_PATH is explicitly set in environment variables, use it
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    console.log(`Using explicitly configured Chrome path: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
    config.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    return config;
  }

  // Otherwise, try to determine the path based on the environment
  const username = os.userInfo().username;
  const chromeVersion = 'linux-135.0.7049.114';
  
  // Construct the path based on the username (to differentiate between production and local)
  const chromePath = path.join(
    '/home',
    username,
    '.cache/puppeteer/chrome',
    chromeVersion,
    'chrome-linux64/chrome'
  );

  // Check if the path exists
  if (fs.existsSync(chromePath)) {
    console.log(`Detected Chrome executable at: ${chromePath}`);
    config.executablePath = chromePath;
  } else {
    console.log(`Chrome executable not found at ${chromePath}, using default Puppeteer Chrome`);
  }

  return config;
};
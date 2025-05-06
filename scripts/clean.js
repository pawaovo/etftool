const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  try {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log(`Successfully removed directory: ${distPath}`);
  } catch (err) {
    console.error(`Error removing directory ${distPath}:`, err);
    process.exit(1); // Exit with error code if deletion fails
  }
} else {
  console.log(`Directory not found, skipping removal: ${distPath}`);
} 
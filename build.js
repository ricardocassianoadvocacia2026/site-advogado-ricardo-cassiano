const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');

console.log('Building static production bundle...');

if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

// Copy index.html
if (fs.existsSync(path.join(__dirname, 'index.html'))) {
  fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(dist, 'index.html'));
}

// Copy folders: css, js, assets
const folders = ['css', 'js', 'assets'];
for (const folder of folders) {
  const srcDir = path.join(__dirname, folder);
  const destDir = path.join(dist, folder);
  if (fs.existsSync(srcDir)) {
    fs.cpSync(srcDir, destDir, { recursive: true });
    console.log(`Copied /${folder} -> dist/${folder}`);
  }
}

console.log('Build completed successfully: all files placed in dist/');

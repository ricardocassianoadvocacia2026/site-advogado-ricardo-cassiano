const fs = require('fs');
const path = require('path');

function syncTarget(targetName) {
  const targetDir = path.join(__dirname, targetName);
  console.log(`Building for ${targetName}...`);
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy index.html
  if (fs.existsSync(path.join(__dirname, 'index.html'))) {
    fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(targetDir, 'index.html'));
  }

  // Copy folders: css, js, assets, admin
  const folders = ['css', 'js', 'assets', 'admin'];
  for (const folder of folders) {
    const srcDir = path.join(__dirname, folder);
    const destDir = path.join(targetDir, folder);
    if (fs.existsSync(srcDir)) {
      fs.cpSync(srcDir, destDir, { recursive: true });
      console.log(`Copied /${folder} -> ${targetName}/${folder}`);
    }
  }
}

syncTarget('public');
syncTarget('dist');
console.log('Build completed: public/ and dist/ updated successfully.');

const fs = require('fs');
const path = require('path');

const tabPages = [
  'pages/index/index.vue',
  'pages/market/index.vue',
  'pages/trade/index.vue',
  'pages/assets/index.vue',
  'pages/mine/index.vue',
  'pages/splash/index.vue'
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(path.join(__dirname, 'src'), filePath).replace(/\\/g, '/');
  
  if (tabPages.includes(relativePath)) return;

  // Find the title from pages.json
  const pagesJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/pages.json'), 'utf-8'));
  let title = '';
  for (const page of pagesJson.pages) {
    if (page.path === relativePath.replace('.vue', '')) {
      title = page.style.navigationBarTitleText || '';
      break;
    }
  }

  // Insert component into template
  const templateMatch = content.match(/<template>\s*<view[^>]*>/);
  if (templateMatch && !content.includes('CustomNavBar')) {
    content = content.replace(
      templateMatch[0],
      `${templateMatch[0]}\n\t\t<CustomNavBar title="${title}" />`
    );
  } else {
    const templateMatch2 = content.match(/<template>\s*<scroll-view[^>]*>/);
    if (templateMatch2 && !content.includes('CustomNavBar')) {
      content = content.replace(
        templateMatch2[0],
        `${templateMatch2[0]}\n\t\t<CustomNavBar title="${title}" />`
      );
    }
  }

  // Insert import into script
  const scriptMatch = content.match(/<script setup lang="ts">\s*/);
  if (scriptMatch && !content.includes('CustomNavBar.vue')) {
    content = content.replace(
      scriptMatch[0],
      `${scriptMatch[0]}import CustomNavBar from '@/components/CustomNavBar.vue'\n\t`
    );
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Processed: ${relativePath}`);
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'components') {
      walkDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src/pages'));

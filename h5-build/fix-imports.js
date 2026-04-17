const fs = require('fs');
const path = require('path');

const VUE_APIS = ['ref', 'reactive', 'computed', 'watch', 'watchEffect', 'nextTick', 'onMounted', 'onUnmounted', 'toRef', 'toRefs', 'shallowRef', 'triggerRef', 'unref', 'isRef'];
const UNI_HOOKS = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload', 'onReachBottom', 'onPullDownRefresh', 'onPageScroll', 'onShareAppMessage', 'onLaunch', 'onAppShow', 'onAppHide', 'onLastPageBackPress', 'onExit'];

function findUsedAPIs(scriptContent) {
  const usedVue = [];
  const usedUni = [];

  for (const api of VUE_APIS) {
    const re = new RegExp(`\\b${api}\\b\\s*[(<]`, 'g');
    if (re.test(scriptContent)) {
      usedVue.push(api);
    }
  }

  for (const hook of UNI_HOOKS) {
    const re = new RegExp(`\\b${hook}\\b\\s*\\(`, 'g');
    if (re.test(scriptContent)) {
      usedUni.push(hook);
    }
  }

  return { usedVue, usedUni };
}

function alreadyImported(scriptContent, name) {
  const patterns = [
    new RegExp(`import\\s+\\{[^}]*\\b${name}\\b[^}]*\\}\\s+from`),
    new RegExp(`import\\s+${name}\\s+from`),
  ];
  return patterns.some(p => p.test(scriptContent));
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const scriptMatch = content.match(/<script\s+setup[^>]*>([\s\S]*?)<\/script>/);
  if (!scriptMatch) return false;

  const scriptContent = scriptMatch[1];
  const { usedVue, usedUni } = findUsedAPIs(scriptContent);

  const needVue = usedVue.filter(api => !alreadyImported(scriptContent, api));
  const needUni = usedUni.filter(hook => !alreadyImported(scriptContent, hook));

  if (needVue.length === 0 && needUni.length === 0) return false;

  const imports = [];
  if (needVue.length > 0) {
    imports.push(`import { ${needVue.join(', ')} } from 'vue'`);
  }
  if (needUni.length > 0) {
    imports.push(`import { ${needUni.join(', ')} } from '@dcloudio/uni-app'`);
  }

  const importBlock = '\t' + imports.join('\n\t');
  const scriptTag = content.match(/<script\s+setup[^>]*>/)[0];
  
  const existingImports = scriptContent.match(/^\s*import\s+.*$/m);
  if (existingImports) {
    content = content.replace(
      scriptTag + scriptMatch[1],
      scriptTag + '\n' + importBlock + scriptMatch[1]
    );
  } else {
    content = content.replace(
      scriptTag,
      scriptTag + '\n' + importBlock + '\n'
    );
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Fixed: ${path.relative(process.cwd(), filePath)} (+vue: [${needVue}] +uni: [${needUni}])`);
  return true;
}

function walkDir(dir) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      count += walkDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      if (processFile(fullPath)) count++;
    }
  }
  return count;
}

const srcDir = path.join(__dirname, 'src');
const fixed = walkDir(srcDir);
console.log(`\nTotal files fixed: ${fixed}`);

const fs = require('fs');
const path = require('path');

// 确保public目录存在
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
  console.log('创建public目录');
}

// 要复制的文件列表
const filesToCopy = [
  '150plan.html',
  '150plan-simple.html',
  '150plan-local.html',
  'splan.html',
  'asset-ratio.html',
  'plan-data.css',
  'styles.css',
  'plan-data.js',
  'asset-distribution-chart.js',
  'dateUtils.js',
  'script.js',
  'set-distribution-chart.js'
];

// 要复制的目录列表
const dirsToCopy = [
  'styles'
];

// 复制单个文件
function copyFile(src, dest) {
  try {
    const data = fs.readFileSync(src);
    fs.writeFileSync(dest, data);
    console.log(`已复制文件: ${src} -> ${dest}`);
  } catch (err) {
    console.error(`复制文件失败: ${src}`, err);
  }
}

// 递归复制目录及其内容
function copyDir(src, dest) {
  // 创建目标目录
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // 读取源目录内容
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  // 处理每个条目
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // 递归复制子目录
      copyDir(srcPath, destPath);
    } else {
      // 复制文件
      copyFile(srcPath, destPath);
    }
  }
}

// 复制所有文件到public目录
for (const file of filesToCopy) {
  if (fs.existsSync(file)) {
    copyFile(file, `public/${file}`);
  } else {
    console.warn(`文件不存在，跳过: ${file}`);
  }
}

// 复制目录
for (const dir of dirsToCopy) {
  if (fs.existsSync(dir)) {
    copyDir(dir, `public/${dir}`);
    console.log(`已复制目录: ${dir} -> public/${dir}`);
  } else {
    console.warn(`目录不存在，跳过: ${dir}`);
  }
}

// 复制数据文件
if (fs.existsSync('etf.json')) {
  copyFile('etf.json', 'public/etf.json');
}
if (fs.existsSync('adjust.json')) {
  copyFile('adjust.json', 'public/adjust.json');
}

console.log('所有文件已复制到public目录'); 
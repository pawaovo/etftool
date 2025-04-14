const fs = require('fs');
const path = require('path');

// 确保public目录存在
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
  console.log('创建public目录');
}

// 要复制的文件列表
const filesToCopy = [
  // HTML文件
  '150plan.html',
  '150plan-simple.html',
  '150plan-local.html',
  'splan.html',
  'asset-ratio.html',
  'grid-test.html',
  'page-template.html',
  
  // CSS文件
  'plan-data.css',
  'styles.css',
  
  // JS文件
  'plan-data.js',
  'asset-distribution-chart.js',
  'asset-distribution-data.js',
  'dateUtils.js',
  'script.js',
  'set-distribution-chart.js',
  
  // 确保数据文件也被复制
  'etf.json',
  'adjust.json',
  'class-distribution.json'
];

// 要复制的目录列表
const dirsToCopy = [
  'styles',
  'data'
];

// 复制单个文件
function copyFile(src, dest) {
  try {
    if (fs.existsSync(src)) {
      const data = fs.readFileSync(src);
      fs.writeFileSync(dest, data);
      console.log(`已复制文件: ${src} -> ${dest}`);
    } else {
      console.warn(`文件不存在，跳过: ${src}`);
    }
  } catch (err) {
    console.error(`复制文件失败: ${src}`, err);
  }
}

// 递归复制目录及其内容
function copyDir(src, dest) {
  // 检查源目录是否存在
  if (!fs.existsSync(src)) {
    console.warn(`目录不存在，跳过: ${src}`);
    return;
  }
  
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
  
  console.log(`已复制目录: ${src} -> ${dest}`);
}

// 复制所有文件到public目录
for (const file of filesToCopy) {
  copyFile(file, `public/${file}`);
}

// 复制目录
for (const dir of dirsToCopy) {
  copyDir(dir, `public/${dir}`);
}

// 生成index.html (指向150plan.html)
const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=150plan.html">
  <title>重定向到E大150计划</title>
</head>
<body>
  <p>如果没有自动跳转，请<a href="150plan.html">点击这里</a>。</p>
</body>
</html>`;

fs.writeFileSync('public/index.html', indexHtml);
console.log('已创建index.html重定向文件');

console.log('所有文件已复制到public目录'); 
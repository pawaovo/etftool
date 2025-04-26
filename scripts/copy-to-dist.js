/**
 * 构建脚本：将src目录下的文件复制到dist目录，用于构建发布版本
 */

const fs = require('fs');
const path = require('path');

// 创建目录（如果不存在）
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 递归复制目录
function copyDirectory(source, destination) {
  ensureDirectoryExists(destination);
  
  const files = fs.readdirSync(source);
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    const stats = fs.statSync(sourcePath);
    
    if (stats.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`复制文件: ${sourcePath} -> ${destPath}`);
    }
  }
}

// 更新文件中的路径引用
function updatePathReferences(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  // 只处理HTML和JS文件
  if (!['.html', '.js'].some(ext => filePath.endsWith(ext))) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 更新CSS路径
  content = content.replace(/href="styles\.css"/g, 'href="css/styles.css"');
  content = content.replace(/href="plan-data\.css"/g, 'href="css/plan-data.css"');
  content = content.replace(/href="styles\/etf-cards\.css"/g, 'href="css/styles/etf-cards.css"');
  
  // 更新JS路径
  content = content.replace(/src="script\.js"/g, 'src="js/script.js"');
  content = content.replace(/src="plan-data\.js"/g, 'src="js/plan-data.js"');
  content = content.replace(/src="dateUtils\.js"/g, 'src="js/dateUtils.js"');
  content = content.replace(/src="asset-distribution-data\.js"/g, 'src="js/asset-distribution-data.js"');
  content = content.replace(/src="asset-distribution-chart\.js"/g, 'src="js/asset-distribution-chart.js"');
  content = content.replace(/src="processed-data\.js"/g, 'src="js/processed-data.js"');
  
  // 更新数据文件路径
  content = content.replace(/"data\/fund-data\.json"/g, '"data/fund/fund-data.json"');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`更新文件路径引用: ${filePath}`);
}

// 构建流程
function build() {
  const srcDir = path.join(__dirname, '..', 'src');
  const distDir = path.join(__dirname, '..', 'dist');
  
  // 确保目标目录存在
  ensureDirectoryExists(distDir);
  ensureDirectoryExists(path.join(distDir, 'js'));
  ensureDirectoryExists(path.join(distDir, 'css'));
  ensureDirectoryExists(path.join(distDir, 'css', 'styles'));
  ensureDirectoryExists(path.join(distDir, 'data'));
  ensureDirectoryExists(path.join(distDir, 'data', 'fund'));
  
  // 复制HTML文件
  const htmlFiles = ['index.html', '150plan.html', 'splan.html', 'gridplan.html'];
  for (const file of htmlFiles) {
    const sourcePath = path.join(srcDir, file);
    const destPath = path.join(distDir, file);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`复制HTML文件: ${sourcePath} -> ${destPath}`);
      updatePathReferences(destPath);
    }
  }
  
  // 复制JS文件
  copyDirectory(path.join(srcDir, 'js'), path.join(distDir, 'js'));
  
  // 复制CSS文件
  copyDirectory(path.join(srcDir, 'css'), path.join(distDir, 'css'));
  
  // 复制数据文件
  copyDirectory(path.join(srcDir, 'data'), path.join(distDir, 'data'));
  
  console.log('构建完成！所有文件已复制到dist目录。');
}

build(); 
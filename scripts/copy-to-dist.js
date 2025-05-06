/**
 * 构建脚本：将项目源文件（来自 public/, grid/, styles/, src/js/ 等）
 * 复制并整理到 dist/ 目录，用于构建发布版本。
 */

const fs = require('fs');
const path = require('path');

// -- 辅助函数 --

// 创建目录（如果不存在）
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`创建目录: ${dirPath}`);
  }
}

// 递归复制目录
function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    console.warn(`警告: 源目录不存在，跳过复制: ${source}`);
    return;
  }
  ensureDirectoryExists(destination);
  const files = fs.readdirSync(source);
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    const stats = fs.statSync(sourcePath);
    if (stats.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`复制文件: ${sourcePath} -> ${destPath}`);
      } catch (err) {
        console.error(`错误: 无法复制文件 ${sourcePath} 到 ${destPath}:`, err);
      }
    }
  }
}

// 复制单个文件
function copySingleFile(source, destination) {
  if (!fs.existsSync(source)) {
    console.error(`错误: 源文件不存在，无法复制: ${source}`);
    return;
  }
  const destDir = path.dirname(destination);
  ensureDirectoryExists(destDir);
  try {
    fs.copyFileSync(source, destination);
    console.log(`复制文件: ${source} -> ${destination}`);
  } catch (err) {
    console.error(`错误: 无法复制文件 ${source} 到 ${destination}:`, err);
  }
}

// 修改文件内容中的路径引用
function modifyFileContent(filePath, modifications) {
  if (!fs.existsSync(filePath)) {
    console.warn(`警告: 文件不存在，无法修改内容: ${filePath}`);
    return;
  }
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    modifications.forEach(({ find, replace }) => {
      const regex = new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\\\$&'), 'g'); // 转义特殊字符并全局替换
      if (regex.test(content)) {
        content = content.replace(regex, replace);
        changed = true;
        console.log(`  - 在 ${path.basename(filePath)} 中: "${find}" -> "${replace}"`);
      }
    });
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`更新文件引用: ${filePath}`);
    }
  } catch (err) {
    console.error(`错误: 修改文件内容失败 ${filePath}:`, err);
  }
}

// -- 构建流程 --

function build() {
  console.log("开始构建流程...");

  const rootDir = path.join(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const gridDir = path.join(rootDir, 'grid');
  const stylesDir = path.join(rootDir, 'styles');
  const srcDir = path.join(rootDir, 'src');
  const srcJsDir = path.join(srcDir, 'js');
  const srcDataDir = path.join(srcDir, 'data');
  const distDir = path.join(rootDir, 'dist');

  // 0. 清理 dist 目录 (可选，但推荐)
  if (fs.existsSync(distDir)) {
    console.log(`清理旧的 dist 目录: ${distDir}`);
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  ensureDirectoryExists(distDir);

  // 1. 复制 HTML 文件
  console.log("\\n--- 复制 HTML 文件 ---");
  copySingleFile(path.join(publicDir, '150plan.html'), path.join(distDir, '150plan.html'));
  copySingleFile(path.join(gridDir, 'grid.html'), path.join(distDir, 'grid', 'grid.html'));
  copySingleFile(path.join(gridDir, 'grid-detail.html'), path.join(distDir, 'grid', 'grid-detail.html'));

  // 2. 复制 CSS 文件
  console.log("\\n--- 复制 CSS 文件 ---");
  copySingleFile(path.join(publicDir, 'plan-data.css'), path.join(distDir, 'plan-data.css'));
  copySingleFile(path.join(publicDir, 'styles', 'etf-cards.css'), path.join(distDir, 'styles', 'etf-cards-public.css')); // 重命名
  copyDirectory(path.join(gridDir, 'css'), path.join(distDir, 'grid', 'css'));
  copySingleFile(path.join(stylesDir, 'etf-cards.css'), path.join(distDir, 'styles', 'etf-cards.css'));

  // 3. 复制 JS 文件
  console.log("\\n--- 复制 JS 文件 ---");
  copySingleFile(path.join(publicDir, 'plan-data.js'), path.join(distDir, 'plan-data.js'));
  copySingleFile(path.join(publicDir, 'dateUtils.js'), path.join(distDir, 'dateUtils.js'));
  copySingleFile(path.join(publicDir, 'asset-distribution-data.js'), path.join(distDir, 'asset-distribution-data.js'));
  copySingleFile(path.join(publicDir, 'asset-distribution-chart.js'), path.join(distDir, 'asset-distribution-chart.js'));
  copyDirectory(path.join(gridDir, 'js'), path.join(distDir, 'grid', 'js'));
  copySingleFile(path.join(srcJsDir, 'processed-data.js'), path.join(distDir, 'processed-data.js'));
  // -- 添加调试步骤：将处理后的数据复制为 txt 文件，方便在线查看 --
  copySingleFile(path.join(srcJsDir, 'processed-data.js'), path.join(distDir, 'debug', 'processed-data.txt'));
  // -- 调试步骤结束 --

  // 4. 复制原始数据文件 (从 src/data/ 到 dist/data/)
  console.log("\\n--- 复制原始数据文件 ---");
  copyDirectory(srcDataDir, path.join(distDir, 'data'));

  // 4b. 复制网格数据文件 (从 public/data/grid/ 到 dist/data/grid/)
  console.log("\\n--- 复制网格数据文件 ---");
  copyDirectory(path.join(publicDir, 'data', 'grid'), path.join(distDir, 'data', 'grid'));

  // 5. 修复 HTML 文件中的引用路径
  console.log("\\n--- 修复 HTML 引用 ---");

  // 修复 dist/150plan.html (移除路径修改)
  // modifyFileContent(path.join(distDir, '150plan.html'), [
  //   { find: 'href="styles/etf-cards.css"', replace: 'href="styles/etf-cards-public.css"' }
  // ]);

  // 修复 dist/grid/grid.html
  modifyFileContent(path.join(distDir, 'grid', 'grid.html'), [
    { find: 'href="../styles/etf-cards.css"', replace: 'href="../styles/etf-cards.css"' }, // 确认指向 dist/styles/etf-cards.css
    { find: 'href="../public/150plan.html"', replace: 'href="../150plan.html"' }
  ]);

  // 修复 dist/grid/grid-detail.html (相对路径应该不用改)
  // modifyFileContent(path.join(distDir, 'grid', 'grid-detail.html'), [
  //   // ...
  // ]);

  console.log("\\n构建完成！所有文件已复制并整理到 dist 目录。");
}

// 执行构建
build(); 
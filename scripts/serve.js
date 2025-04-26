/**
 * 开发服务器脚本，用于本地预览
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// MIME类型映射表
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

// 默认端口
const PORT = process.env.PORT || 8080;

// 静态文件目录
const STATIC_DIR = path.join(__dirname, '..', 'dist');

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 解析请求的URL路径
  let url = req.url;
  
  // 默认访问index.html
  if (url === '/' || url === '') {
    url = '/index.html';
  }
  
  // 移除URL中的查询参数
  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) {
    url = url.substring(0, queryIndex);
  }
  
  // 获取文件的完整路径
  const filePath = path.join(STATIC_DIR, url);
  
  // 获取文件扩展名
  const extname = path.extname(filePath).toLowerCase();
  
  // 确定内容类型
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // 尝试读取文件
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // 如果文件不存在或出错
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1><p>The requested resource was not found on this server.</p>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Internal Server Error</h1><p>An error occurred while processing your request.</p>');
        console.error(`服务器错误: ${err.message}`);
      }
    } else {
      // 文件成功读取，返回内容
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
      console.log(`提供文件: ${filePath}`);
    }
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}/`);
  console.log(`静态文件目录: ${STATIC_DIR}`);
  console.log('按 Ctrl+C 停止服务器');
}); 
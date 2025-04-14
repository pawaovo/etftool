/**
 * 简易的本地Web服务器脚本
 * 用于提供ETF工具的静态文件服务
 * 
 * 使用方法:
 * 1. 确保已安装Node.js
 * 2. 在命令行中运行: node serve.js
 * 3. 打开浏览器访问: http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 配置端口号
const PORT = process.env.PORT || 3000;

// MIME类型映射表
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    console.log(`请求: ${req.method} ${req.url}`);

    // 获取请求的URL路径
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './150plan.html'; // 默认页面
    }

    // 获取文件扩展名
    const extname = path.extname(filePath).toLowerCase();
    
    // 设置内容类型
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    // 读取文件
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 文件不存在
                console.error(`文件不存在: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 未找到</h1><p>请求的文件不存在</p>');
            } else {
                // 服务器错误
                console.error(`服务器错误: ${err.code}`);
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`<h1>500 服务器错误</h1><p>${err.code}</p>`);
            }
        } else {
            // 成功 - 返回文件内容
            res.writeHead(200, { 
                'Content-Type': contentType,
                // 对于大文件添加缓存控制，但对于json文件禁用缓存
                'Cache-Control': extname === '.json' ? 'no-cache, no-store' : 'public, max-age=3600' 
            });
            res.end(content);
        }
    });
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('按Ctrl+C终止服务器');
});

// 处理终止信号
process.on('SIGINT', () => {
    console.log('服务器已停止');
    process.exit(0);
}); 
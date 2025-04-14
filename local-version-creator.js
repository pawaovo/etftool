/**
 * 本地版本生成器
 * 创建一个可通过file://协议访问的150plan-local.html版本
 * 将JSON数据内嵌到HTML文件中解决CORS限制
 */
const fs = require('fs');
const path = require('path');

// 文件路径
const sourceHtmlPath = '150plan.html';
const jsonDataPath = 'class-distribution.json';
const outputHtmlPath = '150plan-local.html';

console.log('开始创建本地版HTML文件...');

try {
    // 读取HTML和JSON文件
    const htmlContent = fs.readFileSync(sourceHtmlPath, 'utf8');
    const jsonData = fs.readFileSync(jsonDataPath, 'utf8');
    
    console.log(`成功读取原始文件: ${sourceHtmlPath} 和 ${jsonDataPath}`);
    
    // 创建内嵌JSON数据的脚本标签
    const embeddedDataScript = `
    <!-- 内嵌资产分布数据 - 仅用于本地版本 -->
    <script>
        // 预加载的JSON数据，解决本地file://访问的CORS问题
        window.preloadedAssetDistributionData = ${jsonData};
        
        // 拦截fetch请求，当请求class-distribution.json时直接返回预加载数据
        const originalFetch = window.fetch;
        window.fetch = function(resource, options) {
            // 如果是请求class-distribution.json，直接返回预加载数据
            if (resource === 'class-distribution.json') {
                console.log('使用内嵌预加载数据代替fetch请求');
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve(window.preloadedAssetDistributionData)
                });
            }
            
            // 其他请求正常处理
            return originalFetch.apply(this, arguments);
        };
    </script>
    `;
    
    // 修改HTML内容，添加内嵌数据脚本在head结束标签前
    const modifiedHtml = htmlContent.replace('</head>', `${embeddedDataScript}\n</head>`);
    
    // 添加本地版本说明
    const localVersionNote = `
    <!-- 本地版本提示 -->
    <div style="background-color: #f8f9fa; border: 1px solid #ddd; padding: 10px; margin: 10px; border-radius: 4px; font-size: 14px;">
        <p style="margin: 0"><strong>本地版本提示:</strong> 您正在查看内嵌数据的本地版本，可直接通过file://协议访问。</p>
    </div>
    `;
    
    // 将提示添加到body开始标签后面
    const finalHtml = modifiedHtml.replace('<body>', `<body>${localVersionNote}`);
    
    // 写入新的HTML文件
    fs.writeFileSync(outputHtmlPath, finalHtml, 'utf8');
    
    console.log(`本地版HTML文件创建成功: ${outputHtmlPath}`);
    console.log('您现在可以直接通过file://协议打开此文件，无需Web服务器');
    
} catch (error) {
    console.error('创建本地版HTML时出错:', error);
} 
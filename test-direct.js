const fs = require('fs');
const { exec } = require('child_process');

// 读取配置文件中的令牌
const config = JSON.parse(fs.readFileSync('./mcp-config.json', 'utf8'));
const token = config.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN;

console.log('测试MCP GitHub服务器...');

// 在环境变量中设置令牌并直接运行命令
const env = { ...process.env, GITHUB_PERSONAL_ACCESS_TOKEN: token };

// 使用PowerShell启动一个简单的测试
const command = 'npx @modelcontextprotocol/server-github --test';

exec(command, { env }, (error, stdout, stderr) => {
  if (error) {
    console.error(`执行错误: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`标准错误: ${stderr}`);
  }
  
  console.log(`输出: ${stdout}`);
  console.log('MCP服务器测试完成');
  
  // 延迟一点时间后，实际启动服务器
  console.log('\n如果您想启动实际的MCP服务器，可以运行以下命令:');
  console.log('npx @modelcontextprotocol/server-github');
}); 
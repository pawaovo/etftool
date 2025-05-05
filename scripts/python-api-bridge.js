const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置路径
const gridDataDir = path.join(__dirname, '../public/data/grid');
const netValuesFilePath = path.join(gridDataDir, 'latest_netvalues.json');
const pythonScript = path.join(__dirname, '../fetch_fund_data.py');

// 调用Python脚本获取基金数据
function fetchFundDataWithPython() {
  return new Promise((resolve, reject) => {
    console.log('调用Python脚本获取基金数据...');
    console.log(`Python脚本路径: ${pythonScript}`);
    
    // 检查Python脚本是否存在
    if (!fs.existsSync(pythonScript)) {
      reject(new Error(`Python脚本不存在: ${pythonScript}`));
      return;
    }
    
    // 调用Python脚本
    const python = spawn('python', [pythonScript]);
    
    let dataString = '';
    let errorString = '';
    
    // 收集标准输出
    python.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    // 收集标准错误
    python.stderr.on('data', (data) => {
      console.log(data.toString());
      errorString += data.toString();
    });
    
    // 处理脚本执行完成
    python.on('close', (code) => {
      console.log(`Python脚本执行完成，退出码: ${code}`);
      
      if (code !== 0) {
        reject(new Error(`Python脚本执行失败，退出码: ${code}\n${errorString}`));
        return;
      }
      
      try {
        // 解析JSON数据
        const fundData = JSON.parse(dataString);
        resolve(fundData);
      } catch (error) {
        reject(new Error(`解析Python脚本输出失败: ${error.message}\n输出内容: ${dataString}`));
      }
    });
    
    // 处理错误
    python.on('error', (error) => {
      reject(new Error(`启动Python脚本失败: ${error.message}`));
    });
  });
}

// 主函数
async function updateNetValues() {
  try {
    // 获取基金数据
    const fundData = await fetchFundDataWithPython();
    
    // 检查数据是否有效
    const fundCount = Object.keys(fundData).filter(key => key !== 'lastUpdated').length;
    
    if (fundCount === 0) {
      console.error('未获取到任何基金数据，操作取消');
      return;
    }
    
    console.log(`成功获取 ${fundCount} 个基金的数据`);
    
    // 备份现有文件
    if (fs.existsSync(netValuesFilePath)) {
      const backupPath = `${netValuesFilePath}.backup`;
      fs.copyFileSync(netValuesFilePath, backupPath);
      console.log(`已备份现有净值数据文件到: ${backupPath}`);
    }
    
    // 保存数据
    fs.writeFileSync(netValuesFilePath, JSON.stringify(fundData, null, 2));
    console.log(`已将新的净值数据保存到: ${netValuesFilePath}`);
    
  } catch (error) {
    console.error('更新净值数据时出错:', error.message);
  }
}

// 如果作为主程序运行
if (require.main === module) {
  updateNetValues();
}

module.exports = { updateNetValues }; 
/**
 * ETF数据更新脚本
 * 从天天基金网获取最新基金数据并更新JSON文件
 */

// 获取基金数据的函数
async function getFundData(fundCode) {
  try {
    // 使用天天基金API获取基金信息
    // 这是一个非官方接口，返回的是JSONP格式
    const response = await fetch(`https://fundgz.1234567.com.cn/js/${fundCode}.js?rt=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // 解析JSONP格式数据，格式通常是: jsonpgz({"fundcode":"000071","name":"华宝证券ETF联接",...})
    const jsonStr = text.match(/\{.*\}/);
    if (!jsonStr) {
      throw new Error('无法解析基金数据');
    }
    
    const fundInfo = JSON.parse(jsonStr[0]);
    console.log(`成功获取基金${fundCode}数据:`, fundInfo);
    
    return {
      code: fundInfo.fundcode,
      name: fundInfo.name,
      netValue: parseFloat(fundInfo.dwjz),      // 单位净值
      estValue: parseFloat(fundInfo.gsz),       // 估算净值
      dayGrowth: parseFloat(fundInfo.gszzl),    // 估算涨幅
      updateTime: fundInfo.gztime               // 更新时间
    };
  } catch (error) {
    console.error(`获取基金${fundCode}数据失败:`, error);
    return null;
  }
}

// 读取现有数据
async function readFundDataFile() {
  try {
    const response = await fetch('data/fund-data.json');
    return await response.json();
  } catch (error) {
    console.error('读取基金数据文件失败:', error);
    return null;
  }
}

// 更新基金数据
async function updateFundData() {
  // 读取现有数据
  const fundData = await readFundDataFile();
  if (!fundData) {
    console.error('无法更新基金数据: 缺少基础数据文件');
    return;
  }
  
  // 获取今天的日期
  const today = new Date().toISOString().split('T')[0];
  
  // 更新lastUpdate字段
  fundData.lastUpdate = today;
  
  // 遍历所有基金代码并更新数据
  for (const fundCode of fundData.fundCodes) {
    const newFundData = await getFundData(fundCode);
    if (newFundData) {
      // 查找这个基金在哪个资产类别中
      for (const asset of fundData.assets) {
        const fundIndex = asset.funds.findIndex(f => f.code === fundCode);
        if (fundIndex !== -1) {
          // 找到基金，更新数据
          const fund = asset.funds[fundIndex];
          
          // 计算预估价格差
          const priceDiff = (newFundData.estValue - fund.avgPrice) / fund.avgPrice * 100;
          
          // 更新基金数据，但保持某些原始字段不变
          fund.name = newFundData.name;  // 更新名称，以防有变化
          fund.estValue = newFundData.estValue;
          fund.priceDiff = parseFloat(priceDiff.toFixed(2));
          fund.updateTime = today;
          
          console.log(`更新基金[${fund.name}]数据: 估值=${fund.estValue}, 价差=${fund.priceDiff}%`);
          break;
        }
      }
    }
  }
  
  // 更新每个资产组的统计数据
  updateAssetStats(fundData);
  
  // 将更新后的数据保存回文件（这里只是打印，实际需要服务器端支持）
  console.log('更新后的数据:', JSON.stringify(fundData, null, 2));
  console.log('数据更新完成。在真实环境中，你需要将数据保存回服务器。');
  
  // 在浏览器中，我们无法直接写入文件，需要：
  // 1. 使用localStorage临时存储
  localStorage.setItem('fundData', JSON.stringify(fundData));
  console.log('已将更新后的数据保存到localStorage');
  
  // 2. 提示用户数据已更新
  alert('基金数据已更新！点击确定刷新页面查看最新数据。');
  
  // 3. 刷新页面以显示新数据
  location.reload();
}

// 更新资产组统计数据
function updateAssetStats(fundData) {
  for (const asset of fundData.assets) {
    // 计算总份数
    asset.shares = asset.funds.reduce((sum, fund) => sum + fund.shares, 0);
    
    // 计算加权平均收益率
    let totalValue = 0;
    let weightedProfit = 0;
    
    for (const fund of asset.funds) {
      const fundValue = fund.shares * fund.avgPrice;
      totalValue += fundValue;
      weightedProfit += fundValue * fund.priceDiff;
    }
    
    asset.profit = totalValue > 0 ? parseFloat((weightedProfit / totalValue).toFixed(2)) : 0;
    
    console.log(`更新资产组[${asset.name}]统计: 总份数=${asset.shares}, 收益率=${asset.profit}%`);
  }
  
  // 计算总投资额和资产占比
  let totalInvested = 0;
  
  for (const asset of fundData.assets) {
    for (const fund of asset.funds) {
      totalInvested += fund.shares * fund.avgPrice;
    }
  }
  
  // 更新fundStatus
  fundData.fundStatus.invested = parseFloat(totalInvested.toFixed(2));
  
  // 更新每个资产的占比
  for (const asset of fundData.assets) {
    let assetValue = 0;
    for (const fund of asset.funds) {
      assetValue += fund.shares * fund.avgPrice;
    }
    asset.ratio = parseFloat(((assetValue / totalInvested) * 100).toFixed(2));
  }
}

// 主函数 - 添加一个更新按钮到页面
function addUpdateButton() {
  // 创建按钮
  const updateButton = document.createElement('button');
  updateButton.textContent = '更新基金数据';
  updateButton.style.position = 'fixed';
  updateButton.style.bottom = '20px';
  updateButton.style.right = '20px';
  updateButton.style.padding = '10px 15px';
  updateButton.style.backgroundColor = '#1a73e8';
  updateButton.style.color = 'white';
  updateButton.style.border = 'none';
  updateButton.style.borderRadius = '4px';
  updateButton.style.cursor = 'pointer';
  updateButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
  updateButton.style.zIndex = '1000';
  
  // 添加悬停效果
  updateButton.addEventListener('mouseover', () => {
    updateButton.style.backgroundColor = '#1557b0';
  });
  updateButton.addEventListener('mouseout', () => {
    updateButton.style.backgroundColor = '#1a73e8';
  });
  
  // 添加点击事件
  updateButton.addEventListener('click', () => {
    updateButton.textContent = '更新中...';
    updateButton.disabled = true;
    
    updateFundData().finally(() => {
      updateButton.textContent = '更新基金数据';
      updateButton.disabled = false;
    });
  });
  
  // 添加到页面
  document.body.appendChild(updateButton);
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  console.log('ETF数据更新脚本已加载');
  
  // 检查localStorage中是否有更新的数据
  const storedData = localStorage.getItem('fundData');
  if (storedData) {
    console.log('从localStorage加载数据');
    window.localFundData = JSON.parse(storedData);
  }
  
  // 添加更新按钮
  addUpdateButton();
}); 
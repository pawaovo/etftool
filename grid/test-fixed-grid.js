// 测试脚本：验证修复后的网格计算逻辑
// 使用方法：
// 1. 在网页中打开开发者控制台(F12)
// 2. 将此脚本代码复制到控制台并执行
// 3. 或者使用以下方法加载脚本:
//    const script = document.createElement('script'); 
//    script.src = 'js/test-fixed-grid.js'; 
//    document.head.appendChild(script);

/**
 * 测试档位计算逻辑修复效果
 * 1. 检查小网档位加码系数累加效果
 * 2. 检查中网和大网加码系数效果
 */
function testFixedGridCalculation() {
  console.log('===== 测试修复后的网格计算逻辑 =====');
  
  // 创建测试参数（同PRD文档示例）
  const testParams = {
    basePrice: 1.00,                // 基准价
    unitAmount: 10000,              // 每份金额
    minPrice: 0.10,                 // 最低价
    smallGridStep: 5.0,             // 小网步长(%)
    mediumGridStep: 15.0,           // 中网步长(%)
    largeGridStep: 30.0,            // 大网步长(%)
    levelCoeff: 1.0,                // 档位加码系数(1%)
    startLevel: 4,                  // 小网从第4档开始加码（PRD中指定）
    amountCoeff: 1.0,               // 金额加码系数
    profitCoeff: 1.0,               // 保留利润系数
    minTradeUnit: 100,              // 最小交易单位
    minQuoteUnit: 0.001             // 最小报价单位
  };
  
  // 立即计算网格
  const result = calculateGrid(testParams);
  
  // 1. 验证小网档位
  console.log('小网档位验证:');
  const smallGridRows = result.gridData.filter(row => row.type === "小网");
  
  // 预期值
  const expectedSmallGridLevels = [
    1.000, 0.950, 0.900, 0.840, 0.770, 0.690, 0.600, 0.500, 0.390, 0.270, 0.130
  ];
  
  console.log('小网档位实际值:');
  const actualSmallGridLevels = smallGridRows.map(row => row.level);
  console.table(actualSmallGridLevels.map((level, index) => ({
    档位序号: index + 1,
    预期值: expectedSmallGridLevels[index] || '-',
    实际值: level.toFixed(3),
    是否匹配: expectedSmallGridLevels[index] 
      ? Math.abs(level - expectedSmallGridLevels[index]) < 0.001 
      : '-'
  })));
  
  // 2. 验证中网档位
  console.log('\n中网档位验证:');
  const mediumGridRows = result.gridData.filter(row => row.type === "中网");
  
  // 预期值
  const expectedMediumGridLevels = [
    0.850, 0.680, 0.490, 0.270
  ];
  
  console.log('中网档位实际值:');
  const actualMediumGridLevels = mediumGridRows.map(row => row.level);
  console.table(actualMediumGridLevels.map((level, index) => ({
    档位序号: index + 1,
    预期值: expectedMediumGridLevels[index] || '-',
    实际值: level.toFixed(3),
    是否匹配: expectedMediumGridLevels[index] 
      ? Math.abs(level - expectedMediumGridLevels[index]) < 0.001 
      : '-'
  })));
  
  // 3. 验证大网档位
  console.log('\n大网档位验证:');
  const largeGridRows = result.gridData.filter(row => row.type === "大网");
  
  // 预期值
  const expectedLargeGridLevels = [
    0.700, 0.360
  ];
  
  console.log('大网档位实际值:');
  const actualLargeGridLevels = largeGridRows.map(row => row.level);
  console.table(actualLargeGridLevels.map((level, index) => ({
    档位序号: index + 1,
    预期值: expectedLargeGridLevels[index] || '-',
    实际值: level.toFixed(3),
    是否匹配: expectedLargeGridLevels[index] 
      ? Math.abs(level - expectedLargeGridLevels[index]) < 0.001 
      : '-'
  })));
  
  // 4. 验证排序顺序是否正确（小网->中网->大网）
  console.log('\n网格类型排序验证:');
  let currentType = null;
  let isValidOrder = true;
  let lastIndex = -1;
  
  for (let i = 0; i < result.gridData.length; i++) {
    const row = result.gridData[i];
    if (currentType === null) {
      currentType = row.type;
    } else if (currentType !== row.type) {
      if (
        (currentType === "小网" && row.type !== "中网") ||
        (currentType === "中网" && row.type !== "大网")
      ) {
        console.error(`排序错误: 在索引 ${i} 处，类型从 ${currentType} 错误地变为了 ${row.type}`);
        isValidOrder = false;
      }
      currentType = row.type;
      lastIndex = i;
    }
  }
  
  if (isValidOrder) {
    console.log('✓ 排序顺序正确: 小网->中网->大网');
  } else {
    console.log('✗ 排序顺序有问题');
  }
  
  // 显示完整计算结果
  console.log('\n完整网格数据:');
  console.table(result.gridData.map(row => ({
    类型: row.type,
    档位: row.level.toFixed(3),
    买入触发价: row.buyTriggerPrice.toFixed(3),
    买入价: row.buyPrice.toFixed(3),
    买入金额: row.buyAmount,
    买入股数: row.buyQuantity,
    卖出触发价: row.sellTriggerPrice.toFixed(3),
    卖出价: row.sellPrice.toFixed(3),
    卖出股数: row.sellQuantity,
    卖出金额: row.sellAmount
  })));
  
  console.log('汇总信息:', result.summary);
  console.log('===== 测试结束 =====');
  
  return result;
}

// 如果在浏览器环境中运行此脚本，则自动执行测试
if (typeof window !== 'undefined') {
  // 确保calculateGrid函数存在
  if (typeof calculateGrid === 'function') {
    console.log('开始执行测试...');
    const fixedTestResult = testFixedGridCalculation();
    console.log('测试结果可在fixedTestResult变量中查看');
  } else {
    console.error('错误: calculateGrid函数未定义，请确保已加载grid-calculator.js文件');
  }
} 
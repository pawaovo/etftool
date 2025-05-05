// 测试脚本：验证网格类型排序逻辑

/**
 * 测试网格排序逻辑
 * 验证小网->中网->大网的排序顺序
 */
function testGridSorting() {
  console.log('===== 测试网格排序逻辑 =====');
  
  // 创建测试参数
  const testParams = {
    basePrice: 1.00,                // 基准价
    unitAmount: 10000,              // 每份金额
    minPrice: 0.10,                 // 最低价
    smallGridStep: 5.0,             // 小网步长(%)
    mediumGridStep: 15.0,           // 中网步长(%)
    largeGridStep: 30.0,            // 大网步长(%)
    levelCoeff: 1.0,                // 档位加码系数
    startLevel: 4,                  // 初始加码档位
    amountCoeff: 1.0,               // 金额加码系数
    profitCoeff: 1.0,               // 保留利润系数
    minTradeUnit: 100,              // 最小交易单位
    minQuoteUnit: 0.001             // 最小报价单位
  };
  
  // 计算网格
  const result = calculateGrid(testParams);
  
  // 验证排序顺序
  console.log('网格类型分布:');
  
  // 获取各网格类型的数量
  const gridTypes = {};
  result.gridData.forEach(row => {
    gridTypes[row.type] = (gridTypes[row.type] || 0) + 1;
  });
  
  console.log('各网格类型数量:', gridTypes);
  
  // 检查顺序
  let lastType = null;
  let currentTypeIndex = -1;
  const typeOrder = ["小网", "中网", "大网"];
  let isCorrectOrder = true;
  
  for (let i = 0; i < result.gridData.length; i++) {
    const rowType = result.gridData[i].type;
    const typeIndex = typeOrder.indexOf(rowType);
    
    if (lastType !== rowType) {
      if (typeIndex <= currentTypeIndex) {
        console.error(`排序错误: 在索引 ${i} 处发现错误的顺序转换: ${lastType} -> ${rowType}`);
        isCorrectOrder = false;
      }
      
      lastType = rowType;
      currentTypeIndex = typeIndex;
      console.log(`第 ${i} 行: 网格类型变为 ${rowType}`);
    }
  }
  
  if (isCorrectOrder) {
    console.log('✓ 类型排序顺序正确: 小网->中网->大网');
  } else {
    console.log('✗ 类型排序顺序有问题');
  }
  
  // 检查每种类型内部的档位排序是否正确（降序）
  let isCorrectInternalOrder = true;
  
  // 检查小网内部排序
  const smallGridRows = result.gridData.filter(row => row.type === "小网");
  for (let i = 1; i < smallGridRows.length; i++) {
    if (smallGridRows[i].level > smallGridRows[i-1].level) {
      console.error(`小网内部排序错误: 档位 ${smallGridRows[i-1].level} 后面是更大的值 ${smallGridRows[i].level}`);
      isCorrectInternalOrder = false;
    }
  }
  
  // 检查中网内部排序
  const mediumGridRows = result.gridData.filter(row => row.type === "中网");
  for (let i = 1; i < mediumGridRows.length; i++) {
    if (mediumGridRows[i].level > mediumGridRows[i-1].level) {
      console.error(`中网内部排序错误: 档位 ${mediumGridRows[i-1].level} 后面是更大的值 ${mediumGridRows[i].level}`);
      isCorrectInternalOrder = false;
    }
  }
  
  // 检查大网内部排序
  const largeGridRows = result.gridData.filter(row => row.type === "大网");
  for (let i = 1; i < largeGridRows.length; i++) {
    if (largeGridRows[i].level > largeGridRows[i-1].level) {
      console.error(`大网内部排序错误: 档位 ${largeGridRows[i-1].level} 后面是更大的值 ${largeGridRows[i].level}`);
      isCorrectInternalOrder = false;
    }
  }
  
  if (isCorrectInternalOrder) {
    console.log('✓ 各网格类型内部档位排序正确(降序)');
  } else {
    console.log('✗ 各网格类型内部档位排序有问题');
  }
  
  // 打印结果预览
  console.log('\n网格排序结果预览:');
  console.table(result.gridData.map((row, index) => ({
    索引: index,
    类型: row.type,
    档位: row.level.toFixed(3),
    买入价: row.buyPrice.toFixed(3)
  })));
  
  console.log('===== 测试结束 =====');
  
  return result;
}

// 如果在浏览器环境中运行此脚本，则自动执行测试
if (typeof window !== 'undefined') {
  // 确保calculateGrid函数存在
  if (typeof calculateGrid === 'function') {
    console.log('开始执行排序测试...');
    const sortTestResult = testGridSorting();
    console.log('排序测试结果可在sortTestResult变量中查看');
  } else {
    console.error('错误: calculateGrid函数未定义，请确保已加载grid-calculator.js文件');
  }
} 
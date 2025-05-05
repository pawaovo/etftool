// 测试脚本：用于在浏览器控制台中验证网格计算逻辑

/**
 * 测试网格计算器的UI输出
 * 1. 检查排序是否按照小网->中网->大网顺序
 * 2. 检查档位加码系数是否正确应用
 */
function testGridCalculatorUI() {
  console.log('===== 测试网格计算器UI输出 =====');
  
  // 创建测试参数（使用PRD文档示例参数）
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
    minQuoteUnit: 0.01              // 最小报价单位
  };
  
  // 立即计算网格
  const result = calculateGrid(testParams);
  
  // 1. 验证排序顺序（小网->中网->大网）
  console.log('排序顺序验证:');
  let currentType = null;
  let isValidOrder = true;
  const typeCounts = { "小网": 0, "中网": 0, "大网": 0 };
  
  for (let i = 0; i < result.gridData.length; i++) {
    const row = result.gridData[i];
    typeCounts[row.type]++;
    
    // 检查类型顺序
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
    }
  }
  
  if (isValidOrder) {
    console.log('✓ 排序顺序正确: 小网->中网->大网');
  } else {
    console.log('✗ 排序顺序有问题');
  }
  
  console.log('网格类型统计:', typeCounts);
  
  // 2. 验证档位加码系数是否正确应用
  console.log('\n档位加码系数验证:');
  
  // 提取小网档位进行验证
  const smallGridLevels = result.gridData.filter(row => row.type === "小网");
  
  // 验证小网第4档是否正确应用了加码（检查档位值）
  const smallGrid4thLevel = smallGridLevels.find(row => Math.abs(row.level - 0.85) < 0.001);
  if (smallGrid4thLevel) {
    console.log(`小网第4档(0.85): 买入价=${smallGrid4thLevel.buyPrice.toFixed(3)}`);
  } else {
    console.log('✗ 未找到小网第4档(0.85档位)');
  }
  
  // 验证中网档位（第2档开始应用加码）
  const mediumGridLevels = result.gridData.filter(row => row.type === "中网");
  if (mediumGridLevels.length >= 2) {
    const mediumGrid2ndLevel = mediumGridLevels[1]; // 第2档
    console.log(`中网第2档(${mediumGrid2ndLevel.level.toFixed(2)}): 买入价=${mediumGrid2ndLevel.buyPrice.toFixed(3)}`);
    
    // 中网第2档应该应用2倍加码，所以值应该是0.70而不是0.72
    if (Math.abs(mediumGrid2ndLevel.level - 0.70) < 0.001) {
      console.log('✓ 中网第2档正确应用了2倍加码系数');
    } else {
      console.log(`✗ 中网第2档加码系数应用可能有问题: ${mediumGrid2ndLevel.level.toFixed(2)}`);
    }
  } else {
    console.log('✗ 中网档位数量不足，无法验证加码系数');
  }
  
  // 验证大网档位（第2档开始应用加码）
  const largeGridLevels = result.gridData.filter(row => row.type === "大网");
  if (largeGridLevels.length >= 2) {
    const largeGrid2ndLevel = largeGridLevels[1]; // 第2档
    console.log(`大网第2档(${largeGrid2ndLevel.level.toFixed(2)}): 买入价=${largeGrid2ndLevel.buyPrice.toFixed(3)}`);
    
    // 大网第2档应该应用3倍加码，所以值应该是0.46而不是0.49
    if (Math.abs(largeGrid2ndLevel.level - 0.46) < 0.001) {
      console.log('✓ 大网第2档正确应用了3倍加码系数');
    } else {
      console.log(`✗ 大网第2档加码系数应用可能有问题: ${largeGrid2ndLevel.level.toFixed(2)}`);
    }
  } else {
    console.log('✗ 大网档位数量不足，无法验证加码系数');
  }
  
  // 显示完整的计算结果
  console.log('\n计算结果（前10条）:');
  const previewData = result.gridData.slice(0, 10).map(row => ({
    type: row.type,
    level: row.level.toFixed(2),
    buyPrice: row.buyPrice.toFixed(3),
    sellPrice: row.sellPrice.toFixed(3)
  }));
  console.table(previewData);
  
  // 返回计算结果供浏览器控制台进一步检查
  return result;
}

// 自动运行测试
const uiTestResult = testGridCalculatorUI();
console.log('完整测试结果可在uiTestResult变量中查看');
console.log('===== 测试结束 ====='); 
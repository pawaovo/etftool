// 测试脚本：验证档位加码系数计算逻辑

/**
 * 测试档位加码系数的计算逻辑
 * 重点测试加码系数的累加效果是否正确
 */
function testLevelCalculation() {
  console.log('===== 测试档位加码系数计算逻辑 =====');
  
  // 创建测试参数（同PRD文档示例）
  const testParams = {
    basePrice: 1.00,                // 基准价
    smallGridStep: 5.0,             // 小网步长(%)
    mediumGridStep: 15.0,           // 中网步长(%)
    largeGridStep: 30.0,            // 大网步长(%)
    levelCoeff: 1.0,                // 档位加码系数(1%)
    startLevel: 4,                  // 小网从第4档开始加码
    minPrice: 0.10,                 // 最低价
    minQuoteUnit: 0.001             // 最小报价单位
  };
  
  // 直接调用calculateLevels函数
  const levels = calculateLevels(testParams);
  
  // 1. 验证小网档位计算
  console.log('小网档位验证:');
  
  // 前三档的验证（不受加码系数影响）
  const expectedFirstThree = [1.0, 0.95, 0.9];
  const actualFirstThree = levels.small.slice(0, 3).map(l => l.value);
  
  console.log('前三档对比:');
  console.table(expectedFirstThree.map((expected, i) => ({
    档位: i + 1,
    预期值: expected.toFixed(3),
    实际值: actualFirstThree[i].toFixed(3),
    是否一致: Math.abs(expected - actualFirstThree[i]) < 0.001 ? '✓' : '✗'
  })));
  
  // 加码档位验证（第4档开始）
  const expectedWithLevelCoeff = [0.84, 0.77, 0.69, 0.6, 0.5, 0.39, 0.27, 0.13];
  const actualWithLevelCoeff = levels.small.slice(3).map(l => l.value);
  
  console.log('第4档开始的加码档位对比:');
  console.table(expectedWithLevelCoeff.map((expected, i) => ({
    档位: i + 4,
    预期值: expected.toFixed(3),
    实际值: (actualWithLevelCoeff[i] || 0).toFixed(3),
    是否一致: actualWithLevelCoeff[i] 
      ? Math.abs(expected - actualWithLevelCoeff[i]) < 0.001 ? '✓' : '✗'
      : '缺少'
  })));
  
  // 2. 验证中网档位计算
  console.log('\n中网档位验证:');
  
  // 中网档位验证（第2档开始加码，系数是小网的2倍）
  const expectedMedium = [0.85, 0.68, 0.49, 0.27];
  const actualMedium = levels.medium.map(l => l.value);
  
  console.log('中网档位对比:');
  console.table(expectedMedium.map((expected, i) => ({
    档位: i + 1,
    预期值: expected.toFixed(3),
    实际值: (actualMedium[i] || 0).toFixed(3),
    是否一致: actualMedium[i]
      ? Math.abs(expected - actualMedium[i]) < 0.001 ? '✓' : '✗'
      : '缺少'
  })));
  
  // 3. 验证大网档位计算
  console.log('\n大网档位验证:');
  
  // 大网档位验证（第2档开始加码，系数是小网的3倍）
  const expectedLarge = [0.7, 0.36];
  const actualLarge = levels.large.map(l => l.value);
  
  console.log('大网档位对比:');
  console.table(expectedLarge.map((expected, i) => ({
    档位: i + 1,
    预期值: expected.toFixed(3),
    实际值: (actualLarge[i] || 0).toFixed(3),
    是否一致: actualLarge[i]
      ? Math.abs(expected - actualLarge[i]) < 0.001 ? '✓' : '✗'
      : '缺少'
  })));
  
  // 验证累加效果是否正确
  console.log('\n加码系数累加效果验证:');
  
  // 检查小网递减幅度是否符合累加效果（应该递增）
  let isCorrectAccumulation = true;
  const smallSteps = [];
  
  for (let i = 4; i < levels.small.length; i++) {
    // 第i档与前一档的差距
    const step = levels.small[i-1].value - levels.small[i].value;
    smallSteps.push(step);
    
    // 检查每一步的递减值是否大于前一步（累加效果）
    if (i > 4 && step <= smallSteps[smallSteps.length - 2]) {
      console.error(`小网累加效果有误: 第${i}档递减幅度(${step.toFixed(3)})不大于前一档(${smallSteps[smallSteps.length - 2].toFixed(3)})`);
      isCorrectAccumulation = false;
    }
  }
  
  console.log('小网递减幅度序列:', smallSteps.map(s => s.toFixed(3)));
  
  if (isCorrectAccumulation) {
    console.log('✓ 档位加码系数累加效果正确，递减幅度逐步增加');
  } else {
    console.log('✗ 档位加码系数累加效果有问题');
  }
  
  // 完整返回所有档位数据
  console.log('\n完整档位数据:');
  console.log('小网档位:', levels.small.map(l => l.value.toFixed(3)).join(', '));
  console.log('中网档位:', levels.medium.map(l => l.value.toFixed(3)).join(', '));
  console.log('大网档位:', levels.large.map(l => l.value.toFixed(3)).join(', '));
  
  console.log('===== 测试结束 =====');
  
  return levels;
}

// 如果在浏览器环境中运行此脚本，则自动执行测试
if (typeof window !== 'undefined') {
  // 确保calculateLevels函数存在
  if (typeof calculateLevels === 'function') {
    console.log('开始执行档位计算测试...');
    const levelCalcResult = testLevelCalculation();
    console.log('测试结果可在levelCalcResult变量中查看');
  } else {
    console.error('错误: calculateLevels函数未定义，请确保已加载grid-calculator.js文件');
  }
} 
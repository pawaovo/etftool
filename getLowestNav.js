/**
 * 获取特定基金的历史最低单价
 * 分析adjust.json中的数据，查找指定fundCode的所有订单
 * 并提取其中的nav值，计算出历史最低单价
 */

const fs = require('fs');
const path = require('path');
const { convertTimestampToDate } = require('./dateUtils');

/**
 * 获取指定基金代码的历史最低单价和对应日期
 * @param {string} fundCode - 要查询的基金代码
 * @param {string} [adjustFilePath='./adjust.json'] - adjust.json文件路径
 * @returns {Object} 包含最低单价和对应日期的对象: {lowestNav: number, date: string}
 */
function getLowestNav(fundCode, adjustFilePath = './adjust.json') {
  try {
    // 读取adjust.json文件
    const adjustData = JSON.parse(fs.readFileSync(path.resolve(adjustFilePath), 'utf8'));
    
    // 用于存储所有找到的nav值和对应日期
    const navRecords = [];
    
    // 遍历所有调整记录
    for (const adjustment of adjustData) {
      // 检查是否有orders字段
      if (!adjustment.orders || !Array.isArray(adjustment.orders)) {
        continue;
      }
      
      // 遍历所有订单
      for (const order of adjustment.orders) {
        // 检查是否是目标基金
        if (order.fund && order.fund.fundCode === fundCode) {
          // 检查是否有order外部的nav值和adjustTxnDate
          if (order.nav !== undefined && order.nav !== null && order.adjustTxnDate) {
            // 获取日期
            const date = convertTimestampToDate(order.adjustTxnDate);
            
            // 添加到记录中
            navRecords.push({
              nav: parseFloat(order.nav),
              date: date
            });
          }
        }
      }
    }
    
    // 如果没有找到任何记录
    if (navRecords.length === 0) {
      return { lowestNav: null, date: null, message: `没有找到基金代码为 ${fundCode} 的记录` };
    }
    
    // 按nav值排序找出最低值
    navRecords.sort((a, b) => a.nav - b.nav);
    const lowestRecord = navRecords[0];
    
    // 返回最低nav和对应日期
    return {
      lowestNav: lowestRecord.nav,
      date: lowestRecord.date,
      totalRecords: navRecords.length,
      allRecords: navRecords // 可选，返回所有记录以便进一步分析
    };
  } catch (error) {
    return { 
      lowestNav: null, 
      date: null, 
      error: error.message 
    };
  }
}

/**
 * 获取adjust.json中所有基金的历史最低单价
 * @param {string} [adjustFilePath='./adjust.json'] - adjust.json文件路径
 * @returns {Object} 以基金代码为键，包含最低单价和日期的对象为值的字典
 */
function getAllFundsLowestNav(adjustFilePath = './adjust.json') {
  try {
    // 读取adjust.json文件
    const adjustData = JSON.parse(fs.readFileSync(path.resolve(adjustFilePath), 'utf8'));
    
    // 存储所有基金代码
    const fundCodes = new Set();
    
    // 遍历所有调整记录，收集所有基金代码
    for (const adjustment of adjustData) {
      if (!adjustment.orders || !Array.isArray(adjustment.orders)) {
        continue;
      }
      
      for (const order of adjustment.orders) {
        if (order.fund && order.fund.fundCode) {
          fundCodes.add(order.fund.fundCode);
        }
      }
    }
    
    // 对每个基金代码获取最低单价
    const result = {};
    for (const fundCode of fundCodes) {
      result[fundCode] = getLowestNav(fundCode, adjustFilePath);
    }
    
    return result;
  } catch (error) {
    return { error: error.message };
  }
}

// 导出函数
module.exports = {
  getLowestNav,
  getAllFundsLowestNav
};

// 如果直接运行此文件，测试特定基金代码
if (require.main === module) {
  // 测试查询富国中证红利指数增强A基金(100032)的历史最低单价
  const result = getLowestNav('100032');
  console.log(`基金代码 100032 的历史最低单价：${result.lowestNav}，日期：${result.date}`);
  console.log(`共找到 ${result.totalRecords} 条记录`);
  
  // 输出所有记录方便查看
  if (result.allRecords && result.allRecords.length > 0) {
    console.log('\n所有记录:');
    result.allRecords.forEach((record, index) => {
      console.log(`${index + 1}. 日期: ${record.date}, 单价: ${record.nav}`);
    });
  }
} 
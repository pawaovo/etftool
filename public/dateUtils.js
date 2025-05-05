/**
 * 时间戳转换工具函数
 * 将Unix时间戳（毫秒级）转换为标准日期格式
 */

/**
 * 将毫秒时间戳转换为标准日期格式（YYYY-MM-DD）
 * @param {number} timestamp - 毫秒级时间戳
 * @param {boolean} useChineseTimezone - 是否使用中国时区(UTC+8)，默认为true
 * @returns {string} 格式化的日期字符串
 */
function convertTimestampToDate(timestamp, useChineseTimezone = true) {
  const date = new Date(timestamp);
  
  // 如果需要使用中国时区
  if (useChineseTimezone) {
    // 获取中国时区的年、月、日
    const options = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      timeZone: 'Asia/Shanghai'
    };
    
    // 使用toLocaleDateString格式化日期，然后替换分隔符为"-"
    return date.toLocaleDateString('zh-CN', options)
      .replace(/\//g, '-');
  } else {
    // 使用UTC时间
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}

/**
 * 将标准日期格式（YYYY-MM-DD）转换为毫秒时间戳
 * @param {string} dateStr - 标准日期字符串，格式为YYYY-MM-DD
 * @param {boolean} useChineseTimezone - 是否使用中国时区(UTC+8)，默认为true
 * @returns {number} 毫秒级时间戳
 */
function convertDateToTimestamp(dateStr, useChineseTimezone = true) {
  // 解析日期字符串
  const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
  
  let timestamp;
  
  if (useChineseTimezone) {
    // 创建一个Date对象，表示中国时区的指定日期的0点
    // 注意：月份是从0开始的，所以需要减1
    const date = new Date(Date.UTC(year, month - 1, day, -8, 0, 0));
    timestamp = date.getTime();
  } else {
    // 创建一个Date对象，表示UTC时区的指定日期的0点
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    timestamp = date.getTime();
  }
  
  return timestamp;
}

// 兼容浏览器和 Node.js 的导出方式
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = {
    convertTimestampToDate,
    convertDateToTimestamp
  };

  // 将测试示例移到 Node.js 环境检查内部
  if (require.main === module) {
    // 测试时间戳转日期
    console.log('测试时间戳转日期:');
    console.log('1744128000000 =>', convertTimestampToDate(1744128000000)); // 应该输出 2025-04-09
    console.log('1743955200000 =>', convertTimestampToDate(1743955200000)); // 应该输出 2025-04-07
    console.log('1741276800000 =>', convertTimestampToDate(1741276800000)); // 应该输出 2025-03-07
    console.log('1739980800000 =>', convertTimestampToDate(1739980800000)); // 应该输出 2025-02-20
    console.log('1709740800000 =>', convertTimestampToDate(1709740800000)); // 应该输出 2024-03-07
    
    // 测试日期转时间戳
    console.log('\n测试日期转时间戳:');
    console.log('2025-04-09 =>', convertDateToTimestamp('2025-04-09')); // 应该接近 1744128000000
    console.log('2025-04-07 =>', convertDateToTimestamp('2025-04-07')); // 应该接近 1743955200000
    console.log('2025-03-07 =>', convertDateToTimestamp('2025-03-07')); // 应该接近 1741276800000
    console.log('2025-02-20 =>', convertDateToTimestamp('2025-02-20')); // 应该接近 1739980800000
    console.log('2024-03-07 =>', convertDateToTimestamp('2024-03-07')); // 应该接近 1709740800000
  }

} else if (typeof window !== 'undefined') {
  // 浏览器环境 - 将函数挂载到 window 对象下
  window.dateUtils = {
    convertTimestampToDate,
    convertDateToTimestamp
  };
}
function convertNavdataToDate(navdata) {
  // 将毫秒级时间戳转换为秒级时间戳
  const timestampInSeconds = navdata / 1000;
  // 创建 Date 对象
  const date = new Date(timestampInSeconds * 1000);
  // 获取年份
  const year = date.getFullYear();
  // 获取月份（注意：月份从 0 开始计数，所以要加 1）
  const month = String(date.getMonth() + 1).padStart(2, '0');
  // 获取日期
  const day = String(date.getDate()).padStart(2, '0');
  // 拼接成 yyyy-MM-dd 格式的日期字符串
  return `${year}-${month}-${day}`;
}

// 示例用法
const navdata1 = 1551110400000;
const navdata2 = 1509552000000;
console.log(convertNavdataToDate(navdata1));
console.log(convertNavdataToDate(navdata2));
  
/**
 * ETF投资工具数据预处理脚本
 * ===========================
 * 
 * 功能说明：
 * 1. 读取 etf.json 和 adjust.json 的原始数据
 * 2. 计算各项指标（资产占比、累计收益率等）
 * 3. 生成 processed-data.js 文件，包含预处理后的数据
 * 
 * 使用方法：
 * - 每次更新源数据（etf.json 或 adjust.json）后，必须运行此脚本
 * - 运行命令：node process-data.js
 * - 运行后会生成 processed-data.js 文件，提供给页面使用
 * 
 * 重要说明：
 * - 此脚本是数据流的关键环节，更新数据必须通过此脚本处理
 * - 页面依赖 processed-data.js 显示最新数据
 * - 若源数据更新但未重新运行此脚本，页面将继续显示旧数据
 */

// 导入必要的模块
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// 引入日期工具函数
const dateUtils = require('./dateUtils.js');

// 生成package.json文件（如果不存在）
ensurePackageJson();

// 读取源数据文件
console.log('开始读取源数据文件...');
let etfData, adjustData;

const srcDir = path.join(__dirname, '..', 'src');
const etfDataPath = path.join(srcDir, 'data', 'etf.json');
const adjustDataPath = path.join(srcDir, 'data', 'adjust.json');
const classDistributionPath = path.join(srcDir, 'data', 'class-distribution.json');
const outputPath = path.join(srcDir, 'js', 'processed-data.js');

try {
    etfData = JSON.parse(fs.readFileSync(etfDataPath, 'utf8'));
    console.log('etf.json 读取成功');
} catch (error) {
    console.error('读取etf.json失败:', error);
    process.exit(1);
}

try {
    adjustData = JSON.parse(fs.readFileSync(adjustDataPath, 'utf8'));
    console.log('adjust.json 读取成功');
} catch (error) {
    console.error('读取adjust.json失败:', error);
    process.exit(1);
}

console.log('开始处理数据...');

// 查找每个大类资产的最后操作时间
const assetLatestOperations = findAssetLatestOperations(adjustData);

// 处理ETF数据，提取所需信息
const processedData = {
    // 保留原始etf数据，以备需要
    originalData: etfData,
    
    // 处理后的资产数据
    assets: processAssets(etfData, adjustData, assetLatestOperations),
    
    // 资产最后操作时间
    assetLatestOperations: assetLatestOperations,
    
    // 最后更新时间
    lastUpdated: new Date().toISOString(),
    
    // 汇总统计数据
    summary: calculateSummary(etfData),
    
    // 大类资产排名
    assetRankings: generateAssetRankings(etfData)
};

// 输出为JS文件
const outputContent = `/**
 * 预处理后的ETF数据
 * 自动生成于 ${new Date().toLocaleString()}
 * 请勿手动修改此文件
 */

const processedData = ${JSON.stringify(processedData, null, 2)};
`;

// 确保public目录存在
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
  console.log('创建public目录');
}

fs.writeFileSync(outputPath, outputContent, 'utf8');
console.log('数据处理完成，已生成 ' + outputPath);

/**
 * 确保package.json文件存在
 */
function ensurePackageJson() {
    // 检查package.json是否存在
    if (!fs.existsSync('package.json')) {
        console.log('创建package.json文件...');
        const packageJson = {
            "name": "etftool",
            "version": "1.0.0",
            "description": "ETF数据处理工具",
            "main": "index.js",
            "scripts": {
                "build": "node process-data.js",
                "start": "python -m http.server 8080"
            },
            "engines": {
                "node": ">=18.0.0"
            },
            "author": "",
            "license": "ISC",
            "dependencies": {}
        };

        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('package.json文件创建成功');
    }
}

/**
 * 计算汇总统计数据
 * @param {Object} etfData - 原始ETF数据
 * @returns {Object} 汇总统计数据
 */
function calculateSummary(etfData) {
    let totalUnit = 0;
    let totalProfit = 0;
    let totalAssets = 0;
    let assetDistribution = {};
    
    // 遍历所有资产类别
    if (etfData.composition && Array.isArray(etfData.composition)) {
        etfData.composition.forEach(assetClass => {
            // 累加总份数
            totalUnit += assetClass.unit || 0;
            
            // 获取累计收益率
            let accProfitRate = assetClass.accProfitRate;
            
            // 特殊处理现金类资产，从compList中获取accProfit
            if (assetClass.isCash && assetClass.className === '现金' && 
                assetClass.compList && assetClass.compList.length > 0) {
                // 使用现金compList中的accProfit
                accProfitRate = assetClass.compList[0].accProfit || 0;
            }
            
            // 计算该资产的总收益（份数 * 收益率）
            const assetProfit = (assetClass.unit || 0) * (accProfitRate || 0);
            totalProfit += assetProfit;
            
            // 计算资产分布
            assetDistribution[assetClass.className] = {
                unit: assetClass.unit || 0,
                percent: assetClass.percent || 0,
                accProfitRate: accProfitRate || 0
            };
        });
    }
    
    return {
        totalUnit,
        totalProfit,
        assetDistribution,
        avgProfitRate: totalUnit > 0 ? (totalProfit / totalUnit) : 0
    };
}

/**
 * 查找每个大类资产的最后操作时间
 * @param {Array} adjustData - 调整数据
 * @returns {Object} 各大类资产的最后操作时间
 */
function findAssetLatestOperations(adjustData) {
    // 定义大类资产及其最新操作时间
    const assetOperationTimes = {
        'A股': 0,
        '海外债券': 0,
        '海外新兴市场股票': 0,
        '海外成熟市场股票': 0,
        '境内债券': 0,
        '现金': 0,
        '黄金': 0,
        '原油': 0
    };
    
    // 遍历所有调整记录
    if (adjustData && Array.isArray(adjustData)) {
        adjustData.forEach(adjustment => {
            // 确保orders字段存在且是数组
            if (adjustment.orders && Array.isArray(adjustment.orders)) {
                // 遍历每个调整中的所有订单
                adjustment.orders.forEach(order => {
                    const largeClass = order.largeClass;
                    const navDate = order.navDate || adjustment.adjustTxnDate;
                    
                    // 如果这个大类资产存在且操作时间更新，则更新最新操作时间
                    if (largeClass && assetOperationTimes.hasOwnProperty(largeClass)) {
                        if (navDate > assetOperationTimes[largeClass]) {
                            assetOperationTimes[largeClass] = navDate;
                        }
                    }
                });
            }
        });
    }
    
    // 将时间戳转换为可读日期
    const formattedOperationTimes = {};
    for (const assetType in assetOperationTimes) {
        if (assetOperationTimes[assetType] > 0) {
            formattedOperationTimes[assetType] = {
                timestamp: assetOperationTimes[assetType],
                formattedDate: dateUtils.convertTimestampToDate(assetOperationTimes[assetType])
            };
        } else {
            formattedOperationTimes[assetType] = {
                timestamp: 0,
                formattedDate: '暂无操作'
            };
        }
    }
    
    return formattedOperationTimes;
}

/**
 * 处理资产数据
 * @param {Object} etfData - 原始ETF数据
 * @param {Array} adjustData - 调整数据
 * @param {Object} assetLatestOperations - 各大类资产的最后操作时间
 * @returns {Array} 处理后的资产数据
 */
function processAssets(etfData, adjustData, assetLatestOperations) {
    const result = [];
    
    // 处理每种资产类别
    if (etfData.composition && Array.isArray(etfData.composition)) {
        etfData.composition.forEach(assetClass => {
            const className = assetClass.className;
            const classCode = assetClass.classCode;
            
            // 获取该资产类别的最后操作时间
            const latestOperation = assetLatestOperations[className] || { timestamp: 0, formattedDate: '暂无操作' };
            
            const processedAsset = {
                className: className,
                classCode: classCode,
                unit: assetClass.unit || 0,
                profitRate: assetClass.profitRate || 0,
                accProfitRate: assetClass.accProfitRate || 0,
                percent: assetClass.percent || 0,
                isCash: assetClass.isCash || false,
                latestOperation: latestOperation,
                funds: []
            };
            
            // 处理该资产类别下的所有基金
            if (assetClass.compList && Array.isArray(assetClass.compList)) {
                assetClass.compList.forEach(fund => {
                    if (fund.isCash) {
                        // 处理现金
                        processedAsset.funds.push({
                            isCash: true,
                            variety: fund.variety || '',
                            planUnit: fund.planUnit || 0,
                            accProfit: fund.accProfit || 0,
                            percent: fund.percent || 0
                        });
                    } else if (fund.fund) {
                        // 处理基金
                        const fundInfo = fund.fund;
                        
                        // 查找最新操作信息
                        const latestOperation = findLatestOperation(adjustData, fundInfo.fundName, fundInfo.fundCode);
                        
                        // 计算历史最低净值
                        const historicalLow = calculateHistoricalLowestPrice(adjustData, fundInfo.fundCode);
                        
                        // 计算当前单价与平均持有价的对比
                        const avgPrice = fund.unitValue || 0;
                        const currentNav = fund.nav || 0;
                        const compareWithAvg = avgPrice > 0 ? ((currentNav - avgPrice) / avgPrice * 100) : 0;
                        
                        // 计算当前单价与历史最低价的对比
                        const compareWithLowest = (historicalLow && historicalLow > 0) ? 
                            ((currentNav - historicalLow) / historicalLow * 100) : null;
                        
                        processedAsset.funds.push({
                            fundCode: fundInfo.fundCode,
                            fundName: fundInfo.fundName,
                            variety: fund.variety || '',
                            planUnit: fund.planUnit || 0,
                            nav: fund.nav || 0,
                            navDate: fund.navDate ? dateUtils.convertTimestampToDate(fund.navDate) : null,
                            unitValue: fund.unitValue || 0, // E大平均持有单价
                            percent: fund.percent || 0,
                            accProfit: fund.accProfit || 0,
                            accProfitRate: fund.accProfitRate || 0,
                            latestOperation: latestOperation,
                            historicalLow: historicalLow,
                            compareWithAvg: compareWithAvg ? parseFloat(compareWithAvg.toFixed(2)) : 0, // 现值对比平均单价(%)
                            compareWithLowest: compareWithLowest ? parseFloat(compareWithLowest.toFixed(2)) : null, // 现值对比历史最低单价(%)
                            estValue: fund.estValue || fund.nav || 0, // 预估净值，如果没有则使用最新净值
                            costAmount: fund.planUnit ? (fund.planUnit * fund.unitValue) : 0 // 持仓成本
                        });
                    }
                });
            }
            
            result.push(processedAsset);
        });
    }
    
    return result;
}

/**
 * 从调整数据中查找基金的最近操作信息
 * @param {Array} adjustData - 调整数据
 * @param {string} fundTitle - 基金标题
 * @param {string} fundCode - 基金代码
 * @returns {Object|null} - 最近操作信息
 */
function findLatestOperation(adjustData, fundTitle, fundCode) {
    // 输入验证
    if (!adjustData || !adjustData.length || !fundCode) {
        console.error('调整数据为空或基金代码为空');
        return null;
    }
    
    // 清理基金代码，确保它是字符串形式，不含前导零
    const cleanedFundCode = String(fundCode).replace(/^0+/, '');
    
    console.log(`查找基金[${cleanedFundCode}]的最近操作信息`);
    
    // 遍历所有调整记录(最新的记录在前)
    for (const adjustment of adjustData) {
        // 检查是否有orders字段和comment字段
        if (!adjustment.orders || !Array.isArray(adjustment.orders) || !adjustment.comment) {
            continue;
        }
        
        // 在orders数组中查找基金
        let foundIndex = -1;
        for (let i = 0; i < adjustment.orders.length; i++) {
            const order = adjustment.orders[i];
            if (!order.fund || !order.fund.fundCode) continue;
            
            // 清理基金数据中的代码
            const cleanedOrderFundCode = String(order.fund.fundCode).replace(/^0+/, '');
            
            // 通过基金代码进行精确匹配
            if (cleanedOrderFundCode === cleanedFundCode) {
                foundIndex = i;
                break;
            }
        }
        
        // 如果找到了基金
        if (foundIndex !== -1) {
            const order = adjustment.orders[foundIndex];
            const operationDate = order.adjustTxnDate || adjustment.adjustTxnDate;
            
            if (!operationDate) {
                console.warn(`基金[${cleanedFundCode}]找到匹配记录，但无法获取操作日期`);
                continue;
            }
            
            // 解析comment来确定交易类型
            let tradeType = "未知";
            
            try {
                // 将comment按逗号分割成多个操作
                const operations = adjustment.comment.split('，');
                
                console.log(`基金[${cleanedFundCode}]在orders中的位置: ${foundIndex}, comment分割后共有${operations.length}个部分`);
                console.log(`comment全文: ${adjustment.comment}`);
                
                // 确保基金在orders中的位置有对应的comment部分
                if (foundIndex < operations.length) {
                    const operation = operations[foundIndex];
                    console.log(`基金[${cleanedFundCode}]对应的comment部分: "${operation}"`);
                    
                    if (operation.includes('买入')) {
                        tradeType = "买入";
                    } else if (operation.includes('卖出')) {
                        tradeType = "卖出";
                    }
                } else {
                    // 如果位置超出了comment分割后的长度，记录警告
                    console.warn(`基金[${cleanedFundCode}]在orders中的位置(${foundIndex})超出了comment分割后的长度(${operations.length})`);
                }
            } catch (e) {
                console.error(`解析comment出错: ${e.message}`);
            }
            
            // 转换日期格式
            const formattedDate = dateUtils.convertTimestampToDate(operationDate);
            
            // 获取交易价格
            const tradePrice = order.tradePrice || order.nav || 0;
            
            const result = {
                tradeType: tradeType,
                operationDate: formattedDate,
                navDate: operationDate,
                timestamp: operationDate,
                tradePrice: tradePrice,
                displayText: `${tradeType} (${formattedDate})`
            };
            
            console.log(`找到基金[${cleanedFundCode}]的操作记录：${tradeType} (${formattedDate})`);
            
            // 返回第一个匹配的记录（即最后一次操作）
            return result;
        }
    }
    
    console.log(`未找到基金[${cleanedFundCode}]的操作记录`);
    return null;
}

/**
 * 计算基金的历史最低价格
 * @param {Array} adjustData - 调整数据
 * @param {string} fundCode - 基金代码
 * @returns {number|null} - 历史最低价格
 */
function calculateHistoricalLowestPrice(adjustData, fundCode) {
    if (!adjustData || !adjustData.length || !fundCode) {
        return null;
    }
    
    // 清理基金代码，确保它是字符串形式，不含前导零
    const cleanedFundCode = String(fundCode).replace(/^0+/, '');
    
    let lowestNav = null;
    let lowestNavDate = null;
    
    // 遍历所有调整记录
    for (const adjustment of adjustData) {
        if (!adjustment.orders || !Array.isArray(adjustment.orders)) {
            continue;
        }
        
        // 遍历该调整中的所有订单
        for (const order of adjustment.orders) {
            if (!order.fund || !order.fund.fundCode) continue;
            
            // 清理基金数据中的代码
            const cleanedOrderFundCode = String(order.fund.fundCode).replace(/^0+/, '');
            
            // 通过基金代码进行精确匹配
            if (cleanedOrderFundCode === cleanedFundCode) {
                // 获取净值
                const currentNav = order.nav;
                const navDate = order.navDate || adjustment.adjustTxnDate;
                
                // 如果有净值并且是新的最低值（或者是第一个值）
                if (currentNav && (lowestNav === null || currentNav < lowestNav)) {
                    lowestNav = currentNav;
                    lowestNavDate = navDate;
                }
            }
        }
    }
    
    if (lowestNav !== null) {
        console.log(`基金[${cleanedFundCode}]的历史最低价格: ${lowestNav}, 日期: ${dateUtils.convertTimestampToDate(lowestNavDate)}`);
        return lowestNav;
    } else {
        console.log(`未找到基金[${cleanedFundCode}]的历史最低价格`);
        return null;
    }
}

/**
 * 生成大类资产排名数据
 * @param {Object} etfData - 原始ETF数据
 * @returns {Object} 排名数据，包含按不同指标排序的资产列表
 */
function generateAssetRankings(etfData) {
    // 定义结果对象
    const result = {
        byUnit: [],        // 按份数排名
        byPercent: [],     // 按占比排名
        byProfit: []       // 按收益率排名
    };
    
    // 提取资产数据
    const assets = [];
    if (etfData.composition && Array.isArray(etfData.composition)) {
        etfData.composition.forEach(assetClass => {
            // 获取累计收益率
            let accProfitRate = assetClass.accProfitRate;
            
            // 特殊处理现金类资产，从compList中获取accProfit
            if (assetClass.isCash && assetClass.className === '现金' && 
                assetClass.compList && assetClass.compList.length > 0) {
                // 使用现金compList中的accProfit
                accProfitRate = assetClass.compList[0].accProfit || 0;
            }
            
            assets.push({
                className: assetClass.className || '未知资产',
                classCode: assetClass.classCode || '',
                unit: assetClass.unit || 0,
                // 确保percent存储为小数形式（不乘以100）
                percent: assetClass.percent || 0,
                // 确保accProfitRate存储为小数形式（不乘以100）
                accProfitRate: accProfitRate || 0
            });
        });
    }
    
    // 按份数排序（降序）
    result.byUnit = [...assets].sort((a, b) => b.unit - a.unit);
    
    // 按占比排序（降序）
    result.byPercent = [...assets].sort((a, b) => b.percent - a.percent);
    
    // 按收益率排序（降序）
    result.byProfit = [...assets].sort((a, b) => b.accProfitRate - a.accProfitRate);
    
    return result;
} 
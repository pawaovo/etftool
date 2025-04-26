/**
 * grid-data.js
 * 网格策略页面的数据处理和渲染逻辑
 */

// 全局变量
let allEtfData = []; // 存储所有ETF的计算后数据
let latestNetValues = {}; // 存储最新净值数据 {code: netValue, ...}

/**
 * 获取JSON文件列表
 * 从public/data/grid/目录获取所有ETF文件名
 * @returns {Array} 文件名列表
 */
function getJsonFileList() {
    // 硬编码文件列表，这些文件必须在public/data/grid/目录下存在
    return [
        '159920(恒生ETF).json',
        '159938(医药).json',
        '512880(证券).json',
        '512980(传媒).json',
        '513050(中概互联).json',
        '513180(恒生科技).json',
        '513500(标普500).json',
        '513520(日经225).json',
        '515180(100红利).json'
    ];
}

/**
 * 异步加载单个JSON文件
 * @param {string} filename - 要加载的文件名
 * @returns {Promise} 包含解析后JSON数据的Promise
 */
function fetchJsonData(filename) {
    const filePath = `public/data/grid/${filename}`;
    
    return fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`加载文件 ${filename} 失败: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error(`加载文件 ${filename} 失败:`, error);
            // 返回空对象而不是抛出错误，确保整体流程不会中断
            return {};
        });
}

/**
 * 获取最新净值数据
 * @returns {Promise} 包含所有ETF最新净值的Promise
 */
async function fetchLatestNetValues() {
    // 首先尝试从本地缓存文件加载最新净值
    try {
        const response = await fetch('public/data/grid/latest_netvalues.json');
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.warn('加载本地缓存净值失败，将从API获取:', error);
    }
    
    // 如果本地文件不存在或加载失败，从API获取
    const fileList = getJsonFileList();
    const result = {};
    
    // 提取所有ETF代码
    const etfCodes = fileList.map(filename => {
        const match = filename.match(/^(\d+)/);
        return match ? match[1] : '';
    }).filter(code => code);
    
    // 逐个获取最新净值
    const apiPromises = etfCodes.map(async code => {
        try {
            const apiUrl = `https://tiantian-fund-api.vercel.app/api/action?action_name=fundSearch&m=1&key=${code}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // 从返回数据中提取DWJZ（当前净值）
            if (data && data.Datas && data.Datas.length > 0 && 
                data.Datas[0].FundBaseInfo && data.Datas[0].FundBaseInfo.DWJZ) {
                const netValue = parseFloat(data.Datas[0].FundBaseInfo.DWJZ);
                result[code] = netValue;
            }
        } catch (error) {
            console.error(`获取ETF ${code} 净值失败:`, error);
        }
    });
    
    // 等待所有API请求完成
    await Promise.all(apiPromises);
    
    // 将结果缓存到本地（注意：这一步在纯前端环境中无法实现，需要服务端支持）
    // 在本示例中，我们假设网页是在服务器上运行，并有写文件权限
    try {
        // 这里仅作示意，实际上浏览器中无法直接写入文件
        // 实际项目中可能需要发送请求到后端API来保存这些数据
        console.log('最新净值数据:', result);
    } catch (error) {
        console.warn('无法将净值数据保存到本地文件:', error);
    }
    
    return result;
}

/**
 * 计算单个ETF的数据
 * @param {Object} jsonData - ETF的原始JSON数据
 * @param {number} latestNetValue - ETF的最新净值
 * @returns {Object} 计算后的ETF数据
 */
function calculateEtfData(jsonData, latestNetValue) {
    // 如果数据为空，返回默认值
    if (!jsonData || Object.keys(jsonData).length === 0) {
        return {
            etfName: '未知',
            etfCode: '000000',
            category: '未知',
            isRunning: false,
            executionCount: 0,
            cumulativeProfit: 0,
            cumulativeYieldRate: '0%',
            currentLevelBuyPrice: '无',
            stepSize: '0/0/0',
            latestNetValue: 0,
            netValueChangeRate: '0%',
            headerColor: 'gray',
            sourceFile: ''
        };
    }
    
    // 提取ETF名称和代码
    const etfFullName = jsonData['网格交易示例表'] || '';
    const etfCodeMatch = etfFullName.match(/^(\d+)\(([^)]+)\)$/);
    const etfCode = etfCodeMatch ? etfCodeMatch[1] : '';
    const category = etfCodeMatch ? etfCodeMatch[2] : '';
    
    // 判断是否运行中（网格交易数据存在）
    const isRunning = !!jsonData['网格交易数据'] && Array.isArray(jsonData['网格交易数据']) && jsonData['网格交易数据'].length > 0;
    
    // 计算基准价（第一个档位的平均买入价）
    let basePrice = 0;
    if (isRunning && jsonData['网格交易数据'][0] && jsonData['网格交易数据'][0]['买入价']) {
        const buyPrices = jsonData['网格交易数据'][0]['买入价'].map(price => parseFloat(price));
        basePrice = buyPrices.reduce((a, b) => a + b, 0) / buyPrices.length;
    }
    
    // 交易记录处理
    const tradeRecords = jsonData['交易记录'] || [];
    
    // 计算执行次数（交易记录数量 / 2）
    const executionCount = Math.floor(tradeRecords.length / 2);
    
    // 将交易记录按买卖配对
    const tradePairs = [];
    for (let i = 0; i < tradeRecords.length; i += 2) {
        if (i + 1 < tradeRecords.length) {
            tradePairs.push({
                buy: tradeRecords[i],
                sell: tradeRecords[i + 1]
            });
        }
    }
    
    // 计算累计收益
    let cumulativeProfit = 0;
    let totalBuyAmount = 0;
    
    tradePairs.forEach(pair => {
        if (pair.sell && pair.sell['收益']) {
            const profit = parseFloat(pair.sell['收益'].replace(/,/g, ''));
            if (!isNaN(profit)) {
                cumulativeProfit += profit;
            }
        }
        
        if (pair.buy && pair.buy['交易金额']) {
            const buyAmount = parseFloat(pair.buy['交易金额'].replace(/,/g, ''));
            if (!isNaN(buyAmount) && buyAmount > 0) {
                totalBuyAmount += buyAmount;
            }
        }
    });
    
    // 计算累计收益率
    const cumulativeYieldRate = totalBuyAmount > 0 
        ? ((cumulativeProfit / totalBuyAmount) * 100).toFixed(2) + '%' 
        : '0%';
    
    // 计算小网步长（前两个档位差值）
    let smallGridStep = 0;
    if (isRunning && jsonData['网格交易数据'].length >= 2) {
        const level1 = jsonData['网格交易数据'][0]['档位'];
        const level2 = jsonData['网格交易数据'][1]['档位'];
        if (level1 !== undefined && level2 !== undefined) {
            smallGridStep = ((level1 - level2) * 100).toFixed(0);
        }
    }
    
    // 默认中网和大网步长
    const mediumGridStep = '15';
    const largeGridStep = '30';
    
    // 格式化步长显示
    const stepSize = `${smallGridStep}/${mediumGridStep}/${largeGridStep}`;
    
    // 确定当前档位及买入价
    let currentLevelInfo = { level: 0, buyPrice: 0, gridType: '' };
    
    if (isRunning && jsonData['网格交易数据'].length > 0 && latestNetValue > 0) {
        // 查找当前净值所在的档位
        for (const gridData of jsonData['网格交易数据']) {
            if (gridData['档位'] && gridData['买入价'] && gridData['买入价'].length === 2) {
                const level = parseFloat(gridData['档位']);
                const buyPriceAvg = (parseFloat(gridData['买入价'][0]) + parseFloat(gridData['买入价'][1])) / 2;
                
                // 如果最新净值接近或低于买入价，认为是当前档位
                if (latestNetValue <= buyPriceAvg * 1.05) {
                    if (!currentLevelInfo.level || level < currentLevelInfo.level) {
                        currentLevelInfo = {
                            level: level,
                            buyPrice: buyPriceAvg,
                            gridType: gridData['网格种类'] || '小网'
                        };
                    }
                }
            }
        }
    }
    
    // 格式化当前档位/买入价显示
    const currentLevelBuyPrice = currentLevelInfo.level
        ? `${currentLevelInfo.level.toFixed(2)}（${currentLevelInfo.gridType}）/${currentLevelInfo.buyPrice.toFixed(4)}`
        : '无';
    
    // 计算净值变化率
    let netValueChangeRate = '0%';
    if (currentLevelInfo.buyPrice > 0 && latestNetValue > 0) {
        const changeRate = ((latestNetValue - currentLevelInfo.buyPrice) / currentLevelInfo.buyPrice * 100).toFixed(2);
        netValueChangeRate = `${changeRate > 0 ? '+' : ''}${changeRate}%`;
    }
    
    // 确定卡片头部颜色
    const headerColor = netValueChangeRate.startsWith('+') ? 'green' : 'red';
    
    // 提取源文件名
    const sourceFile = etfCode && category ? `${etfCode}(${category}).json` : '';
    
    return {
        etfName: etfFullName,
        etfCode,
        category,
        isRunning,
        basePrice,
        executionCount,
        tradePairs,
        cumulativeProfit,
        totalBuyAmount,
        cumulativeYieldRate,
        currentLevelInfo,
        currentLevelBuyPrice,
        smallGridStep,
        mediumGridStep,
        largeGridStep,
        stepSize,
        latestNetValue,
        netValueChangeRate,
        headerColor,
        sourceFile
    };
}

/**
 * 计算总体概览信息
 * @param {Array} allEtfData - 所有ETF的计算后数据
 * @returns {Object} 计算后的总体信息
 */
function calculateOverallSummary(allEtfData) {
    // 初始化统计变量
    let totalExecutionCount = 0;
    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    let totalBuyShares = 0;
    let totalSellShares = 0;
    let totalRemainingShares = 0;
    let totalProfit = 0;
    
    // 累加计算
    allEtfData.forEach(etf => {
        // 执行次数
        totalExecutionCount += etf.executionCount || 0;
        
        // 累计收益
        totalProfit += etf.cumulativeProfit || 0;
        
        // 累计买入金额
        totalBuyAmount += etf.totalBuyAmount || 0;
        
        // 累计交易股数计算
        if (etf.tradePairs && Array.isArray(etf.tradePairs)) {
            etf.tradePairs.forEach(pair => {
                // 买入股数
                if (pair.buy && pair.buy['交易股数']) {
                    const buyShares = parseInt(pair.buy['交易股数'].replace(/,/g, '')) || 0;
                    if (buyShares > 0) {
                        totalBuyShares += buyShares;
                    }
                }
                
                // 卖出股数（取绝对值）
                if (pair.sell && pair.sell['交易股数']) {
                    const sellSharesStr = pair.sell['交易股数'].replace(/,/g, '');
                    const sellShares = Math.abs(parseInt(sellSharesStr) || 0);
                    if (sellShares > 0) {
                        totalSellShares += sellShares;
                    }
                    
                    // 卖出金额
                    if (pair.sell['交易金额']) {
                        const sellAmount = Math.abs(parseFloat(pair.sell['交易金额'].replace(/,/g, '')) || 0);
                        if (sellAmount > 0) {
                            totalSellAmount += sellAmount;
                        }
                    }
                }
            });
        }
    });
    
    // 计算剩余股数
    totalRemainingShares = totalBuyShares - totalSellShares;
    
    // 计算整体收益率
    const overallProfitRate = totalBuyAmount > 0 
        ? ((totalProfit / totalBuyAmount) * 100).toFixed(2) + '%' 
        : '0%';
    
    return {
        totalExecutionCount,
        totalBuyAmount,
        totalSellAmount,
        totalBuyShares,
        totalSellShares,
        totalRemainingShares,
        totalProfit,
        overallProfitRate
    };
}

/**
 * 创建卡片元素HTML
 * @param {Object} etfData - 单个ETF的计算后数据
 * @returns {string} 卡片的HTML字符串
 */
function createCardElement(etfData) {
    // 在3.2任务中实现
    return '';
}

/**
 * 渲染网格策略卡片
 * @param {Array} etfDataArray - ETF数据数组
 * @param {string} sortBy - 排序字段
 */
function renderGridCards(etfDataArray, sortBy = 'netValueChangeRate') {
    // 在3.3和3.4任务中实现
}

/**
 * 渲染总体概览信息
 * @param {Object} summaryData - 总体概览数据
 */
function renderSummary(summaryData) {
    // 在3.1任务中实现
}

/**
 * 页面初始化
 */
async function initPage() {
    try {
        // 显示加载状态
        showLoadingState();
        
        console.log('正在加载ETF数据...');
        
        // 获取ETF文件列表（任务2.1）
        const fileList = getJsonFileList();
        console.log('文件列表:', fileList);
        
        // 获取最新净值数据（任务2.3）
        console.log('获取最新净值数据...');
        latestNetValues = await fetchLatestNetValues();
        console.log('最新净值数据:', latestNetValues);
        
        // 加载所有ETF数据（任务2.4）
        console.log('并行加载所有ETF JSON文件...');
        const jsonDataPromises = fileList.map(filename => fetchJsonData(filename));
        const jsonDataArray = await Promise.all(jsonDataPromises);
        console.log('所有ETF JSON文件加载完成');
        
        // 计算所有ETF数据（任务2.6）
        console.log('计算所有ETF数据...');
        allEtfData = jsonDataArray.map((jsonData, index) => {
            const filename = fileList[index];
            const etfCode = extractEtfCode(filename);
            const currentNetValue = latestNetValues[etfCode] || 0;
            console.log(`处理ETF ${etfCode}，最新净值: ${currentNetValue}`);
            return calculateEtfData(jsonData, currentNetValue);
        });
        console.log('ETF数据计算完成:', allEtfData);
        
        // 计算总体概览信息（任务2.7）
        console.log('计算总体概览信息...');
        const summaryData = calculateOverallSummary(allEtfData);
        console.log('总体概览信息:', summaryData);
        
        // 渲染总体概览（阶段三的任务3.1，将在下一阶段实现）
        renderSummary(summaryData);
        
        // 渲染卡片（阶段三的任务3.2和3.3，将在下一阶段实现）
        renderGridCards(allEtfData);
        
        // 设置排序按钮事件监听（阶段三的任务3.4，将在下一阶段实现）
        setupSortButtonsListeners();
        
        // 隐藏加载状态
        hideLoadingState();
        
    } catch (error) {
        console.error('初始化页面失败:', error);
        showErrorMessage('加载ETF数据失败: ' + error.message);
    }
}

/**
 * 显示加载状态
 */
function showLoadingState() {
    // 这里可以添加加载动画或提示
    console.log('正在加载数据...');
}

/**
 * 隐藏加载状态
 */
function hideLoadingState() {
    // 这里可以隐藏加载动画或提示
    console.log('数据加载完成');
}

/**
 * 显示错误消息
 * @param {string} message - 错误消息
 */
function showErrorMessage(message) {
    console.error(message);
    // 可以添加错误提示UI
    alert(message);
}

/**
 * 提取ETF代码
 * @param {string} filename - 文件名，格式为"<code>(<category>).json"
 * @returns {string} ETF代码
 */
function extractEtfCode(filename) {
    // 提取文件名中的ETF代码
    const match = filename.match(/^(\d+)/);
    return match ? match[1] : '';
}

/**
 * 设置排序按钮事件监听
 */
function setupSortButtonsListeners() {
    // 在3.4任务中实现
}

// 当DOM加载完成后初始化页面
document.addEventListener('DOMContentLoaded', initPage); 
// 网格策略概览页面数据处理脚本

/**
 * 网格策略数据处理模块
 * 用于加载、计算和渲染网格策略相关数据
 */

// 存储所有ETF数据的全局变量
let allEtfData = [];

// 存储最新净值数据的全局变量
let latestNetValues = {};

// 存储所有ETF的原始JSON数据
let allEtfJsonData = {};

/**
 * 获取public/data/grid/目录下所有ETF JSON文件名列表
 * @returns {Array<string>} JSON文件名列表
 */
function getEtfJsonFileList() {
    // 由于浏览器环境中JS无法直接读取服务器目录，我们在这里硬编码文件列表
    // 实际项目中，这可以通过服务器端脚本生成一个索引文件，或通过API获取
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
 * 从文件名中提取ETF代码
 * @param {string} filename - ETF JSON文件名，格式为：code(category).json
 * @returns {string} ETF代码
 */
function extractEtfCodeFromFilename(filename) {
    if (!filename) return null;
    
    // 提取基本文件名（不含路径）
    const baseName = filename.split('/').pop().split('\\').pop();
    
    // 尝试匹配6位数字代码
    const match = baseName.match(/(\d{6})/);
    return match ? match[1] : null;
}

/**
 * 从文件名中提取ETF名称（类别）
 * @param {string} filename - ETF JSON文件名，格式为：code(category).json
 * @returns {string} ETF名称
 */
function extractEtfCategoryFromFilename(filename) {
    // 使用正则表达式提取括号内的类别部分
    const match = filename.match(/\(([^)]+)\)/);
    if (match && match[1]) {
        return match[1];
    }
    return null;
}

/**
 * 异步加载单个JSON文件
 * @param {string} filename - 要加载的JSON文件名 (不含路径)
 * @returns {Promise<Object>} 包含JSON数据的Promise
 */
async function fetchJsonData(filename) {
    try {
        // 构建指向 dist/data/grid/ 的文件路径 (服务器根路径是 dist/)
        const filePath = `/data/grid/${filename}`;
        
        // 使用fetch API获取JSON文件
        const response = await fetch(filePath);
        
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // 解析JSON数据
        const jsonData = await response.json();
        
        console.log(`成功加载 ${filePath}`);
        return jsonData;
    } catch (error) {
        console.error(`加载 ${filename} (路径: /data/grid/${filename}) 失败:`, error);
        // 不再尝试相对路径，因为服务器根目录是 dist/
        // 返回一个带有错误标记的对象
        return {
            error: true,
            message: error.message,
            filename: filename
        };
    }
}

/**
 * 获取ETF的最新净值
 * @param {string} etfCode - ETF代码
 * @returns {Promise<{netValue: number|null, date: string|null}>} 最新净值和日期信息
 */
async function fetchSingleEtfNetValue(etfCode) {
    try {
        const apiUrl = `https://tiantian-fund-api.vercel.app/api/action?action_name=fundSearch&m=1&key=${etfCode}`;
        
        // 使用fetch API调用接口
        const response = await fetch(apiUrl);
        
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // 解析JSON数据
        const data = await response.json();
        
        // 从数据中提取最新净值和日期
        if (data.ErrCode === 0 && data.Datas && data.Datas.length > 0 && data.Datas[0].FundBaseInfo) {
            const netValue = parseFloat(data.Datas[0].FundBaseInfo.DWJZ);
            const netValueDate = data.Datas[0].FundBaseInfo.FSRQ || null;
            console.log(`代码 ${etfCode} 的最新净值: ${netValue}, 日期: ${netValueDate}`);
            return { netValue, date: netValueDate };
        } else {
            console.error(`未找到代码 ${etfCode} 的最新净值数据:`, data);
            return { netValue: null, date: null };
        }
    } catch (error) {
        console.error(`获取代码 ${etfCode} 的最新净值失败:`, error);
        return { netValue: null, date: null };
    }
}

/**
 * 获取所有ETF的最新净值
 * @returns {Promise<Object>} 包含所有ETF最新净值的对象：{code: {netValue, date}, ...}
 */
async function fetchLatestNetValues() {
    try {
        // 从本地文件加载最新净值数据
        try {
            const localNetValuesData = await fetchJsonData('latest_netvalues.json');
            if (!localNetValuesData.error) {
                // 提取并显示最后更新日期
                const lastUpdated = localNetValuesData.lastUpdated || '未知';
                console.log(`成功从本地文件加载最新净值数据，最后更新日期: ${lastUpdated}`);
                
                // 移除lastUpdated字段，保持与API返回格式一致
                const netValues = {...localNetValuesData};
                delete netValues.lastUpdated;
                
                return netValues;
            }
            throw new Error('本地净值数据无效');
        } catch (err) {
            console.error('本地最新净值数据不可用:', err);
            return {}; // 如果本地文件不可用，返回空对象
        }
    } catch (error) {
        console.error('获取最新净值失败:', error);
        return {};
    }
}

/**
 * 加载所有ETF的JSON数据
 * @returns {Promise<Object>} 包含所有ETF数据的对象：{filename: jsonData, ...}
 */
async function loadAllEtfJsonData() {
    try {
        const fileList = getEtfJsonFileList();
        const jsonDataMap = {};
        
        // 并行加载所有ETF的JSON数据
        const jsonDataPromises = fileList.map(filename => fetchJsonData(filename));
        const jsonDataResults = await Promise.all(jsonDataPromises);
        
        // 组合结果
        fileList.forEach((filename, index) => {
            if (!jsonDataResults[index].error) {
                jsonDataMap[filename] = jsonDataResults[index];
            }
        });
        
        console.log('成功加载所有ETF的JSON数据');
        return jsonDataMap;
    } catch (error) {
        console.error('加载所有ETF的JSON数据失败:', error);
        return {};
    }
}

/**
 * 加载所有数据（ETF JSON数据和最新净值）
 * @returns {Promise<{jsonData: Object, netValues: Object}>} 包含所有数据的对象
 */
async function loadAllData() {
    try {
        console.log('开始加载所有数据...');
        
        // 并行加载ETF JSON数据和最新净值
        const [jsonData, netValues] = await Promise.all([
            loadAllEtfJsonData(),
            fetchLatestNetValues()
        ]);
        
        // 更新全局变量
        allEtfJsonData = jsonData;
        latestNetValues = netValues;
        
        console.log('所有数据加载完成');
        
        // 返回加载的数据
        return {
            jsonData,
            netValues
        };
    } catch (error) {
        console.error('加载所有数据失败:', error);
        return {
            jsonData: {},
            netValues: {}
        };
    }
}

/**
 * 测试异步加载功能
 * @param {string} filename - 要测试加载的文件名
 */
async function testJsonLoading(filename) {
    console.log(`开始加载 ${filename}...`);
    const data = await fetchJsonData(filename);
    if (data.error) {
        console.error(`测试加载失败: ${data.message}`);
    } else {
        console.log(`测试加载成功:`, data);
    }
}

/**
 * 测试获取最新净值功能
 */
async function testFetchNetValues() {
    console.log('开始获取最新净值...');
    const netValues = await fetchLatestNetValues();
    console.log('最新净值获取结果:', netValues);
    latestNetValues = netValues; // 更新全局变量
}

/**
 * 计算单个ETF的卡片显示数据
 * @param {Object} jsonData ETF的JSON数据
 * @param {number} latestNetValue 最新净值
 * @param {string} netValueDate 净值日期
 * @returns {Object} 格式化后的ETF数据对象
 */
function calculateEtfData(jsonData, latestNetValue, netValueDate) {
    try {
        // 检查JSON数据是否有效
        if (!jsonData || typeof jsonData !== 'object') {
            throw new Error('无效的ETF JSON数据');
        }
        
        // 提取最后操作时间
        let lastOperationTime = '';
        if (jsonData["最新时间"]) {
            lastOperationTime = jsonData["最新时间"];
        }
        
        // 适配实际的JSON结构
        // 从"网格交易示例表"字段提取ETF代码和名称
        let etfName = '未知ETF';
        let etfCode = '';
        if (jsonData["网格交易示例表"]) {
            const match = jsonData["网格交易示例表"].match(/(\d{6})\(([^)]+)\)/);
            if (match) {
                etfCode = match[1];
                etfName = match[2];
            } else {
                etfCode = extractEtfCodeFromFilename(jsonData.sourceFile || '');
                etfName = jsonData["网格交易示例表"];
            }
        } else {
            etfCode = extractEtfCodeFromFilename(jsonData.sourceFile || '');
        }
        
        // 提取ETF基本信息
        const category = etfName || '其他';
        const isRunning = jsonData["网格交易数据"] && jsonData["网格交易数据"].length > 0;
        
        // 计算基准价 (basePrice)
        let basePrice = 0;
        if (jsonData["网格交易数据"] && jsonData["网格交易数据"].length > 0) {
            try {
                const firstGridData = jsonData["网格交易数据"][0];
                if (firstGridData && Array.isArray(firstGridData["买入价"])) {
                    let priceArray = firstGridData["买入价"];
                    
                    // 当"买入价"中存在多于2组数据时，取其列表内倒数2组数据进行计算
                    if (priceArray.length > 2) {
                        priceArray = priceArray.slice(-2);
                    }
                    
                    // 计算平均价格
                    const validPrices = priceArray.map(p => parseFloat(p)).filter(p => !isNaN(p));
                    if (validPrices.length > 0) {
                        basePrice = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
                    }
                }
            } catch (error) {
                console.error('计算基准价失败:', error);
            }
        }
        
        // 计算步长
        let stepSize = '未知';
        if (jsonData["网格交易数据"] && jsonData["网格交易数据"].length >= 2) {
            try {
                const level1 = jsonData["网格交易数据"][0]["档位"];
                const level2 = jsonData["网格交易数据"][1]["档位"];
                if (level1 && level2) {
                    const smallStep = Math.round(Math.abs((level1 - level2) * 100));
                    
                    // 更新步长计算规则
                    let mediumStep, largeStep;
                    
                    if (smallStep === 5) {
                        // 当小网步长为5时
                        mediumStep = smallStep * 3; // 5 * 3 = 15
                        largeStep = smallStep * 6; // 5 * 6 = 30
                    } else if (smallStep === 10) {
                        // 当小网步长为10时
                        mediumStep = smallStep * 2; // 10 * 2 = 20
                        largeStep = smallStep * 3; // 10 * 3 = 30
                    } else {
                        // 其他情况，使用默认计算
                        mediumStep = smallStep * 3;
                        largeStep = smallStep * 6;
                    }
                    
                    stepSize = `${smallStep}/${mediumStep}/${largeStep}`;
                }
            } catch (error) {
                console.error('计算步长失败:', error);
            }
        }
        
        // 提取网格配置 - 转换为代码期望的格式
        const gridLevels = [];
        if (jsonData["网格交易数据"] && Array.isArray(jsonData["网格交易数据"])) {
            jsonData["网格交易数据"].forEach(grid => {
                try {
                    // 计算平均买入价
                    let buyPrice = 0;
                    if (Array.isArray(grid["买入价"]) && grid["买入价"].length > 0) {
                        const validPrices = grid["买入价"].map(p => parseFloat(p)).filter(p => !isNaN(p));
                        if (validPrices.length > 0) {
                            buyPrice = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
                        }
                    }
                    
                    // 添加到网格档位列表
                    gridLevels.push({
                        level: grid["档位"],
                        price: buyPrice,
                        type: grid["网格种类"],
                    });
                } catch (error) {
                    console.error('处理网格档位数据失败:', error);
                }
            });
        }
        
        // 提取执行记录 - 转换为代码期望的格式
        const executions = [];
        if (jsonData["交易记录"] && Array.isArray(jsonData["交易记录"])) {
            jsonData["交易记录"].forEach(record => {
                try {
                    // 确定交易类型
                    const amount = parseFloat(record["交易金额"]);
                    const type = amount < 0 ? 'SELL' : 'BUY';
                    
                    // 添加到执行记录列表
                    executions.push({
                        date: record["日期"],
                        type: type,
                        price: parseFloat(record["实际交易价格"]),
                        shares: Math.abs(parseFloat(record["交易股数"])),
                        amount: Math.abs(amount),
                        profit: type === 'SELL' ? parseFloat(record["收益"] || 0) : 0,
                        profitRate: type === 'SELL' ? record["收益率"] : '0.00%'
                    });
                } catch (error) {
                    console.error('处理交易记录数据失败:', error);
                }
            });
        }
        
        // 计算执行统计信息
        const executionCount = executions.filter(exec => exec.type === 'SELL').length;
        
        // 计算累计收益率
        let cumulativeYieldRate = '0.00%';
        try {
            // 计算总收益
            const totalProfit = executions.reduce((sum, exec) => {
                if (exec.type === 'SELL' && exec.profit) {
                    return sum + exec.profit;
                }
                return sum;
            }, 0);
            
            // 计算总买入金额
            const totalBuyAmount = executions.reduce((sum, exec) => {
                if (exec.type === 'BUY') {
                    return sum + exec.amount;
                }
                return sum;
            }, 0);
            
            // 计算累计收益率
            if (totalBuyAmount > 0) {
                const yieldRate = (totalProfit / totalBuyAmount) * 100;
                cumulativeYieldRate = yieldRate.toFixed(2) + '%';
            }
        } catch (error) {
            console.error('计算累计收益率失败:', error);
        }
        
        // 计算当前档位买入价
        let currentLevelBuyPrice = '0.0000';
        let currentLevel = 0.00;
        try {
            if (gridLevels.length > 0 && latestNetValue > 0) {
                // 按照价格升序排序网格档位
                const sortedLevels = [...gridLevels].sort((a, b) => 
                    parseFloat(a.price) - parseFloat(b.price)
                );
                
                // 根据最新净值找到当前应该买入的档位
                let matchedLevel = null;
                
                // 如果最新净值低于最低档位价格，使用最低档位
                if (latestNetValue <= parseFloat(sortedLevels[0].price)) {
                    matchedLevel = sortedLevels[0];
                } 
                // 如果最新净值高于最高档位价格，使用最高档位
                else if (latestNetValue >= parseFloat(sortedLevels[sortedLevels.length - 1].price)) {
                    matchedLevel = sortedLevels[sortedLevels.length - 1];
                } 
                // 否则找到最接近但低于最新净值的档位
                else {
                    for (let i = 0; i < sortedLevels.length - 1; i++) {
                        const currentPrice = parseFloat(sortedLevels[i].price);
                        const nextPrice = parseFloat(sortedLevels[i + 1].price);
                        
                        if (latestNetValue >= currentPrice && latestNetValue < nextPrice) {
                            matchedLevel = sortedLevels[i];
                            break;
                        }
                    }
                }
                
                if (matchedLevel) {
                    currentLevelBuyPrice = parseFloat(matchedLevel.price).toFixed(4);
                    currentLevel = matchedLevel.level;
                }
            }
        } catch (error) {
            console.error('计算当前档位买入价失败:', error);
        }
        
        // 计算净值变化率
        let netValueChangeRate = '0.00%';
        let headerColor = 'gray';
        try {
            const buyPrice = parseFloat(currentLevelBuyPrice);
            if (buyPrice > 0 && latestNetValue > 0) {
                const changeRate = (latestNetValue - buyPrice) / buyPrice * 100;
                netValueChangeRate = changeRate.toFixed(2) + '%';
                
                // 确定颜色：红色表示降低（适合买入），绿色表示上涨（适合卖出）
                headerColor = changeRate < 0 ? 'red' : 'green';
            }
        } catch (error) {
            console.error('计算净值变化率失败:', error);
        }
        
        // 返回格式化的ETF数据对象
        return {
            etfName,
            etfCode,
            category,
            isRunning,
            lastOperationTime,
            basePrice: basePrice ? basePrice.toFixed(4) : '0.0000',
            executionCount,
            cumulativeYieldRate,
            currentLevel,
            currentLevelBuyPrice,
            stepSize,
            latestNetValue: latestNetValue || 0,
            netValueDate,
            netValueChangeRate,
            headerColor,
            sourceFile: jsonData.sourceFile || '',
            gridLevels: gridLevels || [],
            executions: executions || []
        };
    } catch (error) {
        console.error('计算ETF数据失败:', error);
        throw error;
    }
}

/**
 * 处理所有ETF数据
 * @param {function} progressCallback 进度回调函数
 * @returns {Promise<Array>} 处理后的ETF数据数组
 */
async function processAllEtfData(progressCallback = null) {
    try {
        // 1. 获取所有ETF JSON文件列表
        const etfFiles = getEtfJsonFileList();
        const total = etfFiles.length;
        let processed = 0;

        // 2. 获取所有ETF最新净值
        const etfNetValues = await fetchLatestNetValues();

        // 3. 并行处理所有ETF数据
        const etfDataPromises = etfFiles.map(async (filename) => {
            try {
                // 读取ETF JSON数据
                const etfJsonData = await fetchJsonData(filename);

                // 从文件名提取ETF代码
                const etfCode = extractEtfCodeFromFilename(filename);

                // 获取该ETF的最新净值和日期 - 支持新旧两种数据格式
                let latestNetValue = 0;
                let netValueDate = null;
                
                if (etfNetValues[etfCode]) {
                    // 检查是否为新格式（对象结构）
                    if (typeof etfNetValues[etfCode] === 'object' && etfNetValues[etfCode] !== null) {
                        latestNetValue = etfNetValues[etfCode].netValue || 0;
                        netValueDate = etfNetValues[etfCode].date || null;
                    } else {
                        // 旧格式（直接数值）
                        latestNetValue = etfNetValues[etfCode] || 0;
                    }
                }
                
                // 格式化诊断信息
                const dateInfo = netValueDate ? netValueDate : '未知';
                console.log(`ETF代码 ${etfCode} 的最新净值: ${latestNetValue}, 日期: ${dateInfo}`);

                // 将sourceFile添加到JSON数据中
                if (etfJsonData && typeof etfJsonData === 'object') {
                    etfJsonData.sourceFile = filename;
                }

                // 使用calculateEtfData函数计算ETF数据
                const result = calculateEtfData(etfJsonData, latestNetValue, netValueDate);

                // 更新进度
                processed++;
                if (progressCallback) {
                    progressCallback(processed / total);
                }

                return result;
            } catch (error) {
                console.error(`处理ETF数据失败 (${filename}):`, error);

                // 更新进度，即使处理失败
                processed++;
                if (progressCallback) {
                    progressCallback(processed / total);
                }

                // 返回一个错误状态的ETF对象
                return {
                    etfName: `加载失败: ${filename}`,
                    etfCode: extractEtfCodeFromFilename(filename),
                    category: '未知',
                    isRunning: false,
                    executionCount: 0,
                    cumulativeYieldRate: '0.00%',
                    currentLevelBuyPrice: '0.0000',
                    stepSize: '未知',
                    latestNetValue: 0,
                    netValueDate: null,
                    netValueChangeRate: '0.00%',
                    headerColor: 'gray',
                    sourceFile: filename,
                    hasError: true
                };
            }
        });

        // 等待所有ETF数据处理完成
        const etfData = await Promise.all(etfDataPromises);

        // 4. 按类别分组并排序结果
        const sortedData = sortEtfDataByCategory(etfData);

        return sortedData;
    } catch (error) {
        console.error('处理所有ETF数据失败:', error);
        throw error;
    }
}

/**
 * 计算所有ETF的总体概览信息
 * @param {Array<Object>} etfDataArray - 所有ETF的计算后数据
 * @returns {Object} 总体概览信息
 */
function calculateOverallSummary(etfDataArray) {
    // --- 调试日志开始 ---
    console.log('calculateOverallSummary: 输入数据 (etfDataArray):', etfDataArray);
    if (etfDataArray && etfDataArray.length > 0) {
        // 打印第一个ETF的部分交易记录以供检查
        console.log('calculateOverallSummary: 第一个ETF的交易记录 (示例):', etfDataArray[0]?.executions?.slice(0, 5));
        // 打印最后一个ETF的部分交易记录以供检查
        console.log('calculateOverallSummary: 最后一个ETF的交易记录 (示例):', etfDataArray[etfDataArray.length - 1]?.executions?.slice(0, 5));
    }
    // --- 调试日志结束 ---

    if (!etfDataArray || etfDataArray.length === 0) {
        return {
            totalEtfCount: 0,
            runningEtfCount: 0,
            totalExecutionCount: 0,
            totalBuyAmount: '0.00',
            totalSellAmount: '0.00',
            totalBuyShares: 0,
            totalSellShares: 0,
            totalRemainingShares: 0,
            totalProfit: '0.00',
            overallProfitRate: '0.00%',
            avgProfit: '0.00',
            avgExecutionCount: '0.0'
        };
    }
    
    let totalExecutionCount = 0;
    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    let totalBuyShares = 0;
    let totalSellShares = 0;
    let totalProfit = 0;
    let runningEtfCount = 0;
    
    // 遍历所有ETF数据
    etfDataArray.forEach(etfData => {
        // 计算运行中的ETF数量
        if (etfData.isRunning) {
            runningEtfCount++;
        }
        
        // 累加执行次数
        totalExecutionCount += etfData.executionCount || 0;
        
        // 处理交易记录，计算买卖金额和股数
        if (etfData.executions && Array.isArray(etfData.executions)) {
            etfData.executions.forEach(execution => {
                const amount = parseFloat(execution.amount || 0);
                const shares = parseFloat(execution.shares || 0);
                
                if (execution.type === 'BUY') {
                    // 买入交易，累加买入金额和股数
                    totalBuyAmount += Math.abs(amount);
                    totalBuyShares += Math.abs(shares);
                } else if (execution.type === 'SELL') {
                    // 卖出交易，累加卖出金额和股数，以及收益
                    totalSellAmount += Math.abs(amount);
                    totalSellShares += Math.abs(shares);
                    totalProfit += parseFloat(execution.profit || 0);
                }
            });
        }
    });
    
    // 计算剩余股数
    const totalRemainingShares = totalBuyShares - totalSellShares;
    
    // 计算整体收益率
    const overallProfitRate = totalBuyAmount > 0 ? (totalProfit / totalBuyAmount * 100) : 0;
    
    // 计算平均收益和平均执行次数
    const avgProfit = etfDataArray.length > 0 ? (totalProfit / etfDataArray.length) : 0;
    const avgExecutionCount = etfDataArray.length > 0 ? (totalExecutionCount / etfDataArray.length) : 0;
    
    return {
        totalEtfCount: etfDataArray.length,
        runningEtfCount,
        totalExecutionCount,
        totalBuyAmount: totalBuyAmount.toFixed(2),
        totalSellAmount: totalSellAmount.toFixed(2),
        totalBuyShares,
        totalSellShares,
        totalRemainingShares,
        totalProfit: totalProfit.toFixed(2),
        overallProfitRate: overallProfitRate.toFixed(2) + '%',
        avgProfit: avgProfit.toFixed(2),
        avgExecutionCount: avgExecutionCount.toFixed(1)
    };
}

/**
 * 将ETF数据按类别分组并排序
 * @param {Array<Object>} etfDataArray - ETF数据数组
 * @returns {Array<Object>} 排序后的ETF数据数组
 */
function sortEtfDataByCategory(etfDataArray) {
    if (!etfDataArray || etfDataArray.length === 0) {
        return [];
    }
    
    // 首先按照类别(category)进行排序
    const sortedByCategory = [...etfDataArray].sort((a, b) => {
        // 首先按类别排序
        const categoryComparison = (a.category || '').localeCompare(b.category || '');
        if (categoryComparison !== 0) return categoryComparison;
        
        // 如果类别相同，则按ETF名称排序
        return (a.etfName || '').localeCompare(b.etfName || '');
    });
    
    return sortedByCategory;
}

/**
 * 按指定标准排序ETF数据
 * @param {Array<Object>} etfDataArray - ETF数据数组
 * @param {string} sortBy - 排序标准: 'executionCount', 'cumulativeYieldRate', 'netValueChangeRate', 'lastOperationTime'
 * @returns {Array<Object>} 排序后的ETF数据数组
 */
function sortEtfData(etfDataArray, sortBy = 'netValueChangeRate') {
    if (!etfDataArray || etfDataArray.length === 0) {
        return [];
    }
    
    // 复制数组，避免修改原数组
    let sortedData = [...etfDataArray];
    
    switch (sortBy) {
        case 'executionCount':
            // 按执行次数降序排序
            sortedData.sort((a, b) => b.executionCount - a.executionCount);
            break;
            
        case 'cumulativeYieldRate':
            // 按累计收益率降序排序，去除百分号并转为数值
            sortedData.sort((a, b) => {
                const rateA = parseFloat(a.cumulativeYieldRate.replace('%', ''));
                const rateB = parseFloat(b.cumulativeYieldRate.replace('%', ''));
                return rateB - rateA;
            });
            break;
            
        case 'lastOperationTime':
            // 按最后操作时间降序排序（最新的在前面）
            sortedData.sort((a, b) => {
                // 如果没有时间，放到最后
                if (!a.lastOperationTime) return 1;
                if (!b.lastOperationTime) return -1;
                
                // 尝试转换为Date对象进行比较
                try {
                    // 将中文格式的日期转换为标准格式 (2025-4-25 -> 2025/4/25)
                    const dateA = new Date(a.lastOperationTime.replace(/-/g, '/'));
                    const dateB = new Date(b.lastOperationTime.replace(/-/g, '/'));
                    return dateB - dateA; // 降序排列，最新的在前面
                } catch (e) {
                    // 如果日期解析出错，使用字符串比较
                    return b.lastOperationTime.localeCompare(a.lastOperationTime);
                }
            });
            break;
            
        case 'netValueChangeRate':
        default:
            // 按净值变化率降序排序，去除百分号并转为数值
            sortedData.sort((a, b) => {
                const rateA = parseFloat(a.netValueChangeRate.replace('%', ''));
                const rateB = parseFloat(b.netValueChangeRate.replace('%', ''));
                return rateB - rateA;
            });
            break;
    }
    
    return sortedData;
}

/**
 * 添加排序按钮的事件监听
 */
function addSortButtonsEventListeners() {
    // 获取所有排序按钮
    const sortButtons = document.querySelectorAll('.sort-btn');
    
    // 添加点击事件
    sortButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            sortButtons.forEach(btn => btn.classList.remove('active'));
            
            // 为当前点击的按钮添加active类
            this.classList.add('active');
            
            // 获取排序标准
            const sortBy = this.getAttribute('data-sort-by');
            console.log('排序按钮点击 - 排序标准:', sortBy);
            
            // 对ETF数据进行排序
            const sortedData = sortEtfData(allEtfData, sortBy);
            
            // 重新渲染卡片
            renderCards(sortedData);
            
            // 添加卡片事件监听
            addCardEventListeners();
        });
    });
    
    console.log('排序按钮事件监听器添加完成');
}

// 初始化函数，在页面加载完成后调用
document.addEventListener('DOMContentLoaded', async function() {
    // 加载数据并初始化页面
    console.log('网格策略数据加载模块已初始化');
    
    // 加载所有数据
    const allData = await loadAllData();
    
    // 检查数据加载状态
    const jsonDataCount = Object.keys(allData.jsonData).length;
    const netValuesCount = Object.keys(allData.netValues).length;
    
    console.log(`成功加载 ${jsonDataCount} 个ETF JSON文件和 ${netValuesCount} 个ETF的最新净值`);
    
    // 输出最新净值的诊断信息
    console.log('---------- 最新净值诊断 ----------');
    console.log('数据格式示例:');
    
    let hasDateInfo = false;
    for (const [code, valueData] of Object.entries(allData.netValues)) {
        // 处理不同的数据格式
        if (typeof valueData === 'object' && valueData !== null) {
            // 新格式（带日期）
            console.log(`ETF ${code}: 净值=${valueData.netValue}, 日期=${valueData.date || '未知'}`);
            if (valueData.date) hasDateInfo = true;
        } else {
            // 旧格式（仅净值）
            console.log(`ETF ${code}: 净值=${valueData}, 日期=未知`);
        }
        
        // 只输出前3条作为示例
        if (Object.entries(allData.netValues).findIndex(([c]) => c === code) >= 2) break;
    }
    
    console.log(`净值数据是否包含日期信息: ${hasDateInfo ? '是' : '否'}`);
    console.log(`建议: ${hasDateInfo ? '数据格式正确' : '重新获取数据或更新latest_netvalues.json文件格式'}`);
    console.log('---------- 诊断结束 ----------');
    
    // 处理所有ETF数据
    const processedData = await processAllEtfData();
    console.log(`成功处理 ${processedData.length} 个ETF数据`);
    
    // 更新全局变量
    allEtfData = processedData;
    
    // 计算总体概览信息
    const overallSummary = calculateOverallSummary(processedData);
    console.log('总体概览信息:', overallSummary);
    
    // 按净值变化率排序数据
    const sortedData = sortEtfData(allEtfData, 'netValueChangeRate');
    
    // 渲染UI
    renderOverallSummary(overallSummary);
    renderCards(sortedData);
    
    // 添加卡片事件监听
    addCardEventListeners();
    
    // 添加排序按钮事件监听
    addSortButtonsEventListeners();
});

/**
 * 加载JSON文件内容
 * @param {string} filePath - 文件路径
 * @returns {Object|null} JSON数据或null
 */
function loadJsonFile(filePath) {
    try {
        // 在实际应用中，这里应该使用适当的文件加载方法
        // 此处使用模拟数据进行演示
        // 真实环境中可以使用fetch或者其他方法加载文件
        
        // 如果在Node.js环境中
        // const fs = require('fs');
        // const content = fs.readFileSync(filePath, 'utf8');
        // return JSON.parse(content);
        
        // 浏览器环境中可以使用
        return new Promise((resolve, reject) => {
            fetch(filePath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP错误! 状态: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => resolve(data))
                .catch(error => {
                    console.error(`加载JSON文件失败 (${filePath}):`, error);
                    reject(null);
                });
        });
    } catch (error) {
        console.error(`解析JSON文件失败 (${filePath}):`, error);
        return null;
    }
}

/**
 * 创建单个ETF卡片的HTML元素
 * @param {Object} etfData - ETF数据对象
 * @returns {string} 卡片HTML字符串
 */
function createCardElement(etfData) {
    // 获取颜色类别（正数为绿色/positive，负数为红色/negative）
    const netValueChangePercent = parseFloat(etfData.netValueChangeRate);
    // 修正颜色逻辑：正值为绿色(positive)，负值为红色(negative)
    const headerColorClass = netValueChangePercent >= 0 ? 'positive' : 'negative';
    const levelType = etfData.currentLevel <= 0.7 ? '(大档)' : etfData.currentLevel <= 0.85 ? '(中档)' : '(小档)';
    
    // 格式化净值日期显示
    const netValueDateStr = etfData.netValueDate ? ` (${etfData.netValueDate})` : '';
    
    // 格式化净值显示
    const netValueDisplay = (etfData.latestNetValue && !isNaN(parseFloat(etfData.latestNetValue))) 
        ? parseFloat(etfData.latestNetValue).toFixed(4) 
        : '0.0000';
    
    // 将基准价和买入价格式化为3位小数
    const formattedBasePrice = parseFloat(etfData.basePrice).toFixed(3);
    const formattedBuyPrice = parseFloat(etfData.currentLevelBuyPrice).toFixed(3);
    
    // 添加卡片背景色类（运行中或已暂停）
    const cardBackgroundClass = etfData.isRunning ? '' : 'paused-card';
    
    // 如果是已暂停的ETF，所有彩色元素都改为灰色
    let actualHeaderColorClass = etfData.isRunning ? headerColorClass : 'neutral';
    
    // 判断执行次数是否为0，如果是则禁用按钮
    const executionCount = parseInt(String(etfData.executionCount).replace(/[^0-9]/g, '') || '0', 10);
    const isDisabled = executionCount === 0;
    const cardClass = isDisabled ? `fund-card ${cardBackgroundClass} zero-execution-card` : `fund-card ${cardBackgroundClass}`;
    const btnClass = isDisabled ? 'detail-btn disabled' : 'detail-btn';
    const btnDisabledAttr = isDisabled ? 'disabled' : '';
    
    // 设置净值文本颜色 - 正值为绿色，负值为红色
    const netValueColorStyle = etfData.isRunning 
        ? (netValueChangePercent >= 0 ? 'color: #27ae60;' : 'color: #ef4444;') 
        : 'color: #999;';
    
    // 设置收益率颜色 - 正值为绿色，负值为红色
    const profitValue = parseFloat(etfData.cumulativeYieldRate);
    const profitColorStyle = etfData.isRunning 
        ? (profitValue >= 0 ? 'color: #27ae60;' : 'color: #ef4444;') 
        : 'color: #999;';
    
    return `
    <div class="${cardClass}">
        <div class="fund-card-header ${actualHeaderColorClass}">
            <div class="fund-title" style="position: relative; display: flex; justify-content: center; align-items: center; text-align: center;">
                <div>${etfData.etfCode}（${etfData.etfName}）</div>
                <div style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #999; font-size: 12px; pointer-events: none;">${etfData.lastOperationTime || ''}</div>
            </div>
        </div>
        <div class="fund-card-content">
            <div class="fund-data-row">
                <span class="data-label">执行次数</span>
                <span class="data-value">${etfData.executionCount}次</span>
            </div>
            <div class="fund-data-row">
                <span class="data-label">累计收益率</span>
                <span class="data-value profit" style="${profitColorStyle}">
                    ${profitValue >= 0 ? '+' : ''}${etfData.cumulativeYieldRate}
                </span>
            </div>
            <div class="fund-data-row">
                <span class="data-label">基准价/当前档位</span>
                <span class="data-value">
                    ${formattedBasePrice}/${etfData.currentLevel} <span class="level-type">${levelType}</span>
                </span>
            </div>
            <div class="fund-data-row">
                <span class="data-label">买入价</span>
                <span class="data-value">${formattedBuyPrice}</span>
            </div>
            <div class="fund-data-row">
                <span class="data-label">步长</span>
                <span class="data-value">${etfData.stepSize}</span>
            </div>
            <div class="fund-data-row">
                <span class="data-label">最新净值</span>
                <span class="data-value nav" style="${netValueColorStyle}" title="更新日期: ${etfData.netValueDate || '未知'}">${netValueDisplay}<small>${netValueDateStr}</small></span>
            </div>
            <div class="fund-data-row">
                <span class="data-label">净值对比买入价变化</span>
                <span class="data-value nav-change" style="${netValueColorStyle}">
                    ${netValueChangePercent >= 0 ? '+' : ''}${etfData.netValueChangeRate}
                </span>
            </div>
        </div>
        <div class="fund-card-footer ${actualHeaderColorClass}">
            <button class="${btnClass}" data-etf-code="${etfData.etfCode}" data-source-file="${etfData.sourceFile}" ${btnDisabledAttr}>查看详情</button>
        </div>
    </div>
    `;
}

/**
 * 渲染ETF卡片列表
 * @param {Array<Object>} etfDataArray - ETF数据数组
 */
function renderCards(etfDataArray) {
    if (!etfDataArray || etfDataArray.length === 0) {
        console.warn('没有ETF数据可渲染');
        return;
    }
    
    try {
        // 获取卡片容器元素
        const cardsContainer = document.querySelector('.fund-cards-container');
        
        if (!cardsContainer) {
            console.error('找不到卡片容器元素(.fund-cards-container)');
            return;
        }
        
        // 创建卡片容器
        cardsContainer.innerHTML = '<div class="fund-cards all-cards"></div>';
        const allCardsContainer = document.querySelector('.all-cards');
        
        // 清空现有卡片
        allCardsContainer.innerHTML = '';
        
        // 渲染所有ETF卡片（不再区分运行中和已暂停）
        etfDataArray.forEach(etfData => {
            const cardHTML = createCardElement(etfData);
            allCardsContainer.innerHTML += cardHTML;
        });
        
        // 如果没有ETF，显示一条消息
        if (etfDataArray.length === 0) {
            allCardsContainer.innerHTML = '<div class="no-data-message">当前没有ETF数据</div>';
        }
        
        console.log(`成功渲染 ${etfDataArray.length} 个ETF卡片`);
    } catch (error) {
        console.error('渲染ETF卡片时出错:', error);
    }
}

/**
 * 添加卡片按钮的事件监听
 */
function addCardEventListeners() {
    try {
        // 获取所有详情按钮
        const detailButtons = document.querySelectorAll('.detail-btn');
        
        // 添加点击事件
        detailButtons.forEach(button => {
            // 跳过已禁用的按钮
            if (button.classList.contains('disabled') || button.hasAttribute('disabled')) {
                return;
            }
            
            button.addEventListener('click', function() {
                // 获取ETF代码和源文件
                const etfCode = this.getAttribute('data-etf-code');
                const sourceFile = this.getAttribute('data-source-file');
                
                // 构建详情页URL
                const detailUrl = `grid-detail.html?etfCode=${etfCode}&sourceFile=${encodeURIComponent(sourceFile)}`;
                
                // 导航到详情页
                window.location.href = detailUrl;
                
                console.log(`导航到ETF详情页: ${detailUrl}`);
            });
        });
        
        console.log('卡片事件监听器添加完成');
    } catch (error) {
        console.error('添加卡片事件监听器时出错:', error);
    }
}

/**
 * 渲染概览信息
 * @param {Object} summary - 总体概览信息
 */
function renderOverallSummary(summary) {
    try {
        // 更新总体信息
        // 显示运行中ETF/总执行次数
        const etfCountElement = document.querySelector('.info-sidebar .info-item:nth-child(1) .value-number');
        if (etfCountElement) {
            etfCountElement.textContent = `${summary.runningEtfCount || 0}/${summary.totalExecutionCount || 0}`;
            // 更新元素样式
            const parentValueElement = etfCountElement.closest('.info-value');
            if (parentValueElement) {
                parentValueElement.className = 'info-value';
                parentValueElement.classList.add(summary.runningEtfCount > 0 ? 'green-value' : 'gray-value');
            }
        }
        
        // 显示买入/卖出金额
        const amountElement = document.querySelector('.info-sidebar .info-item:nth-child(2) .value-number');
        if (amountElement) {
            amountElement.textContent = `${summary.totalBuyAmount || 0}/${summary.totalSellAmount || 0}`;
        }
        
        // 显示买入/卖出/剩余股数
        const sharesElement = document.querySelector('.info-sidebar .info-item:nth-child(3) .value-number');
        if (sharesElement) {
            sharesElement.textContent = `${summary.totalBuyShares || 0}/${summary.totalSellShares || 0}/${summary.totalRemainingShares || 0}`;
        }
        
        // 显示收益/收益率
        const profitValueElement = document.querySelector('.info-sidebar .info-item:nth-child(4) .value-number');
        const profitPercentElement = document.querySelector('.info-sidebar .info-item:nth-child(4) .value-percent');
        
        if (profitValueElement) {
            profitValueElement.textContent = summary.totalProfit || '0';
        }
        
        if (profitPercentElement) {
            const profitRate = summary.overallProfitRate || '0.00%';
            profitPercentElement.textContent = profitRate.startsWith('+') ? profitRate : (parseFloat(profitRate) >= 0 ? '+' + profitRate : profitRate);
            
            // 更新颜色
            const profitContainer = document.querySelector('.info-sidebar .info-item:nth-child(4) .value-inline');
            if (profitContainer) {
                profitContainer.className = 'value-inline';
                profitContainer.classList.add(parseFloat(summary.totalProfit || 0) >= 0 ? 'positive' : 'negative');
            }
        }
        
        console.log('总体概览信息渲染完成');
    } catch (error) {
        console.error('渲染总体概览信息时出错:', error);
    }
}
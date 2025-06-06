// 网格策略详情页面数据处理脚本

// 全局变量
let etfData = null; // 当前ETF的处理后数据
let etfJsonData = null; // 原始JSON数据
let latestNetValues = {}; // 最新净值数据
let trendChartInstance = null; // 图表实例

/**
 * 获取URL参数
 * @param {string} name - 参数名
 * @returns {string|null} - 参数值或null
 */
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * 异步加载单个JSON文件
 * @param {string} filename - 要加载的JSON文件名 (不含路径)
 * @returns {Promise<Object>} 包含JSON数据的Promise
 */
async function fetchJsonData(filename) {
    let filePath = ''; // 在 try 块外部声明 filePath 以便 catch 块可以访问
    try {
        // 构建指向 dist/data/grid/ 的文件路径 (服务器根路径是 dist/)
        // *** 确保这里使用的是 /data/grid/ 而不是 /public/data/grid/ ***
        filePath = `/data/grid/${filename}`;

        // 使用fetch API获取JSON文件
        const response = await fetch(filePath);

        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // 解析JSON数据
        const jsonData = await response.json();

        console.log(`成功加载 ${filePath}`); // 使用正确的文件路径日志
        return jsonData;
    } catch (error) {
        console.error(`加载 ${filename} (路径: ${filePath}) 失败:`, error); // 使用正确的文件路径日志
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
 * 获取所有ETF的最新净值
 * @returns {Promise<Object>} 包含所有ETF最新净值的对象：{code: netValue, ...}
 */
async function fetchLatestNetValues() {
    try {
        // 尝试先从本地文件加载最新净值数据
        try {
            const localNetValuesData = await fetchJsonData('latest_netvalues.json');
            if (!localNetValuesData.error) {
                console.log('成功从本地文件加载最新净值数据');
                
                // 创建一个新对象存储处理后的净值数据
                const processedNetValues = {};
                
                // 处理嵌套结构，提取netValue值
                Object.keys(localNetValuesData).forEach(key => {
                    // 跳过lastUpdated字段
                    if (key === 'lastUpdated') return;
                    
                    // 检查值的类型并相应地提取
                    if (typeof localNetValuesData[key] === 'object' && localNetValuesData[key] !== null) {
                        // 如果是对象格式 {"netValue": xxx}
                        processedNetValues[key] = localNetValuesData[key].netValue;
                        console.log(`处理ETF ${key}的净值数据: ${processedNetValues[key]}`);
                    } else {
                        // 如果直接是数值
                        processedNetValues[key] = localNetValuesData[key];
                    }
                });
                
                return processedNetValues;
            }
        } catch (err) {
            console.log('本地最新净值数据不可用，将从API获取');
        }
        
        // 如果本地数据不可用，可以考虑从主页面传递过来的数据
        console.warn('无法获取最新净值数据，将使用备用数据');
        
        // 创建一个备用数据对象，可以包含常见ETF的默认净值
        // 这些值只是示例，应根据实际情况调整或从其他来源获取
        const fallbackData = {
            // 添加常见ETF代码的默认净值
            '512980': 1.0, // 使用1.0作为默认值，或从历史数据中获取
            '510300': 1.0,
            '510500': 1.0,
            '159915': 1.0,
            '159919': 1.0,
            '159922': 1.0,
            '159920': 1.0,
            '159938': 1.0,
            '512880': 1.0,
            '513050': 1.0,
            '513180': 1.0, // 添加恒生科技ETF的默认净值
            '513500': 1.0,
            '513520': 1.0,
            '515180': 1.0
        };
        
        console.log('使用备用数据作为最新净值数据');
        return fallbackData;
    } catch (error) {
        console.error('获取最新净值失败:', error);
        return {};
    }
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
 * 计算单个ETF的数据
 * 注意：此函数应当从主页面的grid-data.js中导入或复制，以确保计算逻辑一致
 * @param {Object} jsonData ETF的JSON数据
 * @param {number} latestNetValue 最新净值
 * @returns {Object} 格式化后的ETF数据对象
 */
function calculateEtfData(jsonData, latestNetValue) { // latestNetValue 可能为 null
    try {
        // 检查JSON数据是否有效
        if (!jsonData || typeof jsonData !== 'object') {
            throw new Error('无效的ETF JSON数据');
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
        
        // 计算步长
        let stepSize = '未知';
        if (jsonData["网格交易数据"] && jsonData["网格交易数据"].length >= 2) {
            try {
                const level1 = jsonData["网格交易数据"][0]["档位"];
                const level2 = jsonData["网格交易数据"][1]["档位"];
                if (level1 && level2) {
                    // 使用Math.round取整计算步长
                    const smallStep = Math.round(Math.abs((level1 - level2) * 100));
                    const mediumStep = Math.round(smallStep * 3);
                    const largeStep = Math.round(smallStep * 6);
                    stepSize = `${smallStep}/${mediumStep}/${largeStep}`;
                    console.log('计算步长结果:', {smallStep, mediumStep, largeStep});
                }
            } catch (error) {
                console.error('计算步长失败:', error);
            }
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
        
        // 计算基准价 - 与grid-data.js保持一致的实现
        let basePrice = null;
        try {
            // 尝试从网格交易数据中提取基准价
            if (jsonData["网格交易数据"] && jsonData["网格交易数据"].length > 0) {
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
            }
            
            // 如果无法从网格数据提取，尝试使用其他方法（保留此备用方案）
            if (basePrice === null && gridLevels.length > 0) {
                // 尝试找到级别为1.0的网格作为基准价
                const level1Grid = gridLevels.find(g => Math.abs(g.level - 1.0) < 0.001);
                if (level1Grid) {
                    basePrice = level1Grid.price;
                }
            }
            
            // 如果仍然找不到，使用默认值
            if (basePrice === null) {
                basePrice = 1.0;
            }
        } catch (error) {
            console.error('计算基准价失败:', error);
            basePrice = 1.0; // 出错时设为默认值
        }
        
        // 计算当前档位买入价
        let currentLevelBuyPrice = null; // 默认为 null
        let currentLevel = null;
        try {
            // 仅当 latestNetValue 有效时才计算
            if (latestNetValue !== null && gridLevels.length > 0 && latestNetValue > 0) { 
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
                
                // 将 currentLevelBuyPrice 转换为数字或保持 null
                currentLevelBuyPrice = matchedLevel ? parseFloat(matchedLevel.price) : null;
                currentLevel = matchedLevel ? matchedLevel.level : null;
            }
        } catch (error) {
            console.error('计算当前档位买入价失败:', error);
            currentLevelBuyPrice = null; // 出错时设为 null
            currentLevel = null;
        }
        
        // 计算净值变化率
        let netValueChangeRate = null; // 默认为 null
        let headerColor = 'gray';
        try {
            // 输出调试信息
            console.log('计算净值变化率:', {
                最新净值: latestNetValue, 
                当前档位买入价: currentLevelBuyPrice,
                净值类型: typeof latestNetValue,
                买入价类型: typeof currentLevelBuyPrice
            });
            
             // 仅当 latestNetValue 和 currentLevelBuyPrice 都有效时才计算
            if (latestNetValue !== null && latestNetValue > 0 && 
                currentLevelBuyPrice !== null && currentLevelBuyPrice > 0) {
                const changeRate = (latestNetValue - currentLevelBuyPrice) / currentLevelBuyPrice * 100;
                netValueChangeRate = changeRate.toFixed(2) + '%';
                headerColor = changeRate < 0 ? 'red' : 'green';
            } else {
                // 明确显示为'N/A'而不是null
                netValueChangeRate = 'N/A';
                // 保持默认颜色
            }
        } catch (error) {
            console.error('计算净值变化率失败:', error);
            netValueChangeRate = 'N/A'; // 出错时设为明确的文本
        }
        
        // 返回格式化的ETF数据对象
        return {
            etfName,
            etfCode,
            category,
            isRunning,
            executionCount,
            cumulativeYieldRate,
            currentLevel, // 可能为 null
            currentLevelBuyPrice, // 可能为 null 或 数字
            stepSize,
            latestNetValue: latestNetValue !== null ? parseFloat(latestNetValue) || 0 : 0, // 确保是数字类型或0
            netValueChangeRate, // 可能为 null 或 字符串 ('x.xx%')
            headerColor,
            sourceFile: jsonData.sourceFile || '',
            gridLevels: gridLevels || [],
            executions: executions || [],
            basePrice: basePrice // 添加基准价字段
        };
    } catch (error) {
        console.error('计算ETF数据失败:', error);
        throw error;
    }
}

/**
 * 加载ETF详情数据
 * @returns {Promise<Object>} ETF详情数据
 */
async function loadEtfDetailData() {
    console.log('loadEtfDetailData函数开始执行', new Date().toISOString());
    try {
        // 获取URL参数
        const etfCode = getUrlParameter('etfCode');
        const sourceFile = getUrlParameter('sourceFile');
        
        console.log(`URL参数: etfCode=${etfCode}, sourceFile=${sourceFile}`);
        
        if (!etfCode && !sourceFile) {
            throw new Error('URL参数缺失: 需要etfCode或sourceFile参数');
        }
        
        // 构建文件名
        const filename = sourceFile || `${etfCode}.json`;
        console.log(`准备加载文件: ${filename}`);
        
        // 加载ETF数据和最新净值
        const [jsonData, latestNetValues] = await Promise.all([
            fetchJsonData(filename),
            fetchLatestNetValues()
        ]);
        
        console.log(`数据加载完成: 文件=${filename}, 净值数据大小=${Object.keys(latestNetValues).length}`);
        
        // 获取净值
        const etfCodeFromData = jsonData.etfCode || extractEtfCodeFromFilename(filename);
        const rawNetValue = latestNetValues[etfCodeFromData];

        // 打印诊断信息
        console.log(`尝试获取ETF ${etfCodeFromData}的净值数据:`, rawNetValue);
        console.log(`latestNetValues对象内容:`, latestNetValues);

        // 尝试将净值转换为数字
        let latestNetValue = null;
        if (rawNetValue !== undefined && rawNetValue !== null) {
            latestNetValue = typeof rawNetValue === 'number' ? rawNetValue : parseFloat(rawNetValue);
            // 如果转换结果是NaN，设为null
            if (isNaN(latestNetValue)) {
                latestNetValue = null;
            }
        }
        
        console.log(`ETF代码: ${etfCodeFromData}, 最新净值: ${latestNetValue || '未获取到'}`);
        
        if (!latestNetValue) {
            // 使用更友好的方式记录这一情况
            console.log(`信息: ETF ${etfCodeFromData} 使用默认净值或显示N/A`);
        }
        
        // 保存原始JSON数据以备后续使用
        etfJsonData = jsonData;
        
        // 计算详情数据 - 使用正确的函数名
        const detailData = calculateEtfData(jsonData, latestNetValue);
        console.log('ETF详情数据计算完成', new Date().toISOString());
        
        // 保存处理后的数据
        etfData = detailData;
        
        return detailData;
    } catch (error) {
        console.error('加载ETF详情数据失败:', error);
        throw error;
    }
}

/**
 * 渲染页面顶部信息栏
 * @param {Object} detailData - ETF详情数据
 */
function renderTopInfoBar(detailData) {
    try {
        if (!detailData) {
            console.error('没有有效的ETF详情数据');
            return;
        }
        
        // 设置ETF代码和名称
        document.getElementById('etfCode').textContent = detailData.etfCode || '未知';
        document.getElementById('etfName').textContent = detailData.etfName || '未知ETF';
        
        // 设置执行次数和累计收益率
        document.getElementById('executionCount').textContent = detailData.executionCount || 0;
        
        const cumulativeReturn = document.getElementById('cumulativeReturn');
        if (cumulativeReturn) {
            // 移除百分号并转为数值
            const returnValue = parseFloat(detailData.cumulativeYieldRate?.replace('%', '') || 0);
            cumulativeReturn.textContent = Math.abs(returnValue).toFixed(2);
            
            // 根据收益率正负设置颜色和图标
            const arrowIcon = cumulativeReturn.nextElementSibling;
            const parentElement = cumulativeReturn.parentElement;
            
            if (returnValue >= 0) {
                parentElement.classList.remove('text-red-600');
                parentElement.classList.add('text-emerald-600');
                if (arrowIcon) {
                    arrowIcon.setAttribute('data-lucide', 'arrow-up');
                }
            } else {
                parentElement.classList.remove('text-emerald-600');
                parentElement.classList.add('text-red-600');
                if (arrowIcon) {
                    arrowIcon.setAttribute('data-lucide', 'arrow-down');
                }
            }
        }
        
        // 设置当前档位/买入价
        const currentLevelElement = document.getElementById('currentLevel');
        if (currentLevelElement) {
            // 获取必要的值，确保有合理的默认值
            const level = detailData.currentLevel !== null ? detailData.currentLevel : 'N/A';
            const buyPrice = detailData.currentLevelBuyPrice !== null ? detailData.currentLevelBuyPrice : null;
            const basePrice = detailData.basePrice !== null ? detailData.basePrice : 1.0;
            
            // 确定网格类型
            let levelType = '(小档)';
            if (level <= 0.7) {
                levelType = '(大档)';
            } else if (level <= 0.85) {
                levelType = '(中档)';
            }
            
            // 格式化基准价(3位小数)
            const formattedBasePrice = typeof basePrice === 'number' ? basePrice.toFixed(3) : 'N/A';
            
            // 格式化当前档位和买入价
            const formattedLevel = typeof level === 'number' ? level : level;
            const formattedBuyPrice = buyPrice !== null ? 
                (typeof buyPrice === 'number' ? buyPrice.toFixed(3) : buyPrice) : 'N/A';
            
            // 使用与ETF卡片相同的格式：基准价/当前档位 网格类型（买入价）
            currentLevelElement.textContent = `${formattedBasePrice}/${formattedLevel} ${levelType}（${formattedBuyPrice}）`;
            
            // 不再使用单独的gridTypeAndPrice元素
            const gridTypeAndPriceElement = document.getElementById('gridTypeAndPrice');
            if (gridTypeAndPriceElement) {
                gridTypeAndPriceElement.textContent = '';
                gridTypeAndPriceElement.style.display = 'none';
            }
        }
        
        // 设置步长
        const stepSizeElement = document.getElementById('stepSize');
        if (stepSizeElement) {
            // 提取小网步长
            const steps = detailData.stepSize?.split('/') || []; // 添加空值检查
            let smallStep = steps[0] || 'N/A'; // 处理无效stepSize
            
            // 尝试将步长转为数字并取整
            if (smallStep !== 'N/A') {
                const numericStep = parseFloat(smallStep);
                if (!isNaN(numericStep)) {
                    smallStep = Math.round(numericStep).toString(); // 取整处理并转换为字符串
                }
            }
            
            console.log('步长处理:', {原始值: steps[0], 处理后值: smallStep});
            stepSizeElement.textContent = smallStep;
        }
        
        // 设置最新净值
        const latestNetValueElement = document.getElementById('latestNetValue');
        if (latestNetValueElement) {
            let netValue = 'N/A';
            if (detailData.latestNetValue !== null && detailData.latestNetValue !== undefined) {
                // 确保latestNetValue是数字类型
                const numericValue = typeof detailData.latestNetValue === 'number' 
                    ? detailData.latestNetValue 
                    : parseFloat(detailData.latestNetValue);
                
                console.log('renderTopInfoBar: 处理净值数据:', {
                    原始数据: detailData.latestNetValue,
                    数据类型: typeof detailData.latestNetValue,
                    转换结果: numericValue,
                    是否为NaN: isNaN(numericValue)
                });
                
                if (!isNaN(numericValue)) {
                    netValue = numericValue.toFixed(4);
                }
            }
            latestNetValueElement.textContent = netValue;
        }
        
        // 设置净值对比买入价变化
        const priceChangeElement = document.getElementById('priceChange');
        if (priceChangeElement) {
            let formattedChange = 'N/A';
            const arrowIcon = priceChangeElement.nextElementSibling;
            const parentElement = priceChangeElement.parentElement;
            
            // 移除现有颜色类
            parentElement.classList.remove('text-red-600', 'text-emerald-600', 'text-slate-500');

            if (detailData.netValueChangeRate !== null && detailData.netValueChangeRate !== 'N/A') {
                // 尝试从netValueChangeRate中提取数值
                let changeValue = null;
                try {
                    changeValue = parseFloat(detailData.netValueChangeRate.replace('%', ''));
                    if (!isNaN(changeValue)) {
                formattedChange = (changeValue >= 0 ? '+' : '') + changeValue.toFixed(2) + '%';
                
                // 根据变化率正负设置颜色和图标
            if (changeValue >= 0) {
                parentElement.classList.add('text-emerald-600');
                    if (arrowIcon) arrowIcon.setAttribute('data-lucide', 'arrow-up');
            } else {
                parentElement.classList.add('text-red-600');
                    if (arrowIcon) arrowIcon.setAttribute('data-lucide', 'arrow-down');
                }
                        
                        // 确保显示箭头
                        if (arrowIcon) arrowIcon.style.display = '';
            } else {
                        throw new Error('Invalid change value');
                    }
                } catch (e) {
                    // 解析出错，使用N/A展示
                    formattedChange = 'N/A';
                    parentElement.classList.add('text-slate-500');
                    if (arrowIcon) arrowIcon.style.display = 'none';
                }
            } else {
                // 如果 netValueChangeRate 为 null或'N/A'，隐藏箭头
                 if (arrowIcon) arrowIcon.style.display = 'none';
                 parentElement.classList.add('text-slate-500'); // 使用中性色
            }
            priceChangeElement.textContent = formattedChange;
        }
        
        // 重新初始化图标
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        console.log('顶部信息栏渲染完成');
    } catch (error) {
        console.error('渲染顶部信息栏失败:', error);
    }
}

/**
 * 准备趋势图表所需的数据
 * @param {Object} detailData - ETF详情数据
 * @returns {Object} 图表数据结构
 */
function prepareChartData(detailData) {
    try {
        if (!detailData || !detailData.executions || !Array.isArray(detailData.executions)) {
            console.error('没有有效的执行记录数据');
            return { dates: [], values: [], buyPoints: [], sellPoints: [] };
        }
        
        // 按日期排序执行记录
        const sortedExecutions = [...detailData.executions].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        // 提取时间轴日期 - 确保使用标准格式处理
        const dates = sortedExecutions.map(exec => {
            // 确保日期格式统一，与表格中使用的完全一致
            const dateObj = new Date(exec.date);
            if (isNaN(dateObj.getTime())) {
                console.warn('无效日期格式:', exec.date);
                return exec.date; // 如果无法解析，则原样返回
            }
            // 使用与表格完全一致的日期格式
            return exec.date;
        });
        
        // 创建价格数据序列（交易价格作为净值的近似值）
        const values = sortedExecutions.map(exec => exec.price);
        
        // 提取买入点和卖出点
        const buyPoints = [];
        const sellPoints = [];
        
        sortedExecutions.forEach((exec, index) => {
            if (exec.type === 'BUY') {
                buyPoints.push({
                    index,
                    x: exec.date, // 确保x坐标使用与表格相同的日期格式
                    y: exec.price, // 图表使用x/y坐标系
                    date: exec.date,
                    price: exec.price,
                    shares: exec.shares,
                    amount: exec.amount
                });
            } else if (exec.type === 'SELL') {
                // 找出与此卖出点配对的买入点
                let relatedBuyPoint = null;
                for (let i = buyPoints.length - 1; i >= 0; i--) {
                    // 简单匹配逻辑：找到最近的、尚未被配对的买入点
                    // 实际业务逻辑可能需要更复杂的匹配规则
                    if (!buyPoints[i].paired) {
                        relatedBuyPoint = buyPoints[i];
                        buyPoints[i].paired = true;
                        break;
                    }
                }
                
                sellPoints.push({
                    index,
                    x: exec.date, // 确保x坐标使用与表格相同的日期格式
                    y: exec.price, // 图表使用x/y坐标系
                    date: exec.date,
                    price: exec.price,
                    shares: exec.shares,
                    amount: exec.amount,
                    profit: exec.profit,
                    profitRate: exec.profitRate,
                    // 关联的买入点索引，用于图表展示连线
                    relatedBuyIndex: relatedBuyPoint ? relatedBuyPoint.index : null
                });
            }
        });
        
        return {
            // 时间轴标签（日期）
            dates,
            // 净值数据
            values,
            // 买入点数据
            buyPoints,
            // 卖出点数据
            sellPoints,
            // 元数据
            metadata: {
                etfCode: detailData.etfCode,
                etfName: detailData.etfName,
                // 添加其他可能需要的元数据
            }
        };
    } catch (error) {
        console.error('准备图表数据失败:', error);
        return { dates: [], values: [], buyPoints: [], sellPoints: [] };
    }
}

/**
 * 渲染趋势图
 * @param {Object} chartData - 图表数据
 */
function renderTrendChart(chartData) {
    try {
        if (!chartData || !chartData.dates || chartData.dates.length === 0) {
            console.error('图表数据不完整');
            return;
        }

        // 保存原始数据，方便后续时间范围切换和放大查看
        window.originalChartData = JSON.parse(JSON.stringify(chartData));

        // 检查是否已存在Chart实例，如果存在则先销毁
        if (window.Chart) {
            const chartStatus = Chart.getChart('trendChart');
            if (chartStatus) {
                console.log('销毁已存在的图表实例');
                // 禁用动画，避免闪烁
                chartStatus.options.animation = false;
                chartStatus.destroy();
            }
        }
        
        // 禁用初始动画，避免图例闪烁
        Chart.defaults.animation = false;

        // 添加自定义插件确保买卖点显示在最上层
        const pointsOnTopPlugin = {
            id: 'pointsOnTop',
            beforeDatasetsDraw: function(chart) {
                // 重置自定义绘制顺序，避免影响图表更新
                // 此处只保留最基本功能，确保买卖点在上层但不干扰更新机制
                const datasets = chart.data.datasets;
                datasets.forEach(dataset => {
                    if (dataset.label === '买入' || dataset.label === '卖出') {
                        dataset.order = 1;  // 最上层
                    } else if (dataset.label === '交易配对') {
                        dataset.order = 2;  // 中间层
                    } else {
                        dataset.order = 3;  // 底层
                    }
                });
            }
        };
        
        // 注册插件
        Chart.register(pointsOnTopPlugin);

        const ctx = document.getElementById('trendChart').getContext('2d');
        
        // 准备净值数据供tooltip使用
        const netValueData = chartData.dates.map((date, index) => ({
            x: date,
            y: chartData.values[index]
        }));
        // 将净值数据添加到chartData对象，以便tooltip可以访问
        chartData.netValueData = netValueData;
        
        // 构建数据集
        const datasets = [];
        
        // 买入点数据集
        const buyPointsDataset = {
            label: '买入',
            data: [],
            backgroundColor: 'rgba(16, 185, 129, 0.8)', // emerald-500
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1.5,
            pointRadius: 12, // 降低大小，从16降到12
            pointHoverRadius: 16, // 增加悬停大小，鼠标悬停时放大
            showLine: false,
            pointStyle: function(context) {
                // 检查context和parsed属性是否存在
                if (!context || !context.parsed) {
                    return;
                }
                
                // 创建圆形带B标记的点
                const ctx = context.chart.ctx;
                let pointSize = (!context.parsed || context.parsed.y === null || context.parsed.y === undefined) ? 0 : 12; // 基础大小
                
                // 检查是否处于悬停状态
                if (context.active) {
                    pointSize = 14; // 悬停时放大
                }
                
                if (pointSize === 0) return;
                
                // 创建一个新的图片对象
                const img = new Image(pointSize * 2, pointSize * 2);
                // 设定一个onload处理函数，确保图片加载后再绘制
                img.onload = function() {
                    ctx.drawImage(img, context.x - pointSize, context.y - pointSize, pointSize * 2, pointSize * 2);
                };
                
                // 预处理图片数据（创建一个带B字母的绿色圆圈）
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = pointSize * 2 + 4; // 稍大一点以便添加阴影
                tempCanvas.height = pointSize * 2 + 4;
                const tempCtx = tempCanvas.getContext('2d');
                
                // 添加阴影效果
                tempCtx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // 更深的阴影
                tempCtx.shadowBlur = 6;
                tempCtx.shadowOffsetX = 2;
                tempCtx.shadowOffsetY = 2;
                
                // 绘制绿色圆形背景
                tempCtx.beginPath();
                tempCtx.arc(pointSize + 2, pointSize + 2, pointSize, 0, 2 * Math.PI);
                tempCtx.fillStyle = 'rgba(16, 185, 129, 1)'; // 完全不透明的绿色
                tempCtx.fill();
                
                // 绘制白色边框
                tempCtx.shadowBlur = 0; // 移除边框的阴影
                tempCtx.shadowOffsetX = 0;
                tempCtx.shadowOffsetY = 0;
                tempCtx.lineWidth = 2;
                tempCtx.strokeStyle = 'white';
                tempCtx.stroke();
                
                // 绘制白色B字母，更大的字体
                tempCtx.font = 'bold ' + Math.round(pointSize * 1.3) + 'px Arial';
                tempCtx.textAlign = 'center';
                tempCtx.textBaseline = 'middle';
                tempCtx.fillStyle = 'white';
                tempCtx.fillText('B', pointSize + 2, pointSize + 2);
                
                // 将临时画布内容转为图片URL
                img.src = tempCanvas.toDataURL();
                
                return img;
            },
            order: 1, // 确保买入点绘制在最上层 (较小的order值显示在上层)
            // 使用高z-index确保它显示在最上层
            z: 10
        };
        
        // 卖出点数据集
        const sellPointsDataset = {
            label: '卖出',
            data: [],
            backgroundColor: 'rgba(239, 68, 68, 0.8)', // red-500
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1.5,
            pointRadius: 12, // 降低大小，从16降到12
            pointHoverRadius: 16, // 增加悬停大小，鼠标悬停时放大
            showLine: false,
            pointStyle: function(context) {
                // 检查context和parsed属性是否存在
                if (!context || !context.parsed) {
                    return;
                }
                
                // 创建圆形带S标记的点
                const ctx = context.chart.ctx;
                let pointSize = (!context.parsed || context.parsed.y === null || context.parsed.y === undefined) ? 0 : 12; // 基础大小
                
                // 检查是否处于悬停状态
                if (context.active) {
                    pointSize = 14; // 悬停时放大
                }
                
                if (pointSize === 0) return;
                
                // 创建一个新的图片对象
                const img = new Image(pointSize * 2, pointSize * 2);
                // 设定一个onload处理函数，确保图片加载后再绘制
                img.onload = function() {
                    ctx.drawImage(img, context.x - pointSize, context.y - pointSize, pointSize * 2, pointSize * 2);
                };
                
                // 预处理图片数据（创建一个带S字母的红色圆圈）
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = pointSize * 2 + 4; // 稍大一点以便添加阴影
                tempCanvas.height = pointSize * 2 + 4;
                const tempCtx = tempCanvas.getContext('2d');
                
                // 添加阴影效果
                tempCtx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // 更深的阴影
                tempCtx.shadowBlur = 6;
                tempCtx.shadowOffsetX = 2;
                tempCtx.shadowOffsetY = 2;
                
                // 绘制红色圆形背景
                tempCtx.beginPath();
                tempCtx.arc(pointSize + 2, pointSize + 2, pointSize, 0, 2 * Math.PI);
                tempCtx.fillStyle = 'rgba(239, 68, 68, 1)'; // 完全不透明的红色
                tempCtx.fill();
                
                // 绘制白色边框
                tempCtx.shadowBlur = 0; // 移除边框的阴影
                tempCtx.shadowOffsetX = 0;
                tempCtx.shadowOffsetY = 0;
                tempCtx.lineWidth = 2;
                tempCtx.strokeStyle = 'white';
                tempCtx.stroke();
                
                // 绘制白色S字母，更大的字体
                tempCtx.font = 'bold ' + Math.round(pointSize * 1.3) + 'px Arial';
                tempCtx.textAlign = 'center';
                tempCtx.textBaseline = 'middle';
                tempCtx.fillStyle = 'white';
                tempCtx.fillText('S', pointSize + 2, pointSize + 2);
                
                // 将临时画布内容转为图片URL
                img.src = tempCanvas.toDataURL();
                
                return img;
            },
            order: 1, // 确保卖出点绘制在最上层 (较小的order值显示在上层)
            // 使用高z-index确保它显示在最上层
            z: 10
        };
        
        // 配对线数据集（默认隐藏）
        const pairLinesDataset = {
            label: '交易配对',
            data: [],
            borderColor: 'rgba(107, 114, 128, 0.7)', // gray-500
            backgroundColor: 'rgba(107, 114, 128, 0)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            tension: 0,
            hidden: true, // 默认隐藏
            order: 2 // 确保配对线显示在趋势线之上，但在标记点之下
        };
        
        // 处理买入点和卖出点数据
        if (chartData.buyPoints && chartData.buyPoints.length > 0) {
            buyPointsDataset.data = chartData.buyPoints.map((point, index) => ({ 
                x: point.x || point.date, // 优先使用x坐标，确保与表格日期一致
                y: point.y || point.price,
                date: point.date, // 保留原始日期用于显示
                shares: point.shares,
                amount: point.amount,
                index: index, // 记录索引用于配对
                type: 'buy'
            }));
        }
        
        if (chartData.sellPoints && chartData.sellPoints.length > 0) {
            sellPointsDataset.data = chartData.sellPoints.map((point, index) => ({ 
                x: point.x || point.date, // 优先使用x坐标，确保与表格日期一致
                y: point.y || point.price,
                date: point.date, // 保留原始日期用于显示
                shares: point.shares,
                amount: point.amount,
                profit: point.profit,
                profitRate: point.profitRate,
                relatedBuyIndex: point.relatedBuyIndex,
                index: index, // 记录索引用于配对
                type: 'sell'
            }));
        }
        
        // 先添加底层元素 - 趋势线
        datasets.push({
            label: 'ETF净值',
            data: chartData.values.map((value, index) => ({ 
                x: chartData.dates[index], // 使用与买入/卖出点相同格式的日期
                y: value 
            })),
            borderColor: 'rgba(99, 102, 241, 0.8)', // indigo-500
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            order: 5 // 确保趋势线显示在最底层 (较大的order值显示在底层)
        });
        
        // 添加配对线数据集
        datasets.push(pairLinesDataset);
        
        // 最后添加标记点 - 确保它们在最上层
        if (buyPointsDataset.data.length > 0) {
            datasets.push(buyPointsDataset);
        }
        
        if (sellPointsDataset.data.length > 0) {
            datasets.push(sellPointsDataset);
        }
        
        // Is there a current level price in etfData?
        if (etfData && etfData.currentLevelBuyPrice) {
            const levelPrice = parseFloat(etfData.currentLevelBuyPrice);
            datasets.push({
                label: `当前档位 ${etfData.currentLevel}`,
                data: chartData.dates.map(date => ({ x: date, y: levelPrice })),
                borderColor: 'rgba(245, 158, 11, 0.7)', // amber-500
                borderWidth: 2,
                pointRadius: 0,
                pointHitRadius: 20, // 增加命中半径，使得更容易被选中
                tension: 0,
                fill: false,
                order: 4, // 确保当前档位线显示在ETF净值之上，但在买卖点之下
                hoverBorderWidth: 4, // 悬停时边框加粗
                hoverBorderColor: 'rgba(245, 158, 11, 1)' // 悬停时颜色更鲜明
            });
        }
        
        // 创建图表实例
        trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                hover: {
                    mode: 'nearest',
                    intersect: true // 确保需要鼠标直接悬停在元素上
                },
                interaction: {
                    mode: 'nearest',
                    intersect: true // 确保需要直接与元素相交
                },
                plugins: {
                    tooltip: {
                        enabled: true,
                        mode: 'nearest',
                        intersect: true, // 只在交叉时显示tooltip，而不是垂直于x轴显示
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', // 更深的背景色
                        padding: 10,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                const datasetLabel = context.dataset.label || '';
                                const value = context.parsed.y;
                                let label = '';
                                
                                // 档位线的特殊展示
                                if (datasetLabel && datasetLabel.startsWith('当前档位')) {
                                    label = `${datasetLabel.split(' ')[0]} ${datasetLabel.split(' ')[1]} | 价格: ${value.toFixed(4)}`;
                                    return label;
                                }
                                
                                // 为不同类型的数据显示不同的提示信息
                                if (datasetLabel === 'ETF净值') {
                                    label = `净值: ${value.toFixed(4)}`;
                                    
                                    // 添加日期信息
                                    if (context.raw && context.raw.x) {
                                        const date = new Date(context.raw.x);
                                        const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
                                        label += ` (${formattedDate})`;
                                    }
                                }
                                // 为买入点添加详细信息
                                else if (datasetLabel === '买入') {
                                    const dataPoint = context.raw;
                                    if (dataPoint) {
                                        label = `买入价: ${value.toFixed(4)}`;
                                        
                                        // 添加ETF净值信息
                                        if (chartData.netValueData) {
                                            const date = new Date(dataPoint.x);
                                            const dateStr = date.toISOString().split('T')[0];
                                            const netValuePoint = chartData.netValueData.find(p => 
                                                new Date(p.x).toISOString().split('T')[0] === dateStr);
                                            
                                            if (netValuePoint) {
                                                label += ` | 当日净值: ${netValuePoint.y.toFixed(4)}`;
                                            }
                                        }
                                        
                                        if (dataPoint.shares) {
                                            label += ` | 股数: ${dataPoint.shares.toLocaleString()}`;
                                        }
                                        
                                        if (dataPoint.amount) {
                                            label += ` | 金额: ¥${dataPoint.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                                        }
                                        
                                        // 添加日期信息
                                        if (dataPoint.x) {
                                            const date = new Date(dataPoint.x);
                                            const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
                                            label += ` | 日期: ${formattedDate}`;
                                        }
                                    }
                                }
                                // 为卖出点添加详细信息
                                else if (datasetLabel === '卖出') {
                                    const dataPoint = context.raw;
                                    if (dataPoint) {
                                        label = `卖出价: ${value.toFixed(4)}`;
                                        
                                        // 添加ETF净值信息
                                        if (chartData.netValueData) {
                                            const date = new Date(dataPoint.x);
                                            const dateStr = date.toISOString().split('T')[0];
                                            const netValuePoint = chartData.netValueData.find(p => 
                                                new Date(p.x).toISOString().split('T')[0] === dateStr);
                                            
                                            if (netValuePoint) {
                                                label += ` | 当日净值: ${netValuePoint.y.toFixed(4)}`;
                                            }
                                        }
                                        
                                        if (dataPoint.shares) {
                                            label += ` | 股数: ${dataPoint.shares.toLocaleString()}`;
                                        }
                                        
                                        if (dataPoint.amount) {
                                            label += ` | 金额: ¥${dataPoint.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                                        }
                                        
                                        if (dataPoint.profit) {
                                            const profitPrefix = dataPoint.profit >= 0 ? '+' : '';
                                            label += ` | 收益: ${profitPrefix}¥${dataPoint.profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                                        }
                                        
                                        if (dataPoint.profitRate) {
                                            let rateValue = dataPoint.profitRate;
                                            // 如果收益率是字符串形式，提取数值
                                            if (typeof rateValue === 'string') {
                                                rateValue = parseFloat(rateValue.replace('%', ''));
                                            }
                                            const ratePrefix = rateValue >= 0 ? '+' : '';
                                            label += ` | 收益率: ${ratePrefix}${rateValue.toFixed(2)}%`;
                                        }
                                        
                                        // 添加日期信息
                                        if (dataPoint.x) {
                                            const date = new Date(dataPoint.x);
                                            const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
                                            label += ` | 日期: ${formattedDate}`;
                                        }
                                        
                                        // 添加关联买入信息
                                        if (dataPoint.relatedBuyIndex !== undefined) {
                                            const relatedBuyPoint = buyPointsDataset.data.find(p => p.index === dataPoint.relatedBuyIndex);
                                            if (relatedBuyPoint) {
                                                const date = new Date(relatedBuyPoint.x);
                                                const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
                                                label += ` | 对应买入: ${formattedDate}`;
                                            }
                                        }
                                    }
                                }
                                // 当前档位水平线
                                else if (datasetLabel && datasetLabel.startsWith('当前档位')) {
                                    label = `${datasetLabel}: ${value.toFixed(4)}`;
                                }
                                // 配对线或其他数据集
                                else {
                                    label = `${datasetLabel}: ${value.toFixed(4)}`;
                                }
                                
                                return label;
                            },
                            // 自定义标题
                            title: function(tooltipItems) {
                                if (tooltipItems.length > 0) {
                                    const item = tooltipItems[0];
                                    const date = new Date(item.parsed.x);
                                    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
                                }
                                return '';
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        align: 'start',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            usePointStyle: true
                        },
                        // 保持图例项顺序固定
                        reverse: false,
                        // 防止图例在点击后位置变化
                        onClick: function(e, legendItem, legend) {
                            const index = legendItem.datasetIndex;
                            const ci = legend.chart;
                            
                            // 禁用所有动画以实现立即更新
                            const currentAnimationDuration = ci.options.animation.duration;
                            ci.options.animation.duration = 0;
                            
                            // 执行默认的图例点击行为（切换可见性）
                            if (ci.isDatasetVisible(index)) {
                                ci.hide(index);
                            } else {
                                ci.show(index);
                            }
                            
                            // 立即更新图表
                            ci.update();
                            
                            // 恢复动画设置
                            setTimeout(() => {
                                ci.options.animation.duration = currentAnimationDuration;
                            }, 0);
                        }
                    },
                    // 添加自定义插件
                    pointsOnTop: {
                        enabled: true
                    },
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'yyyy-MM-dd'
                            }
                        },
                        title: {
                            display: true,
                            text: '日期'
                        },
                        adapting: true,  // 添加自适应配置
                        ticks: {
                            autoSkip: true,
                            maxRotation: 45,
                            minRotation: 0
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '价格'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(4);
                            }
                        },
                        adapting: true  // 添加自适应配置
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                // 移除可能影响渲染的元素配置
                elements: {
                    point: {
                        // 不设置全局radius，保留在数据集中设置
                        z: 10
                    },
                    line: {
                        z: 1
                    }
                },
                // 添加自适应显示相关配置
                animation: {
                    duration: 300  // 降低动画时间以减少延迟感
                },
                transitions: {
                    active: {
                        animation: {
                            duration: 300
                        }
                    }
                }
            }
        });
        
        /**
         * 重置图表样式到默认状态
         */
        function resetChartStyles(chartInstance) {
            // 如果未提供图表实例，使用全局trendChartInstance
            const chart = chartInstance || trendChartInstance;
            if (!chart) return;
            
            // 获取数据集引用
            const buyPointsData = chart.data.datasets.find(ds => ds.label === '买入');
            const sellPointsData = chart.data.datasets.find(ds => ds.label === '卖出');
            const pairLinesData = chart.data.datasets.find(ds => ds.label === '交易配对');
            
            if (!buyPointsData || !sellPointsData) return;
            
                // 重置买入点样式
            if (buyPointsData) {
                buyPointsData.pointBackgroundColor = Array(buyPointsData.data.length).fill('rgba(16, 185, 129, 0.8)');
                buyPointsData.pointBorderColor = Array(buyPointsData.data.length).fill('rgba(16, 185, 129, 1)');
                buyPointsData.pointRadius = Array(buyPointsData.data.length).fill(7);
            }
            
                // 重置卖出点样式
            if (sellPointsData) {
                sellPointsData.pointBackgroundColor = Array(sellPointsData.data.length).fill('rgba(239, 68, 68, 0.8)');
                sellPointsData.pointBorderColor = Array(sellPointsData.data.length).fill('rgba(239, 68, 68, 1)');
                sellPointsData.pointRadius = Array(sellPointsData.data.length).fill(7);
            }
            
            // 隐藏所有连接线
            if (pairLinesData) {
                pairLinesData.data = [];
            }
            
            // 更新图表
            chart.update();
        }
        
        /**
         * 高亮关联的点
         * @param {Object} point - 当前悬停的点
         * @param {string} type - 点的类型 'buy' 或 'sell'
         * @param {number} index - 点的索引
         */
        // 用于存储呼吸动画的计时器ID
        let breathingAnimationTimer = null;
        
        function highlightRelatedPoints(point, type, index, chartInstance) {
            // 如果没有提供图表实例，默认使用主图表
            const chart = chartInstance || trendChartInstance;
            if (!chart) return;
            
            // 获取数据集引用
            const buyPointsData = chart.data.datasets.find(ds => ds.label === '买入');
            const sellPointsData = chart.data.datasets.find(ds => ds.label === '卖出');
            const pairLinesData = chart.data.datasets.find(ds => ds.label === '交易配对');
            
            if (!buyPointsData || !sellPointsData || !pairLinesData) {
                console.log('无法找到必要的数据集');
                return;
            }
            
            // 重置所有点的样式
            resetChartStyles(chart);
            
            // 使连线数据集可见
            pairLinesData.hidden = false;
            
            if (type === 'buy') {
                // 高亮当前买入点
                    const buyBgColors = Array(buyPointsData.data.length).fill('rgba(16, 185, 129, 0.8)');
                    const buyBorderColors = Array(buyPointsData.data.length).fill('rgba(16, 185, 129, 1)');
                const buyRadiuses = Array(buyPointsData.data.length).fill(6);
                
                buyBgColors[index] = 'rgba(16, 185, 129, 1)'; // 保持绿色但更亮
                buyBorderColors[index] = 'rgba(0, 0, 0, 1)'; // 黑色边框突出显示
                buyRadiuses[index] = 9; // 放大点的大小
                
                buyPointsData.pointBackgroundColor = buyBgColors;
                buyPointsData.pointBorderColor = buyBorderColors;
                buyPointsData.pointRadius = buyRadiuses;
                            
                            // 显示连接线
                const lineData = [{ x: point.x, y: point.y }];
                
                // 查找所有关联到当前买入点的卖出点
                const relatedSellPoints = sellPointsData.data.filter(p => p.relatedBuyIndex === index);
                console.log(`买入点${index}有${relatedSellPoints.length}个关联的卖出点`);
                
                if (relatedSellPoints.length > 0) {
                    // 高亮关联的卖出点
                    const sellBgColors = Array(sellPointsData.data.length).fill('rgba(239, 68, 68, 0.8)');
                    const sellBorderColors = Array(sellPointsData.data.length).fill('rgba(239, 68, 68, 1)');
                    const sellRadiuses = Array(sellPointsData.data.length).fill(6);
                    
                        relatedSellPoints.forEach(sellPoint => {
                        const sellIndex = sellPointsData.data.indexOf(sellPoint);
                        if (sellIndex >= 0) {
                            sellBgColors[sellIndex] = 'rgba(239, 68, 68, 1)'; // 保持红色但更亮
                            sellBorderColors[sellIndex] = 'rgba(0, 0, 0, 1)'; // 黑色边框突出显示
                            sellRadiuses[sellIndex] = 9; // 放大点的大小
                            
                            // 添加连接线终点
                            lineData.push({ x: sellPoint.x, y: sellPoint.y });
                        }
                    });
                    
                    // 应用卖出点样式
                    sellPointsData.pointBackgroundColor = sellBgColors;
                    sellPointsData.pointBorderColor = sellBorderColors;
                    sellPointsData.pointRadius = sellRadiuses;
                    
                    // 添加连接线
                    pairLinesData.data = lineData;
                } else {
                    console.log(`买入点${index}没有关联的卖出点`);
                    // 无关联点，仅更新当前点
                    pairLinesData.data = [];
                }
            } else if (type === 'sell') {
                // 高亮当前卖出点
                const sellBgColors = Array(sellPointsData.data.length).fill('rgba(239, 68, 68, 0.8)');
                const sellBorderColors = Array(sellPointsData.data.length).fill('rgba(239, 68, 68, 1)');
                const sellRadiuses = Array(sellPointsData.data.length).fill(6);
                
                sellBgColors[index] = 'rgba(239, 68, 68, 1)'; // 保持红色但更亮
                sellBorderColors[index] = 'rgba(0, 0, 0, 1)'; // 黑色边框突出显示
                sellRadiuses[index] = 9; // 放大点的大小
                            
                            sellPointsData.pointBackgroundColor = sellBgColors;
                            sellPointsData.pointBorderColor = sellBorderColors;
                            sellPointsData.pointRadius = sellRadiuses;
                            
                // 检查是否有关联的买入点
                const relatedBuyIndex = point.relatedBuyIndex;
                console.log(`卖出点${index}关联的买入点索引为:`, relatedBuyIndex);
                
                // 确保关联的买入点存在且索引有效
                if (relatedBuyIndex !== null && relatedBuyIndex !== undefined && 
                    relatedBuyIndex >= 0 && relatedBuyIndex < buyPointsData.data.length) {
                    
                    // 高亮关联的买入点
                    const buyBgColors = Array(buyPointsData.data.length).fill('rgba(16, 185, 129, 0.8)');
                    const buyBorderColors = Array(buyPointsData.data.length).fill('rgba(16, 185, 129, 1)');
                    const buyRadiuses = Array(buyPointsData.data.length).fill(6);
                    
                    buyBgColors[relatedBuyIndex] = 'rgba(16, 185, 129, 1)'; // 保持绿色但更亮 
                    buyBorderColors[relatedBuyIndex] = 'rgba(0, 0, 0, 1)'; // 黑色边框突出显示
                    buyRadiuses[relatedBuyIndex] = 9; // 放大点的大小
                        
                        buyPointsData.pointBackgroundColor = buyBgColors;
                        buyPointsData.pointBorderColor = buyBorderColors;
                        buyPointsData.pointRadius = buyRadiuses;
                        
                    // 添加连接线
                    pairLinesData.data = [
                        { x: buyPointsData.data[relatedBuyIndex].x, y: buyPointsData.data[relatedBuyIndex].y },
                        { x: point.x, y: point.y }
                    ];
                } else {
                    console.log(`卖出点${index}没有有效的关联买入点`);
                    // 无关联买入点，不显示连线
                    pairLinesData.data = [];
                }
            }
            
            // 更新图表
            chart.update();
        }
        
        // 设置时间范围切换按钮点击事件
        setupTimeRangeButtons();
        
        console.log('趋势图渲染完成');
    } catch (error) {
        console.error('渲染趋势图失败:', error);
    }
}

/**
 * 准备交易明细表格数据
 * @param {Object} detailData - 计算后的ETF详细数据
 * @returns {Object} 包含表头、行数据和表尾合计的对象
 */
function prepareTradeDetailsTable(detailData) {
    console.log("Preparing trade details table with data:", detailData); // 添加日志
    if (!detailData || !Array.isArray(detailData.executions)) {
        console.error('交易记录数据不完整或无效:', detailData); // 完善错误日志
        // 返回一个空结构，避免后续渲染出错
        return {
            headers: ["日期", "类型", "价格", "股数", "金额", "收益", "收益率"],
            rows: [],
            summary: calculateTradeDetailsSummary([]) // 计算空记录的摘要
        };
        }

    const executions = detailData.executions;
    console.log(`Processing ${executions.length} execution records.`); // 添加日志

    const headers = ["日期", "类型", "价格", "股数", "金额", "收益", "收益率"];

    const rows = executions.map(exec => {
        const typeText = exec.type === 'BUY' ? '买入' : '卖出';
        const profit = exec.type === 'SELL' ? (exec.profit || 0) : '-';
        const profitRate = exec.type === 'SELL' ? (exec.profitRate || '0.00%') : '-';
        const amount = exec.amount || 0;
        const shares = exec.shares || 0;
        const price = exec.price || 0;

        return [
            exec.date || 'N/A',
            typeText,
            price.toFixed(3),
            shares.toLocaleString(),
            amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            typeof profit === 'number' ? profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : profit,
            profitRate
        ];
        });

    const summary = calculateTradeDetailsSummary(executions);

    console.log("Trade details table data prepared:", { headers, rows, summary }); // 添加日志
    return { headers, rows, summary };
}

/**
 * 计算交易明细表格的合计数据
 * @param {Array} records - 交易记录数组
 * @returns {Object} 合计数据
 */
function calculateTradeDetailsSummary(records) {
    if (!records || records.length === 0) {
        return {
            totalTrades: 0,
            buyCount: 0,
            sellCount: 0,
            totalBuyShares: 0,
            totalSellShares: 0,
            totalBuyAmount: 0,
            totalSellAmount: 0,
            totalProfit: 0,
            overallYieldRate: '0.00%' // 返回字符串格式
        };
    }

    // 初始化计数器
    let buyCount = 0;
    let sellCount = 0;
    let totalBuyShares = 0;
    let totalSellShares = 0;
    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    let totalProfit = 0;

    // 计算各项合计
    records.forEach(record => {
        // 直接从 record 读取属性，而不是 record.rawData
        if (record.type === 'BUY') { 
            buyCount++;
            totalBuyShares += parseFloat(record.shares || 0);
            totalBuyAmount += parseFloat(record.amount || 0);
        } else if (record.type === 'SELL') { 
            sellCount++;
            totalSellShares += parseFloat(record.shares || 0);
            totalSellAmount += parseFloat(record.amount || 0);
            totalProfit += parseFloat(record.profit || 0);
        }
    });

    // 计算总收益率
    const overallYieldRateValue = totalBuyAmount > 0 ? (totalProfit / totalBuyAmount) * 100 : 0;
    const overallYieldRate = overallYieldRateValue.toFixed(2) + '%';

    // 计算剩余总股数
    const totalRemainingShares = totalBuyShares - totalSellShares;

    return {
        totalTrades: records.length,
        buyCount: buyCount,
        sellCount: sellCount,
        totalBuyShares: totalBuyShares, // 返回原始数值
        totalSellShares: totalSellShares, // 返回原始数值
        totalRemainingShares: totalRemainingShares, // 返回剩余股数
        totalBuyAmount: totalBuyAmount, // 保留数值用于渲染
        totalSellAmount: totalSellAmount, // 保留数值用于渲染
        totalProfit: totalProfit, // 保留数值用于渲染
        overallYieldRate: overallYieldRate // 返回字符串格式
    };
}

/**
 * 渲染交易明细表格
 * @param {Object} tableData - 包含表格数据和摘要信息的对象
 */
function renderTradeDetailsTable(tableData) {
    console.log('开始渲染交易明细表格', new Date().toISOString());
    const tableElement = document.getElementById('transactionTable');
    if (!tableElement) {
        console.error('找不到交易明细表格元素 (ID: transactionTable)');
            return;
        }

    // 获取合计数据，确保在函数开始就定义
    const summary = tableData.summary || {
        buyCount: 0,
        sellCount: 0,
        totalBuyShares: 0,
        totalSellShares: 0,
        totalBuyAmount: 0,
        totalSellAmount: 0,
        totalProfit: 0,
        overallYieldRate: '0.00%'
    };

        // 清空现有内容
    tableElement.innerHTML = '';

    // 创建并渲染表头
    const thead = tableElement.createTHead();
    const headerRow = thead.insertRow();
    tableData.headers.forEach((headerText, index) => {
            const th = document.createElement('th');
        // 调整表头样式：数值列右对齐
        if ([2, 3, 4, 5, 6].includes(index)) { // 价格、股数、金额、收益、收益率列右对齐
            th.className = 'py-3 px-4 text-right text-xs font-semibold text-slate-700 border-b bg-slate-50';
        } else {
            th.className = 'py-3 px-4 text-left text-xs font-semibold text-slate-700 border-b bg-slate-50';
        }
        th.textContent = headerText;
            headerRow.appendChild(th);
        });
        
    // 创建并渲染表体
    let tbody = tableElement.querySelector('tbody');
    if (!tbody) {
        tbody = tableElement.createTBody();
    } else {
        tbody.innerHTML = ''; // 清空现有 tbody 内容
    }

    if (tableData.rows.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = tableData.headers.length;
        cell.textContent = '暂无交易记录';
        cell.className = 'py-3 px-4 text-center text-sm text-slate-500';
    } else {
        tableData.rows.forEach(rowData => {
            const row = tbody.insertRow();
            rowData.forEach((cellData, index) => {
                const cell = row.insertCell();
                // 基础样式
                cell.className = 'py-2 px-4 text-sm text-slate-700 border-b'; 
                
                // 根据列索引添加对齐样式
                if ([2, 3, 4, 5, 6].includes(index)) { // 价格、股数、金额、收益、收益率列右对齐
                    cell.classList.add('text-right');
                } else {
                    cell.classList.add('text-left');
                }
                
                // 根据类型添加颜色
                if (index === 1) { // 类型列
                    cell.classList.add(cellData === '买入' ? 'text-red-600' : 'text-green-600');
                    cell.classList.add('font-medium');
                }
                
                // 给收益和收益率添加颜色
                if (index === 5 && typeof rowData[5] === 'string' && rowData[5] !== '-') { // 收益列
                    const profitValue = parseFloat(rowData[5].replace(/,/g, ''));
                    if (!isNaN(profitValue) && profitValue !== 0) {
                        cell.classList.add(profitValue > 0 ? 'text-green-600' : 'text-red-600');
                    }
                }
                if (index === 6 && typeof rowData[6] === 'string' && rowData[6] !== '-' && rowData[6] !== '0.00%') { // 收益率列
                    const profitRateValue = parseFloat(rowData[6].replace('%', ''));
                    if (!isNaN(profitRateValue) && profitRateValue !== 0) {
                        cell.classList.add(profitRateValue > 0 ? 'text-green-600' : 'text-red-600');
                        }
                    }

                cell.textContent = cellData;
        });
        });
    }
        
    // 创建并渲染表尾合计
    let tfoot = tableElement.querySelector('tfoot');
    if (!tfoot) {
        tfoot = tableElement.createTFoot();
    } else {
        tfoot.innerHTML = ''; // 清空现有 tfoot 内容
    }
    const footerRow = tfoot.insertRow();
    footerRow.className = 'bg-slate-50 font-semibold'; // 添加背景色和加粗

    // 第一列显示"合计"
    let cell = footerRow.insertCell();
    cell.colSpan = 1; // 只占第一列
    cell.textContent = '合计';
    cell.className = 'py-3 px-4 text-left text-sm text-slate-800';

    // 第二列 类型 - 显示 '-'
    cell = footerRow.insertCell();
    cell.className = 'py-3 px-4 text-left text-sm text-slate-800';
    cell.textContent = '-';

    // 第三列 价格 - 显示 '-'
    cell = footerRow.insertCell();
    cell.className = 'py-3 px-4 text-right text-sm text-slate-800';
    cell.textContent = '-';
            
    // 第四列 股数 - 两行显示
    cell = footerRow.insertCell();
    cell.className = 'py-3 px-4 text-right text-sm text-slate-800';
    const formattedBuyShares = summary.totalBuyShares.toLocaleString();
    const formattedSellShares = summary.totalSellShares.toLocaleString();
    const formattedRemainingShares = summary.totalRemainingShares.toLocaleString();
    cell.innerHTML = `${formattedBuyShares} / ${formattedSellShares}<br><span class="text-xs text-slate-500">(${formattedRemainingShares} 剩余)</span>`; // 使用innerHTML插入<br>

    // 第五列 金额 - 两行显示
    cell = footerRow.insertCell();
    cell.className = 'py-3 px-4 text-right text-sm text-slate-800';
    const formattedBuyAmount = summary.totalBuyAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const formattedSellAmount = summary.totalSellAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    cell.innerHTML = `买: ¥ ${formattedBuyAmount}<br>卖: ¥ ${formattedSellAmount}`; // 使用innerHTML插入<br>

    // 第六列 收益 - 总收益
    cell = footerRow.insertCell();
    cell.className = 'py-3 px-4 text-right text-sm text-slate-800';
    const formattedProfit = summary.totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    cell.textContent = `¥ ${formattedProfit}`;
    cell.classList.add(summary.totalProfit > 0 ? 'text-green-600' : summary.totalProfit < 0 ? 'text-red-600' : '');

    // 收益率列 - 整体收益率
    cell = footerRow.insertCell();
    cell.className = 'py-3 px-4 text-right text-sm text-slate-800';
    cell.textContent = summary.overallYieldRate;
    const profitRateValue = parseFloat(summary.overallYieldRate.replace('%',''));
    cell.classList.add(profitRateValue > 0 ? 'text-green-600' : profitRateValue < 0 ? 'text-red-600' : '');

    // 添加表格底部记录数显示，去掉更新时间
    const tableContainer = tableElement.closest('.overflow-x-auto');
    if (tableContainer) {
        // 删除现有的记录数显示（如果有）
        const existingFooter = tableContainer.nextElementSibling;
        if (existingFooter && existingFooter.classList.contains('text-right')) {
            existingFooter.remove();
        }
        
        // 创建新的记录数显示
        const recordCountElement = document.createElement('p');
        recordCountElement.className = 'text-right text-xs text-slate-500 mt-2';
        recordCountElement.textContent = `共 ${tableData.rows.length} 条交易记录`;
        tableContainer.parentNode.insertBefore(recordCountElement, tableContainer.nextSibling);
    }

    console.log("Transaction table rendered successfully.");
    console.log('交易明细表格渲染完成', new Date().toISOString());
}

/**
 * 准备网格策略参数数据
 * @param {Object} detailData - ETF详情数据
 * @returns {Object} 网格策略参数数据
 */
function prepareStrategyParams(detailData) {
    try {
        console.log('准备网格策略参数数据...');
        
        // 从etfData中获取基准价，如果没有则使用默认值1.000
        const defaultBasePrice = (etfData && etfData.basePrice !== null && etfData.basePrice !== undefined) ? 
            parseFloat(etfData.basePrice.toFixed(3)) : 1.000;
        
        // 计算最低价为基准价的一半，保留3位小数
        const defaultMinPrice = parseFloat((defaultBasePrice / 2).toFixed(3));
        
        console.log('从etfData中获取基准价:', defaultBasePrice, '最低价设为:', defaultMinPrice);
        
        // 默认参数
        const params = {
            targetType: '中国股票',
            minQuoteUnit: 0.001,           // 默认最小报价单位0.001
            minTradeUnit: 100,             // 默认最小交易单位100
            basePrice: defaultBasePrice,    // 基准价从etfData获取
            amountPerUnit: 10000,          // 每份金额，默认为10000
            minPrice: defaultMinPrice,      // 最低价，默认为基准价的一半，保留3位小数
            smallGridStep: 5.0,            // 小网步长，默认5.0%
            mediumGridStep: 15.0,          // 中网步长，默认15.0%
            largeGridStep: 30.0,           // 大网步长，默认30.0%
            levelBoostFactor: 1.0,         // 档位加码系数，默认1.0
            amountBoostFactor: 1.0,        // 金额加码系数，默认1.0
            profitRetentionFactor: 1.0     // 保留利润系数，默认1.0
        };
        
        // 如果有ETF数据，尝试从中获取参数
        if (detailData && detailData.tradeParams) {
            console.log('从ETF数据中获取参数:', detailData.tradeParams);
            
            // 尝试获取各项参数
            if (detailData.tradeParams.targetType) {
                params.targetType = detailData.tradeParams.targetType;
            }
            
            if (detailData.tradeParams.minQuoteUnit) {
                params.minQuoteUnit = parseFloat(detailData.tradeParams.minQuoteUnit);
            }
            
            if (detailData.tradeParams.minTradeUnit) {
                params.minTradeUnit = parseInt(detailData.tradeParams.minTradeUnit);
            }
            
            if (detailData.tradeParams.amountPerUnit) {
                params.amountPerUnit = parseFloat(detailData.tradeParams.amountPerUnit);
            }
            
            if (detailData.tradeParams.smallGridStep) {
                params.smallGridStep = parseFloat(detailData.tradeParams.smallGridStep);
            }
            
            if (detailData.tradeParams.mediumGridStep) {
                params.mediumGridStep = parseFloat(detailData.tradeParams.mediumGridStep);
            }
            
            if (detailData.tradeParams.largeGridStep) {
                params.largeGridStep = parseFloat(detailData.tradeParams.largeGridStep);
            }
            
            if (detailData.tradeParams.levelBoostFactor) {
                params.levelBoostFactor = parseFloat(detailData.tradeParams.levelBoostFactor);
            }
            
            if (detailData.tradeParams.amountBoostFactor) {
                params.amountBoostFactor = parseFloat(detailData.tradeParams.amountBoostFactor);
            }
            
            if (detailData.tradeParams.profitRetentionFactor) {
                params.profitRetentionFactor = parseFloat(detailData.tradeParams.profitRetentionFactor);
            }
        }
        
        // 尝试从交易执行记录中提取基准价和档位
        if (detailData && Array.isArray(detailData.executions) && detailData.executions.length > 0) {
            console.log('从交易执行记录中提取基准价和档位...');
            
            // 按日期降序排序交易记录，获取最新记录
            const sortedExecutions = [...detailData.executions].sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });
            
            // 获取所有买入价格
            const buyPrices = sortedExecutions
                .filter(ex => ex.type === 'buy')
                .map(ex => ex.price);
            
            // 如果有买入记录，计算平均价格作为基准
            if (buyPrices.length > 0) {
                // 计算平均价格
                const sum = buyPrices.reduce((acc, price) => acc + price, 0);
                const avgPrice = sum / buyPrices.length;
                
                // 更新基准价为平均价格，并四舍五入到3位小数
                params.basePrice = parseFloat(avgPrice.toFixed(3));
                
                // 设置最低价为平均价格的一半，并同样保留3位小数
                params.minPrice = parseFloat((avgPrice / 2).toFixed(3));
            }
        }
        
        console.log('网格策略参数数据准备完成:', params);
        return params;
    } catch (error) {
        console.error('准备网格策略参数数据失败:', error);
        return {
            targetType: '中国股票',
            minQuoteUnit: 0.001,
            minTradeUnit: 100,
            basePrice: 1.000,
            amountPerUnit: 10000,
            minPrice: 0.500,
            smallGridStep: 5.0,
            mediumGridStep: 15.0,
            largeGridStep: 30.0,
            levelBoostFactor: 1.0,
            amountBoostFactor: 1.0,
            profitRetentionFactor: 1.0
        };
    }
}

/**
 * 渲染网格策略参数到表单中
 * @param {Object} params - 网格策略参数
 */
function renderStrategyParams(params) {
    // 设置目标类型
    const targetTypeInput = document.getElementById('targetType');
    if (targetTypeInput) {
        targetTypeInput.value = params.targetType;
        }
        
        // 设置最小报价单位
        const minQuoteUnitInput = document.getElementById('minQuoteUnit');
        if (minQuoteUnitInput) {
            minQuoteUnitInput.value = params.minQuoteUnit.toFixed(3);
        }
        
        // 设置最小交易单位
        const minTradeUnitInput = document.getElementById('minTradeUnit');
        if (minTradeUnitInput) {
        minTradeUnitInput.value = params.minTradeUnit;
        }
        
    // 设置基准价 - 确保保留3位小数
        const basePriceInput = document.getElementById('basePrice');
        if (basePriceInput) {
        basePriceInput.value = params.basePrice.toFixed(3);
        }
        
        // 设置每份金额
        const unitAmountInput = document.getElementById('unitAmount');
        if (unitAmountInput) {
        unitAmountInput.value = params.amountPerUnit;
        }
        
    // 设置最低价 - 保留用户输入的值，不再强制为基准价的一半
        const minPriceInput = document.getElementById('minPrice');
        if (minPriceInput) {
        // 确保最低价有值且合理
        if (!params.minPrice || params.minPrice <= 0) {
            params.minPrice = parseFloat((params.basePrice / 2).toFixed(3));
        }
        minPriceInput.value = params.minPrice.toFixed(3);
        }
        
        // 设置小网步长
        const smallGridStepInput = document.getElementById('smallGridStep');
        if (smallGridStepInput) {
            smallGridStepInput.value = params.smallGridStep.toFixed(1);
        }
        
        // 设置中网步长
        const mediumGridStepInput = document.getElementById('mediumGridStep');
        if (mediumGridStepInput) {
            mediumGridStepInput.value = params.mediumGridStep.toFixed(1);
        }
        
        // 设置大网步长
        const largeGridStepInput = document.getElementById('largeGridStep');
        if (largeGridStepInput) {
            largeGridStepInput.value = params.largeGridStep.toFixed(1);
        }
        
    // 设置档位加码系数
    const levelCoeffInput = document.getElementById('levelCoeff');
    if (levelCoeffInput) {
        levelCoeffInput.value = params.levelBoostFactor.toFixed(1);
    }

    // 设置金额加码系数
    const amountCoeffInput = document.getElementById('amountCoeff');
    if (amountCoeffInput) {
        amountCoeffInput.value = params.amountBoostFactor.toFixed(1);
    }

    // 设置保留利润系数
    const profitCoeffInput = document.getElementById('profitCoeff');
    if (profitCoeffInput) {
        profitCoeffInput.value = params.profitRetentionFactor.toFixed(1);
    }
    
    // 移除所有关于基准价和最低价的关联事件监听器，确保最低价不会随基准价变化
    if (basePriceInput) {
        // 如果有旧的事件监听器，移除它
        if (basePriceInput._changeHandler) {
            basePriceInput.removeEventListener('change', basePriceInput._changeHandler);
            basePriceInput._changeHandler = null;
        }
    }
}

/**
 * 计算网格档位表格数据
 * @param {Object} strategyParams - 网格策略参数
 * @param {Array} tradeHistory - 交易历史记录
 * @returns {Object} 计算后的网格档位表格数据
 */
function calculateGridLevels(strategyParams, tradeHistory) {
    try {
        console.log('开始计算网格档位表格数据...');
        console.log('参数:', strategyParams);
        
        // 如果参数为空，使用默认参数
        if (!strategyParams) {
            console.error('策略参数为空，使用默认参数');
            strategyParams = {
                targetType: "中国股票",
                minQuoteUnit: 0.001,
                minTradeUnit: 100,
                basePrice: 1.0,
                amountPerUnit: 10000,
                minPrice: 0.5, // 默认最低价为0.5
                smallGridStep: 5.0,
                mediumGridStep: 15.0,
                largeGridStep: 30.0,
                levelBoostFactor: 1.0,
                amountBoostFactor: 1.0,
                profitRetentionFactor: 1.0
            };
        }
        
        // 保留用户输入的最低价值，不自动计算
        // 如果minPrice是NaN，或者为非正数，才使用basePrice的一半作为默认值
        if (isNaN(strategyParams.minPrice) || strategyParams.minPrice <= 0) {
            console.log('最低价无效，设置为基准价的一半');
            strategyParams.minPrice = strategyParams.basePrice / 2;
        }
        
        console.log('使用的基准价:', strategyParams.basePrice, '最低价:', strategyParams.minPrice);
        
        // 结果对象，包含网格档位数据和统计信息
        const result = {
            gridLevels: [],
            summary: {
                totalBuyAmount: 0,         // 总买入金额
                totalBuyQuantity: 0,       // 总买入股数
                totalSellAmount: 0,        // 总卖出金额
                totalSellQuantity: 0,      // 总卖出股数
                totalRemainingShares: 0,   // 总剩余股数
                profit: 0,                 // 总利润
                profitRate: 0              // 总利润率
            }
        };
        
        // 提取基本参数
        const basePrice = parseFloat(strategyParams.basePrice);
        const amountPerUnit = parseFloat(strategyParams.amountPerUnit);
        const minPrice = parseFloat(strategyParams.minPrice);
        const smallGridStep = parseFloat(strategyParams.smallGridStep) / 100; // 将百分比转为小数
        const mediumGridStep = parseFloat(strategyParams.mediumGridStep) / 100;
        const largeGridStep = parseFloat(strategyParams.largeGridStep) / 100;
        const levelBoostFactor = parseFloat(strategyParams.levelBoostFactor);
        const amountBoostFactor = parseFloat(strategyParams.amountBoostFactor);
        const profitRetentionFactor = parseFloat(strategyParams.profitRetentionFactor);
        const minQuoteUnit = parseFloat(strategyParams.minQuoteUnit);
        const minTradeUnit = parseFloat(strategyParams.minTradeUnit);
        
        // 验证参数有效性
        if (isNaN(basePrice) || isNaN(amountPerUnit) || isNaN(minPrice) ||
            isNaN(smallGridStep) || isNaN(mediumGridStep) || isNaN(largeGridStep) ||
            isNaN(levelBoostFactor) || isNaN(amountBoostFactor) || isNaN(profitRetentionFactor) ||
            isNaN(minQuoteUnit) || isNaN(minTradeUnit)) {
            console.error('无效的策略参数');
            return result;
        }
        
        // 验证参数范围
        if (basePrice <= 0 || amountPerUnit <= 0 || minPrice <= 0 ||
            smallGridStep <= 0 || mediumGridStep <= 0 || largeGridStep <= 0 ||
            levelBoostFactor <= 0 || amountBoostFactor <= 0 || minTradeUnit <= 0) {
            console.error('策略参数范围无效');
            return result;
        }
        
        // 参数合理性检查
        if (minPrice >= basePrice) {
            console.error('最低价不能大于或等于基准价');
            return result;
        }
        
        // 辅助函数：保留指定小数位数
        const roundToFixed = (value, decimals) => {
            return parseFloat(value.toFixed(decimals));
        };

        // 各网格类型的边界设置
        // 移除固定边界限制，改为使用步长计算档位
        const minGridLevel = minPrice / basePrice; // 最低档位
        
        // 计算小网格的档位 - 基于计算原理生成档位
        const generateSmallGridLevels = () => {
            const levels = new Set(); // 使用Set避免重复档位
            
            // 添加基准位1.0
            levels.add(1.0);
            
            // 计算后续小网档位
            let currentLevel = 1.0;
            let levelIndex = 2; // 从第2档开始
            let accumulatedLevelCoeff = 0; // 累计加码系数
            
            while (true) {
                // 正常步长递减
                let nextLevelValue = currentLevel - smallGridStep;
                
                // 应用累加加码系数（如果配置了加码）
                if (levelBoostFactor > 0 && levelIndex >= 3) {
                    // 累加加码系数：从第3档开始加码
                    accumulatedLevelCoeff += levelBoostFactor / 100;
                    // 额外递减累计加码值
                    nextLevelValue -= accumulatedLevelCoeff;
                }
                
                // 舍入到最小报价单位
                nextLevelValue = roundToFixed(nextLevelValue, 4);
                
                // 如果低于最低价，则不再添加此档位
                if (nextLevelValue * basePrice < minPrice) break;
                
                levels.add(nextLevelValue);
                currentLevel = nextLevelValue;
                levelIndex++;
            }
            
            // 排序档位，从高到低
            return Array.from(levels).sort((a, b) => b - a);
        };
        
        // 计算中网格的档位 - 基于计算原理生成档位
        const generateMediumGridLevels = () => {
            const levels = new Set(); // 使用Set避免重复档位
            
            // 中网第一档固定为1.0 - mediumGridStep
            let currentLevel = roundToFixed(1.0 - mediumGridStep, 4);
            
            // 如果第一档位低于最低价，则不生成中网档位
            if (currentLevel * basePrice < minPrice) {
                return [];
            }
            
            // 添加第一个档位
            levels.add(currentLevel);
            
            // 从第2档开始应用加码
            let levelIndex = 2;
            let accumulatedLevelCoeff = 0; // 累计加码系数
            
            while (true) {
                // 正常步长递减
                let nextLevelValue = currentLevel - mediumGridStep;
                
                // 中网加码从第2档开始，加码系数是小网的2倍
                if (levelBoostFactor > 0 && levelIndex >= 2) {
                    // 累加中网加码系数（小网的2倍）
                    accumulatedLevelCoeff += (levelBoostFactor * 2) / 100;
                    // 额外递减累计加码值
                    nextLevelValue -= accumulatedLevelCoeff;
                }
                
                // 舍入到最小报价单位
                nextLevelValue = roundToFixed(nextLevelValue, 4);
                
                // 如果低于最低价，则不再添加此档位
                if (nextLevelValue * basePrice < minPrice) break;
                
                levels.add(nextLevelValue);
                currentLevel = nextLevelValue;
                levelIndex++;
            }
            
            // 排序档位，从高到低
            return Array.from(levels).sort((a, b) => b - a);
        };
        
        // 计算大网格的档位 - 基于计算原理生成档位
        const generateLargeGridLevels = () => {
            const levels = new Set(); // 使用Set避免重复档位
            
            // 大网第一档固定为1.0 - largeGridStep
            let currentLevel = roundToFixed(1.0 - largeGridStep, 4);
            
            // 如果第一档位低于最低价，则不生成大网档位
            if (currentLevel * basePrice < minPrice) {
                return [];
            }
            
            // 添加第一个档位
            levels.add(currentLevel);
            
            // 从第2档开始应用加码
            let levelIndex = 2;
            let accumulatedLevelCoeff = 0; // 累计加码系数
            
            while (true) {
                // 正常步长递减
                let nextLevelValue = currentLevel - largeGridStep;
                
                // 大网加码从第2档开始，加码系数是小网的3倍
                if (levelBoostFactor > 0 && levelIndex >= 2) {
                    // 累加大网加码系数（小网的3倍）
                    accumulatedLevelCoeff += (levelBoostFactor * 3) / 100;
                    // 额外递减累计加码值
                    nextLevelValue -= accumulatedLevelCoeff;
                }
                
                // 舍入到最小报价单位
                nextLevelValue = roundToFixed(nextLevelValue, 4);
                
                // 如果低于最低价，则不再添加此档位
                if (nextLevelValue * basePrice < minPrice) break;
                
                levels.add(nextLevelValue);
                currentLevel = nextLevelValue;
                levelIndex++;
            }
            
            // 排序档位，从高到低
            return Array.from(levels).sort((a, b) => b - a);
        };
        
        // 辅助函数：根据档位计算买入和卖出价格 - 保持原有逻辑
        const calculatePrices = (level, type) => {
            // 买入价 = 档位 × 基准价
            const buyPrice = roundToFixed(level * basePrice, 3);
            
            let sellPrice, profitRate;
            
            if (type === "小网") {
                // 小网卖出价 = 买入价 * (1 + 小网步长)
                sellPrice = roundToFixed(buyPrice * (1 + smallGridStep), 3);
                profitRate = smallGridStep * 100;
            } else if (type === "中网") {
                // 中网卖出价通常回到基准价或接近基准价
                sellPrice = roundToFixed(Math.max(buyPrice * (1 + mediumGridStep/2), basePrice), 3);
                profitRate = ((sellPrice / buyPrice) - 1) * 100;
            } else { // 大网
                // 大网卖出价通常回到基准价
                sellPrice = roundToFixed(basePrice, 3);
                profitRate = ((sellPrice / buyPrice) - 1) * 100;
            }
            
            // 买入触发价略高于买入价
            const buyTriggerPrice = roundToFixed(buyPrice * 1.005, 3);
            
            // 卖出触发价略低于卖出价
            const sellTriggerPrice = roundToFixed(sellPrice * 0.995, 3);
            
            return {
                buyPrice,
                sellPrice,
                buyTriggerPrice,
                sellTriggerPrice,
                profitRate
            };
        };
        
        // 辅助函数：计算买入金额和数量 - 保持原有逻辑
        const calculateAmounts = (level, buyPrice, type) => {
            // 基础金额
            let buyAmount = amountPerUnit;
            
            // 根据档位应用加码
            if (level < 1.0) {
                // 计算加码系数：档位越低，加码越多
                const discount = 1.0 - level;
                const boostMultiplier = 1.0 + (discount * levelBoostFactor * amountBoostFactor);
                buyAmount = roundToFixed(buyAmount * boostMultiplier, 0);
            }
            
            // 根据网格类型可能有额外加码
            if (type === "中网") {
                buyAmount = roundToFixed(buyAmount * 1.1, 0); // 中网加码10%
            } else if (type === "大网") {
                buyAmount = roundToFixed(buyAmount * 1.2, 0); // 大网加码20%
            }
            
            // 计算买入股数，向上取整到最小交易单位的倍数
            const rawBuyQuantity = buyAmount / buyPrice;
            const buyQuantity = Math.ceil(rawBuyQuantity / minTradeUnit) * minTradeUnit;
            
            // 重新计算实际买入金额
            const actualBuyAmount = roundToFixed(buyQuantity * buyPrice, 0);
            
            return {
                buyAmount: actualBuyAmount,
                buyQuantity
            };
        };
        
        // 辅助函数：计算卖出数量和金额 - 保持原有逻辑
        const calculateSellQuantityAndAmount = (buyQuantity, sellPrice, profitRate) => {
            // 根据盈利目标和买入数量计算卖出数量
            // 保留部分股票作为利润，剩余部分卖出
            let retentionRatio = profitRetentionFactor * (profitRate / 100);
            
            // 限制最大保留比例
            retentionRatio = Math.min(retentionRatio, 0.2); // 最多保留20%
            
            // 计算卖出股数，向下取整到最小交易单位的倍数
            const sellQuantity = Math.floor((buyQuantity * (1 - retentionRatio)) / minTradeUnit) * minTradeUnit;
            
            // 计算卖出金额
            const sellAmount = roundToFixed(sellQuantity * sellPrice, 0);
            
            return {
                sellQuantity,
                sellAmount,
                retainedQuantity: buyQuantity - sellQuantity
            };
        };
        
        // 生成各类型网格的档位
        const smallGridLevels = generateSmallGridLevels();
        const mediumGridLevels = generateMediumGridLevels();
        const largeGridLevels = generateLargeGridLevels();
        
        console.log('生成的小网档位:', smallGridLevels);
        console.log('生成的中网档位:', mediumGridLevels);
        console.log('生成的大网档位:', largeGridLevels);
        
        // 合并并去重所有档位
        const combinedLevels = [];
        const levelSet = new Set(); // 用于存储已处理的档位值
        
        // 先处理小网档位（优先级最高）
        smallGridLevels.forEach(level => {
            if(!levelSet.has(level)) {
                levelSet.add(level);
                combinedLevels.push({
                    type: "小网",
                    level: level
                });
            }
        });
        
        // 处理中网档位（中优先级）
        mediumGridLevels.forEach(level => {
            if(!levelSet.has(level)) {
                levelSet.add(level);
                combinedLevels.push({
                    type: "中网",
                    level: level
                });
            }
        });
        
        // 处理大网档位（低优先级）
        largeGridLevels.forEach(level => {
            if(!levelSet.has(level)) {
                levelSet.add(level);
                combinedLevels.push({
                    type: "大网",
                    level: level
                });
            }
        });
        
        console.log('合并后的档位:', combinedLevels);
        
        // 按级别从高到低排序
        combinedLevels.sort((a, b) => b.level - a.level);
        
        console.log('排序后的档位:', combinedLevels);
        
        // 处理网格档位，计算买入卖出价格等详细数据
        combinedLevels.forEach(gridLevel => {
            try {
                const { level, type } = gridLevel;
                
                // 验证数据有效性
                if (!level || !type) {
                    console.error('无效的网格档位数据:', gridLevel);
                    return; // 跳过此条数据
                }
                
                // 计算各项值
                const { buyPrice, sellPrice, buyTriggerPrice, sellTriggerPrice, profitRate } = calculatePrices(level, type);
                const { buyAmount, buyQuantity } = calculateAmounts(level, buyPrice, type);
                const { sellQuantity, sellAmount, retainedQuantity } = calculateSellQuantityAndAmount(buyQuantity, sellPrice, profitRate);
                
                // 添加到结果中
                result.gridLevels.push({
                    type: type,
                    level: roundToFixed(level, 2),
                    buyTriggerPrice,
                    buyPrice,
                    buyAmount,
                    buyQuantity,
                    sellTriggerPrice,
                    sellPrice,
                    sellQuantity,
                    sellAmount,
                    retainedQuantity,
                    profit: roundToFixed(sellAmount - buyAmount, 0),
                    profitRate: roundToFixed(profitRate, 2)
                });
                
                // 更新统计信息
                result.summary.totalBuyAmount += buyAmount;
                result.summary.totalBuyQuantity += buyQuantity;
                result.summary.totalSellAmount += sellAmount;
                result.summary.totalSellQuantity += sellQuantity;
                result.summary.totalRemainingShares += retainedQuantity;
            } catch (error) {
                console.error('处理网格档位数据时出错:', error, gridLevel);
                // 继续处理其他档位
            }
        });
        
        // 计算总利润和利润率
        result.summary.profit = roundToFixed(result.summary.totalSellAmount - result.summary.totalBuyAmount, 0);
        result.summary.profitRate = roundToFixed((result.summary.profit / result.summary.totalBuyAmount) * 100, 2);
        
        console.log('网格档位表格数据计算完成:', result);
        return result;
    } catch (error) {
        console.error('计算网格档位表格数据失败:', error);
        return {
            gridLevels: [],
            summary: {
                totalBuyAmount: 0,
                totalBuyQuantity: 0,
                totalSellAmount: 0,
                totalSellQuantity: 0,
                totalRemainingShares: 0,
                profit: 0,
                profitRate: 0
            }
        };
    }
}

/**
 * 渲染网格档位表格
 * @param {Object} gridLevelsData - 网格档位表格数据
 */
function renderGridLevelsTable(gridLevelsData) {
    const tableBody = document.querySelector('#gridTable tbody');
    if (!tableBody) return;
    
    // 清空表格
            tableBody.innerHTML = '';
    
    // 渲染每一行数据
    gridLevelsData.gridLevels.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.className = `border-t border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`;
        
        tr.innerHTML = `
            <td class="py-3 px-4 text-sm text-slate-700">${row.type}</td>
            <td class="py-3 px-4 text-sm text-slate-700">${row.level.toFixed(2)}</td>
            <td class="py-3 px-4 text-sm text-slate-700">${row.buyTriggerPrice.toFixed(3)}</td>
            <td class="py-3 px-4 text-sm text-slate-700">${row.buyPrice.toFixed(3)}</td>
            <td class="py-3 px-4 text-sm text-slate-700">¥${row.buyAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
            <td class="py-3 px-4 text-sm text-slate-700">${row.buyQuantity.toLocaleString()}</td>
            <td class="py-3 px-4 text-sm text-slate-700">${row.sellTriggerPrice.toFixed(3)}</td>
            <td class="py-3 px-4 text-sm text-slate-700">${row.sellPrice.toFixed(3)}</td>
            <td class="py-3 px-4 text-sm text-slate-700">${row.sellQuantity.toLocaleString()}</td>
            <td class="py-3 px-4 text-sm text-slate-700">¥${row.sellAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
            <td class="py-3 px-4 text-sm ${row.profit >= 0 ? 'text-emerald-600' : 'text-red-600'} font-medium">¥${row.profit.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
            <td class="py-3 px-4 text-sm ${row.profitRate >= 0 ? 'text-emerald-600' : 'text-red-600'} font-medium">${row.profitRate.toFixed(2)}%</td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // 添加表格底部记录数显示，去掉更新时间
    const existingInfo = document.querySelector('#grid-tab .text-xs.text-slate-500.mt-4');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    // 更新汇总信息
    updateSummaryInfo(gridLevelsData.summary);
}

/**
 * 更新汇总信息区域
 * @param {Object} summary - 网格档位计算的汇总数据
 */
function updateSummaryInfo(summary) {
    try {
        // 更新买入金额
        const totalBuyAmountElement = document.getElementById('totalBuyAmount');
        if (totalBuyAmountElement) {
            totalBuyAmountElement.textContent = `¥ ${summary.totalBuyAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        }

        // 更新买入股数
        const totalBuyQuantityElement = document.getElementById('totalBuyQuantity');
        if (totalBuyQuantityElement) {
            totalBuyQuantityElement.textContent = summary.totalBuyQuantity.toLocaleString();
        }

        // 更新卖出金额
        const totalSellAmountElement = document.getElementById('totalSellAmount');
        if (totalSellAmountElement) {
            totalSellAmountElement.textContent = `¥ ${summary.totalSellAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        }

        // 更新卖出股数
        const totalSellQuantityElement = document.getElementById('totalSellQuantity');
        if (totalSellQuantityElement) {
            totalSellQuantityElement.textContent = summary.totalSellQuantity.toLocaleString();
        }

        // 更新剩余股数
        const totalSharesElement = document.getElementById('totalShares');
        if (totalSharesElement) {
            totalSharesElement.textContent = summary.totalRemainingShares.toLocaleString();
        }

        // 更新利润
        const profitElement = document.getElementById('profit');
        if (profitElement) {
            profitElement.textContent = `¥ ${summary.profit.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
            profitElement.classList.toggle('text-emerald-600', summary.profit >= 0);
            profitElement.classList.toggle('text-red-600', summary.profit < 0);
        }

        // 更新利润率
        const profitRateElement = document.getElementById('profitRate');
        if (profitRateElement) {
            profitRateElement.textContent = `${summary.profitRate.toFixed(2)}%`;
            profitRateElement.classList.toggle('text-emerald-600', summary.profitRate >= 0);
            profitRateElement.classList.toggle('text-red-600', summary.profitRate < 0);
            // 更新旁边的趋势图标
            const trendIcon = profitRateElement.querySelector('i[data-lucide]');
            if (trendIcon) {
                trendIcon.setAttribute('data-lucide', summary.profitRate >= 0 ? 'trending-up' : 'trending-down');
                trendIcon.classList.toggle('text-emerald-500', summary.profitRate >= 0);
                trendIcon.classList.toggle('text-red-500', summary.profitRate < 0);
            }
        }
        
        // 重新初始化可能被影响的 Lucide 图标
        if (window.lucide) {
            lucide.createIcons();
        }

        console.log('汇总信息区域更新完成');
    } catch (error) {
        console.error('更新汇总信息区域失败:', error);
    }
}

/**
 * 设置时间范围切换按钮
 */
function setupTimeRangeButtons() {
    // 查找时间范围按钮
    const timeRangeButtons = document.querySelectorAll('.header-gradient .flex.space-x-2 button');
    
    if (!timeRangeButtons || timeRangeButtons.length === 0) {
        console.error('未找到时间范围按钮');
        return;
    }
    
    console.log('找到时间范围按钮:', timeRangeButtons.length, '个');
    
    // 更新按钮文本为新的时间范围
    if (timeRangeButtons.length >= 4) {
        timeRangeButtons[0].textContent = '3月';
        timeRangeButtons[1].textContent = '6月';
        timeRangeButtons[2].textContent = '1年';
        timeRangeButtons[3].textContent = '全部';
    }
    
    // 为每个按钮添加点击事件
    timeRangeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const rangeText = this.textContent.trim();
            
            // 更新活跃按钮样式
            timeRangeButtons.forEach(btn => {
                btn.classList.remove('bg-white', 'text-indigo-700', 'font-medium');
                btn.classList.add('bg-white/20', 'hover:bg-white/30', 'text-white');
            });
            
            this.classList.remove('bg-white/20', 'hover:bg-white/30', 'text-white');
            this.classList.add('bg-white', 'text-indigo-700', 'font-medium');
            
            // 更新图表时间范围
            updateChartTimeRange(rangeText);
        });
    });
    
    // 设置默认活跃按钮（全部）
    const allButton = Array.from(timeRangeButtons).find(btn => btn.textContent.trim() === '全部');
    if (allButton) {
        allButton.classList.remove('bg-white/20', 'hover:bg-white/30', 'text-white');
        allButton.classList.add('bg-white', 'text-indigo-700', 'font-medium');
    }
}

/**
 * 更新图表的时间范围
 * @param {string} rangeText - 时间范围文本（3月、6月、1年、全部）
 */
function updateChartTimeRange(rangeText) {
    if (!window.originalChartData || !trendChartInstance) {
        console.error('无法获取原始图表数据或图表实例');
        return;
    }
    
    // 如果选择了全部范围，直接使用原始数据
    if (rangeText === '全部') {
        updateChartWithFilteredData(window.originalChartData);
        return;
    }

    // 获取数据中的最新日期作为参考点
    const dates = window.originalChartData.dates;
    if (!dates || dates.length === 0) {
        console.error('无有效的日期数据');
        return;
    }
    
    // 将所有日期转换为时间戳并排序
    const dateTimestamps = dates.map(d => new Date(d).getTime()).filter(ts => !isNaN(ts));
    if (dateTimestamps.length === 0) {
        console.error('无有效的日期时间戳');
        return;
    }
    dateTimestamps.sort((a, b) => b - a); // 降序排序，最新的日期在前
    
    // 使用最新的有效日期作为结束日期
    const endDate = new Date(dateTimestamps[0]);
    console.log('最新数据日期:', endDate.toISOString());
    
    // 计算开始日期
    const startDate = new Date(endDate);
    switch (rangeText) {
        case '3月':
            startDate.setMonth(endDate.getMonth() - 3);
            break;
        case '6月':
            startDate.setMonth(endDate.getMonth() - 6);
            break;
        case '1年':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        default:
            console.error('未知的时间范围:', rangeText);
            return;
    }
    
    // 确保开始日期不会早于最早的数据点
    const earliestDate = new Date(Math.min(...dateTimestamps));
    if (startDate < earliestDate) {
        console.log('调整开始日期到最早的数据点:', earliestDate.toISOString());
        startDate.setTime(earliestDate.getTime());
    }
    
    console.log(`${rangeText}时间范围: 从 ${startDate.toISOString()} 到 ${endDate.toISOString()}`);
    
    // 过滤数据，保留时间范围内的数据
    const filteredData = filterChartDataByDate(window.originalChartData, startDate.getTime(), endDate.getTime());
    
    // 记录数据点数量并更新图表
    const dataPointCount = filteredData.dates?.length || 0;
    console.log(`过滤后数据点数量: ${dataPointCount}`);
    
    // 更新图表
    if (dataPointCount > 0) {
        updateChartWithFilteredData(filteredData);
        
        // 移除这里设置固定范围的代码，让图表自适应显示
        // trendChartInstance.options.scales.x.min = startDate;
        // trendChartInstance.options.scales.x.max = endDate;
    } else {
        console.warn('过滤后没有数据点，使用原始数据');
        updateChartWithFilteredData(window.originalChartData);
    }
}

/**
 * 按日期过滤图表数据
 * @param {Object} originalData - 原始图表数据
 * @param {number} startTime - 起始时间戳
 * @param {number} endTime - 结束时间戳
 * @returns {Object} 过滤后的图表数据
 */
function filterChartDataByDate(originalData, startTime, endTime) {
    const result = {
        dates: [],
        values: [],
        buyPoints: [],
        sellPoints: [],
        metadata: originalData.metadata
    };
    
    // 过滤日期和价格
    originalData.dates.forEach((date, index) => {
        const dateTime = new Date(date).getTime();
        if (dateTime >= startTime && dateTime <= endTime) {
            result.dates.push(date);
            result.values.push(originalData.values[index]);
        }
    });
    
    // 确保日期和值是按时间顺序排序的
    const sortedIndices = result.dates
        .map((date, index) => ({ date: new Date(date).getTime(), index }))
        .sort((a, b) => a.date - b.date)
        .map(item => item.index);
    
    result.dates = sortedIndices.map(i => result.dates[i]);
    result.values = sortedIndices.map(i => result.values[i]);
    
    // 创建一个原始买入点索引到新买入点索引的映射
    const buyIndexMap = new Map();
    
    // 过滤并排序买入点
    result.buyPoints = originalData.buyPoints
        .filter(point => {
            const pointTime = new Date(point.date).getTime();
            return pointTime >= startTime && pointTime <= endTime;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 为过滤后的买入点创建索引映射
    result.buyPoints.forEach((point, newIndex) => {
        buyIndexMap.set(point.index, newIndex);
    });
    
    // 过滤并排序卖出点，同时更新关联的买入点索引
    result.sellPoints = originalData.sellPoints
        .filter(point => {
            const pointTime = new Date(point.date).getTime();
            return pointTime >= startTime && pointTime <= endTime;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(point => {
            // 创建点的副本，避免修改原始数据
            const newPoint = {...point};
            
            // 更新关联的买入点索引
            if (newPoint.relatedBuyIndex !== null && buyIndexMap.has(newPoint.relatedBuyIndex)) {
                newPoint.relatedBuyIndex = buyIndexMap.get(newPoint.relatedBuyIndex);
            } else {
                // 如果关联的买入点不在当前过滤范围内，标记为null
                newPoint.relatedBuyIndex = null;
            }
            
            return newPoint;
        });
    
    return result;
}

/**
 * 使用过滤后的数据更新图表
 * @param {Object} filteredData - 过滤后的图表数据
 */
function updateChartWithFilteredData(filteredData) {
    try {
        if (!trendChartInstance) {
            console.error('图表实例不存在，无法更新');
            return;
        }
        
        if (!filteredData || !filteredData.dates || filteredData.dates.length === 0) {
            console.error('过滤后数据无效');
            return;
        }
        
        console.log('图表时间范围已更新，数据点数量:', filteredData.dates.length);
        
        // 保存当前数据集的样式和配置
        const currentDatasets = trendChartInstance.data.datasets;
        const styleConfig = {};
        
        currentDatasets.forEach(dataset => {
            if (dataset.label) {
                // 保存重要样式属性
                styleConfig[dataset.label] = {
                    borderColor: dataset.borderColor,
                    backgroundColor: dataset.backgroundColor,
                    pointStyle: dataset.pointStyle,
                    pointRadius: dataset.pointRadius,
                    pointHoverRadius: dataset.pointHoverRadius,
                    order: dataset.order,
                    z: dataset.z,
                    hidden: dataset.hidden
                };
            }
        });
        
        // 准备新的数据集
        const newDatasets = [];
        
        // 价格线数据集
        newDatasets.push({
            label: 'ETF净值',
            data: filteredData.values.map((value, index) => ({ 
                x: filteredData.dates[index], 
                y: value 
            })),
            borderColor: styleConfig['ETF净值']?.borderColor || 'rgba(99, 102, 241, 0.8)',
            backgroundColor: styleConfig['ETF净值']?.backgroundColor || 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            order: styleConfig['ETF净值']?.order || 5 // 确保ETF净值显示在最底层
        });
        
        // 如果有配对线数据集，更新它
        const pairLinesDataset = {
            label: '交易配对',
            data: [], // 配对线数据会在交互时动态生成
            borderColor: styleConfig['交易配对']?.borderColor || 'rgba(107, 114, 128, 0.7)',
            backgroundColor: styleConfig['交易配对']?.backgroundColor || 'rgba(107, 114, 128, 0)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            tension: 0,
            hidden: styleConfig['交易配对']?.hidden !== undefined ? styleConfig['交易配对'].hidden : true,
            order: styleConfig['交易配对']?.order || 2
        };
        newDatasets.push(pairLinesDataset);
        
        // 买入点数据集
        if (filteredData.buyPoints && filteredData.buyPoints.length > 0) {
            const buyPointsDataset = {
                label: '买入',
                data: filteredData.buyPoints.map((point, index) => ({ 
                    x: point.date, 
                    y: point.price,
                    shares: point.shares,
                    amount: point.amount,
                    // 确保使用新的索引
                    index: index,
                    originalIndex: point.index, // 保留原始索引以供参考
                    type: 'buy'
                })),
                backgroundColor: styleConfig['买入']?.backgroundColor || 'rgba(16, 185, 129, 0.8)',
                borderColor: styleConfig['买入']?.borderColor || 'rgba(16, 185, 129, 1)',
                borderWidth: 1.5,
                pointRadius: styleConfig['买入']?.pointRadius || 12,
                pointHoverRadius: styleConfig['买入']?.pointHoverRadius || 14,
                showLine: false,
                pointStyle: styleConfig['买入']?.pointStyle, // 使用保存的样式函数
                order: styleConfig['买入']?.order || 1,
                z: styleConfig['买入']?.z || 10
            };
            newDatasets.push(buyPointsDataset);
        }
        
        // 卖出点数据集
        if (filteredData.sellPoints && filteredData.sellPoints.length > 0) {
            const sellPointsDataset = {
                label: '卖出',
                data: filteredData.sellPoints.map((point, index) => ({ 
                    x: point.date, 
                    y: point.price,
                    shares: point.shares,
                    amount: point.amount,
                    profit: point.profit,
                    profitRate: point.profitRate,
                    // 使用更新后的关联买入点索引
                    relatedBuyIndex: point.relatedBuyIndex,
                    index: index,
                    originalIndex: point.index, // 保留原始索引以供参考
                    type: 'sell'
                })),
                backgroundColor: styleConfig['卖出']?.backgroundColor || 'rgba(239, 68, 68, 0.8)',
                borderColor: styleConfig['卖出']?.borderColor || 'rgba(239, 68, 68, 1)',
                borderWidth: 1.5,
                pointRadius: styleConfig['卖出']?.pointRadius || 12,
                pointHoverRadius: styleConfig['卖出']?.pointHoverRadius || 14,
                showLine: false,
                pointStyle: styleConfig['卖出']?.pointStyle, // 使用保存的样式函数
                order: styleConfig['卖出']?.order || 1,
                z: styleConfig['卖出']?.z || 10
            };
            newDatasets.push(sellPointsDataset);
        }
        
        // 当前档位水平线（如果有）
        if (etfData && etfData.currentLevelBuyPrice) {
            const levelPrice = parseFloat(etfData.currentLevelBuyPrice);
            const levelLineDataset = {
                label: `当前档位 ${etfData.currentLevel}`,
                data: filteredData.dates.map(date => ({ x: date, y: levelPrice })),
                borderColor: styleConfig['当前档位']?.borderColor || 'rgba(245, 158, 11, 0.7)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0,
                fill: false,
                order: styleConfig['当前档位']?.order || 4 // 确保当前档位线显示在ETF净值之上，但在买卖点之下
            };
            newDatasets.push(levelLineDataset);
        }
        
        // 更新图表数据
        trendChartInstance.data.datasets = newDatasets;
        
        // 更新图表配置，设置自适应显示
        trendChartInstance.options.scales.x.adapting = true;
        trendChartInstance.options.scales.y.adapting = true;
        trendChartInstance.options.scales.x.ticks.autoSkip = true;
        
        // 确保图表适应数据
        if (filteredData.dates.length > 0) {
            // 移除任何之前设置的min/max限制
            delete trendChartInstance.options.scales.x.min;
            delete trendChartInstance.options.scales.x.max;
            delete trendChartInstance.options.scales.y.min;
            delete trendChartInstance.options.scales.y.max;
        }
        
        // 更新图表
        trendChartInstance.update('none'); // 使用'none'参数禁用动画，减少闪烁
        
        // 检查并报告关联状态
        const buyDataset = trendChartInstance.data.datasets.find(ds => ds.label === '买入');
        const sellDataset = trendChartInstance.data.datasets.find(ds => ds.label === '卖出');
        
        if (buyDataset && sellDataset) {
            const relatedSellPointsCount = sellDataset.data.filter(point => 
                point.relatedBuyIndex !== null && 
                point.relatedBuyIndex !== undefined).length;
            
            console.log(`关联状态: ${sellDataset.data.length}个卖出点中有${relatedSellPointsCount}个与买入点正确关联`);
        }
    } catch (error) {
        console.error('更新图表数据失败:', error);
    }
}

// 页面初始化逻辑和事件绑定
document.addEventListener('DOMContentLoaded', async function() {
    console.log('ETF详情页面初始化...');
    
    // 初始化返回按钮
    document.getElementById('backButton').addEventListener('click', function() {
        window.location.href = 'grid.html';
    });
    
    // 初始化选项卡切换功能
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            // 移除所有选项卡的active类
            tabTriggers.forEach(tab => tab.classList.remove('active'));
            
            // 为当前点击的选项卡添加active类
            this.classList.add('active');
            
            // 获取目标内容区ID
            const targetId = this.getAttribute('data-tab') + '-tab';
            
            // 隐藏所有内容区
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('active');
            });
            
            // 显示目标内容区
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.remove('hidden');
                targetContent.classList.add('active');
            }
        });
    });
    
    // 加载ETF详情数据 - 防止重复调用
    let detailDataLoaded = false; // 初始化标记

    try {
        if (!detailDataLoaded) { // 如果数据未加载则加载
            console.log('开始加载ETF详情数据...');
            detailDataLoaded = true; // 标记已经开始加载

        const detailData = await loadEtfDetailData();
        
        // 渲染顶部信息栏
        renderTopInfoBar(detailData);
        
        // 准备图表数据
        const chartData = prepareChartData(detailData);
        console.log('图表数据准备完成:', chartData);
        
        // 渲染趋势图
        renderTrendChart(chartData);
        
        // 准备交易明细表格数据
        const tableData = prepareTradeDetailsTable(detailData);
        console.log('交易明细表格数据准备完成:', tableData);
        
        // 渲染交易明细表格
        renderTradeDetailsTable(tableData);
        
        // 准备网格策略参数数据
        const strategyParams = prepareStrategyParams(detailData);
        console.log('网格策略参数数据准备完成:', strategyParams);
        
        // 渲染网格策略参数区
        renderStrategyParams(strategyParams);
        
        // 计算网格档位数据
        const gridLevelsData = calculateGridLevels(strategyParams, detailData.executions);
        console.log('网格档位数据计算完成:', gridLevelsData);
        
        // 渲染网格档位表格
        renderGridLevelsTable(gridLevelsData);
        
            // 初始化重新计算按钮点击事件
        const generateGridBtn = document.getElementById('generateGridBtn');
        if (generateGridBtn) {
            // 禁用此事件监听，改用grid-calculator.js中的逻辑
            /*
            generateGridBtn.addEventListener('click', function() {
                try {
                    console.log('生成网格按钮点击');
                    
                    // 获取基准价和最低价（直接使用用户输入的值）
                    const basePrice = parseFloat(document.getElementById('basePrice')?.value || '1.0');
                    const minPrice = parseFloat(document.getElementById('minPrice')?.value || '0.5');
                    
                    console.log('获取到基准价:', basePrice, '最低价:', minPrice);
                    
                    // 获取当前参数
                    const currentParams = {
                        targetType: document.getElementById('targetType')?.value || '中国股票',
                        minQuoteUnit: parseFloat(document.getElementById('minQuoteUnit')?.value || '0.001'),
                        minTradeUnit: parseFloat(document.getElementById('minTradeUnit')?.value || '100'),
                        basePrice: basePrice,
                        amountPerUnit: parseFloat(document.getElementById('unitAmount')?.value || '10000'),
                        minPrice: minPrice, // 直接使用用户输入的最低价
                        smallGridStep: parseFloat(document.getElementById('smallGridStep')?.value || '5.0'),
                        mediumGridStep: parseFloat(document.getElementById('mediumGridStep')?.value || '15.0'),
                        largeGridStep: parseFloat(document.getElementById('largeGridStep')?.value || '30.0'),
                        levelBoostFactor: parseFloat(document.getElementById('levelCoeff')?.value || '1.0'),
                        amountBoostFactor: parseFloat(document.getElementById('amountCoeff')?.value || '1.0'),
                        profitRetentionFactor: parseFloat(document.getElementById('profitCoeff')?.value || '1.0')
                    };
                    
                    console.log('生成网格使用参数:', currentParams);
                    
                    // 参数合理性检查
                    if (currentParams.minPrice >= currentParams.basePrice) {
                        alert('最低价不能大于或等于基准价，请调整参数');
                        return;
                    }
                    
                    // 重新计算网格档位数据
                    const updatedGridLevelsData = calculateGridLevels(currentParams, detailData.executions);
                    
                    // 重新渲染网格档位表格
                    renderGridLevelsTable(updatedGridLevelsData);
                    
                    console.log('网格生成完成');
                } catch (error) {
                    console.error('生成网格时发生错误:', error);
                    alert('生成网格时发生错误: ' + error.message);
                }
            });
            */
            console.log('grid-detail.js中的事件监听已禁用，使用grid-calculator.js的逻辑');
        }
        }

        // 所有渲染完成后，隐藏加载指示器并显示主内容
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('mainContentContainer').style.display = 'block';
        console.log('页面渲染完成，显示主内容。');
    } catch (error) {
        console.error('页面初始化失败:', error);
        // 即使初始化失败，也尝试隐藏加载指示器，并可能显示错误信息
        document.getElementById('loadingIndicator').style.display = 'none';
        // 这里可以添加代码来显示一个错误消息区域
    }
});

/**
 * 设置事件处理器
 */
function setupEventHandlers() {
    try {
        console.log('设置事件处理器...');
        
        // ... existing code ...
        
        // ... existing code ...
        
    } catch (error) {
        console.error('设置事件处理器失败:', error);
    }
}

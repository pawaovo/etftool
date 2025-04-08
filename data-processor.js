// 数据处理器 - 基于etf.json和adjust.json更新页面内容
let etfData = null;
let adjustData = null;

// 时间戳转换为日期格式
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

// 格式化百分比
function formatPercent(value) {
    return (value * 100).toFixed(2) + '%';
}

// 加载ETF数据
async function loadETFData() {
    try {
        const response = await fetch('etf.json');
        etfData = await response.json();
        return etfData;
    } catch (error) {
        console.error('加载ETF数据失败:', error);
        return null;
    }
}

// 加载调整数据
async function loadAdjustData() {
    try {
        const response = await fetch('adjust.json');
        adjustData = await response.json();
        return adjustData;
    } catch (error) {
        console.error('加载调整数据失败:', error);
        return null;
    }
}

// 获取大类资产的最后操作时间
function getLastOperationTimeForAssetClass(className) {
    if (!adjustData) return null;
    
    // 收集该大类资产的所有操作时间
    const operationTimes = [];
    
    for (const adjustment of adjustData) {
        for (const order of adjustment.orders) {
            if (order.largeClass === className) {
                operationTimes.push({
                    time: order.adjustTxnDate,
                    date: convertNavdataToDate(order.adjustTxnDate)
                });
            }
        }
    }
    
    // 按时间戳排序（降序）
    operationTimes.sort((a, b) => b.time - a.time);
    
    // 返回最近的操作时间
    return operationTimes.length > 0 ? operationTimes[0] : null;
}

// 获取特定基金的历史最低价格
function getHistoryLowestPrice(fundCode) {
    if (!adjustData) return null;
    
    let lowestPrice = Number.MAX_VALUE;
    let lowestPriceData = null;
    
    for (const adjustment of adjustData) {
        for (const order of adjustment.orders) {
            if (order.fund && order.fund.fundCode === fundCode && order.nav && order.nav < lowestPrice) {
                lowestPrice = order.nav;
                lowestPriceData = {
                    price: lowestPrice,
                    date: convertNavdataToDate(order.navDate)
                };
            }
        }
    }
    
    return lowestPriceData;
}

// 获取特定基金的最后操作信息
function getLastOperationForFund(fundCode) {
    if (!adjustData) return null;
    
    const operations = [];
    
    for (const adjustment of adjustData) {
        for (const order of adjustment.orders) {
            if (order.fund && order.fund.fundCode === fundCode) {
                operations.push({
                    time: order.adjustTxnDate,
                    date: convertNavdataToDate(order.adjustTxnDate),
                    type: order.tradeUnit === 1 ? '买入' : '卖出'
                });
            }
        }
    }
    
    // 按时间戳排序（降序）
    operations.sort((a, b) => b.time - a.time);
    
    // 返回最近的操作
    return operations.length > 0 ? operations[0] : null;
}

// 更新左侧资产排名
function updateAssetRanking() {
    if (!etfData) return;
    
    const assetList = document.querySelector('.asset-list');
    if (!assetList) return;
    
    // 清空现有内容
    assetList.innerHTML = '';
    
    // 按累计收益率排序（降序）
    const sortedAssets = [...etfData.composition].sort((a, b) => {
        // 如果accProfitRate为null，则排在最后
        if (a.accProfitRate === null) return 1;
        if (b.accProfitRate === null) return -1;
        return b.accProfitRate - a.accProfitRate;
    });
    
    // 创建并添加资产项
    sortedAssets.forEach(asset => {
        const assetItem = document.createElement('div');
        assetItem.className = 'asset-item';
        assetItem.dataset.assetType = asset.classCode.toLowerCase();
        
        // 判断是否有累计收益率，以及是否为正值
        const hasProfit = asset.accProfitRate !== null;
        const isProfitPositive = hasProfit && asset.accProfitRate > 0;
        
        assetItem.innerHTML = `
            <span class="asset-icon ${asset.classCode.toLowerCase()}"></span>
            <div class="asset-info">
                <span class="asset-name">${asset.className}</span>
                <span class="asset-shares">${asset.unit}份 (${formatPercent(asset.percent)})</span>
            </div>
            <span class="asset-profit ${isProfitPositive ? 'positive' : 'negative'}">
                ${hasProfit ? (isProfitPositive ? '+' : '') + formatPercent(asset.accProfitRate) : '未投入'}
            </span>
        `;
        
        assetList.appendChild(assetItem);
    });
}

// 更新右侧资产详情
function updateAssetDetails() {
    if (!etfData || !adjustData) return;
    
    const fundCardsContainer = document.querySelector('.fund-cards-container');
    if (!fundCardsContainer) return;
    
    // 清空现有内容
    fundCardsContainer.innerHTML = '';
    
    // 遍历每个资产类别
    etfData.composition.forEach(assetClass => {
        // 如果是现金类别或没有组件，则跳过
        if (assetClass.isCash || !assetClass.compList || assetClass.compList.length === 0) return;
        
        // 获取该资产类别的最后操作时间
        const lastOperation = getLastOperationTimeForAssetClass(assetClass.className);
        
        // 创建资产组
        const assetGroup = document.createElement('div');
        assetGroup.className = 'asset-group';
        
        // 添加资产组头部
        assetGroup.innerHTML = `
            <div class="asset-group-header">
                <div class="title-section">
                    <span class="asset-icon ${assetClass.classCode.toLowerCase()}"></span>
                    <h4>${assetClass.className} <span class="detail-shares">${assetClass.unit}份 (${formatPercent(assetClass.percent)})</span></h4>
                </div>
                <div class="detail-info">
                    <span class="detail-profit">累计收益率 ${assetClass.accProfitRate !== null ? (assetClass.accProfitRate > 0 ? '+' : '') + formatPercent(assetClass.accProfitRate) : '未投入'}</span>
                    <span class="detail-date">${lastOperation ? lastOperation.date : '无操作记录'}</span>
                </div>
            </div>
            <div class="fund-cards"></div>
        `;
        
        const fundCards = assetGroup.querySelector('.fund-cards');
        
        // 添加基金卡片
        assetClass.compList.forEach(fund => {
            // 跳过现金
            if (fund.isCash) return;
            
            // 获取该基金的最后操作信息
            const lastOperation = getLastOperationForFund(fund.fund.fundCode);
            
            // 获取该基金的历史最低价格
            const lowestPrice = getHistoryLowestPrice(fund.fund.fundCode);
            
            // 计算现值对比平均单价 (只有当持有份数>0时才有意义)
            let compareToAvg = null;
            if (fund.planUnit > 0 && fund.unitValue && fund.nav) {
                compareToAvg = (fund.nav - fund.unitValue) / fund.unitValue;
            }
            
            // 计算现值对比历史最低单价
            let compareToLowest = null;
            if (lowestPrice && lowestPrice.price && fund.nav) {
                compareToLowest = (fund.nav - lowestPrice.price) / lowestPrice.price;
            }
            
            // 判断是否为已清仓基金
            const isCleared = fund.planUnit === 0;
            
            // 创建基金卡片
            const fundCard = document.createElement('div');
            fundCard.className = `fund-card${isCleared ? ' cleared' : ''}`;
            
            // 判断基金表现 (正收益为positive, 负收益为negative)
            const performance = fund.accProfit > 0 ? 'positive' : 'negative';
            
            fundCard.innerHTML = `
                <div class="fund-header ${performance}">
                    <span class="fund-title">${fund.variety}-${fund.fund.fundName}</span>
                    <span class="fund-code">${fund.fund.fundCode}</span>
                </div>
                <div class="fund-data">
                    <div class="fund-data-row">
                        <span class="fund-label">最后操作</span>
                        <span class="fund-value">${lastOperation ? `${lastOperation.type} (${lastOperation.date})` : '无记录'}</span>
                    </div>
                    <div class="fund-data-row">
                        <span class="fund-label">份数/占比</span>
                        <span class="fund-value">${isCleared ? '已清仓/0%' : `${fund.planUnit}份/${formatPercent(fund.percent)}`}</span>
                    </div>
                    <div class="fund-data-row">
                        <span class="fund-label">累计收益率</span>
                        <span class="fund-value ${fund.accProfit > 0 ? 'positive' : 'negative'}">${fund.accProfit > 0 ? '+' : ''}${formatPercent(fund.accProfit)}</span>
                    </div>
                    <div class="fund-data-row">
                        <span class="fund-label">E大平均持有单价</span>
                        <span class="fund-value">${fund.unitValue !== null ? fund.unitValue.toFixed(4) : '未持有'}</span>
                    </div>
                    <div class="fund-data-row">
                        <span class="fund-label">E大历史最低单价</span>
                        <span class="fund-value">${lowestPrice ? lowestPrice.price.toFixed(4) : '无记录'}</span>
                    </div>
                    <div class="fund-data-row">
                        <span class="fund-label">最新净值</span>
                        <span class="fund-value">${fund.nav ? fund.nav.toFixed(4) : '未知'}</span>
                    </div>
                    <div class="fund-data-row">
                        <span class="fund-label">现值对比平均单价</span>
                        <span class="fund-value ${compareToAvg > 0 ? 'positive' : 'negative'}">${compareToAvg !== null ? (compareToAvg > 0 ? '+' : '') + formatPercent(compareToAvg) : '未持有'}</span>
                    </div>
                    <div class="fund-data-row">
                        <span class="fund-label">现值对比历史最低</span>
                        <span class="fund-value ${compareToLowest > 0 ? 'positive' : 'negative'}">${compareToLowest !== null ? (compareToLowest > 0 ? '+' : '') + formatPercent(compareToLowest) : '无记录'}</span>
                    </div>
                </div>
            `;
            
            fundCards.appendChild(fundCard);
        });
        
        fundCardsContainer.appendChild(assetGroup);
    });
}

// 初始化数据
async function initData() {
    await Promise.all([loadETFData(), loadAdjustData()]);
    updateAssetRanking();
    updateAssetDetails();
}

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', initData); 
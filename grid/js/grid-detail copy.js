document.addEventListener('DOMContentLoaded', function() {
    // 初始化标签切换
    initTabs();
    
    // 初始化网格表格
    initGridTable();
    
    // 绑定生成网格按钮事件
    document.getElementById('generateGridBtn').addEventListener('click', generateGrid);
    
    // 返回按钮事件
    document.getElementById('backButton').addEventListener('click', function() {
        window.location.href = '../index.html';
    });
    
    // 点击放大趋势图
    if (document.querySelector('.chart-container')) {
        document.querySelector('.chart-container').addEventListener('click', function() {
            openChartModal();
        });
    }
    
    // 关闭趋势图模态窗口
    if (document.getElementById('closeChartModal')) {
        document.getElementById('closeChartModal').addEventListener('click', function() {
            closeChartModal();
        });
    }
    
    // 创建并初始化工具提示
    createTooltip();
    
    // 自动生成初始网格数据
    generateGrid();
});

// 创建全局工具提示元素并设置事件监听
function createTooltip() {
    // 提示数据映射
    const tooltipData = {
        'targetType': '影响股数的计算方式',
        'minTradeUnit': '整数值1/10/100...',
        'basePrice': '第一份买入价',
        'unitAmount': '第一份买入金额，不同档位的买入金额会乘一个系数',
        'minPrice': '低于此价不会再买入（最低为其基准价的10%）',
        'smallGridStep': '跌多少个百分点触发下一个档位',
        'levelCoeff': '逐级增加档位间距（即利润率），默认小网从4档开始，中/大网2档开始',
        'amountCoeff': '逐级增加买入金额。如: 0:按照设定好的每份金额买入。公式：每份金额 + 每份金额 * 系数 * (1 - 当前档位)。比如：每份金额是10000，系数是1，当前档位是0.9，则买入金额是10000 + 10000 * 1 * (1 - 0.9) = 11000',
        'profitCoeff': '卖出时，是否保留利润。如: 0:不保留利润，0.5:保留一半利润，1:保留全部利润，2:保留两倍利润'
    };
    
    // 创建单一的全局工具提示元素
    const tooltip = document.createElement('div');
    tooltip.id = 'global-tooltip';
    tooltip.style.cssText = `
        position: fixed;
        background-color: #1e293b;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        max-width: 250px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        white-space: normal;
        line-height: 1.4;
    `;
    document.body.appendChild(tooltip);
    
    // 手动为每个图标添加data属性
    setTimeout(() => {
        // 查找所有表单字段标签旁的help-circle图标
        document.querySelectorAll('.space-y-1').forEach(container => {
            const input = container.querySelector('input, select');
            if (!input) return;
            
            const helpIcon = container.querySelector('svg.lucide-help-circle');
            if (!helpIcon) return;
            
            const fieldId = input.id;
            if (tooltipData[fieldId]) {
                // 添加自定义数据属性存储提示内容
                helpIcon.setAttribute('data-tooltip', tooltipData[fieldId]);
                // 添加自定义类方便识别
                helpIcon.classList.add('has-tooltip');
                // 设置鼠标指针样式
                helpIcon.style.cursor = 'pointer';
                console.log(`添加了提示: ${fieldId}`);
            }
        });
    }, 500);
    
    // 使用事件委托监听鼠标移入/移出事件
    document.addEventListener('mouseover', function(e) {
        // 检查是否悬停在带提示的图标上
        if (e.target.closest('.has-tooltip') || e.target.classList.contains('has-tooltip')) {
            const icon = e.target.closest('.has-tooltip') || e.target;
            const content = icon.getAttribute('data-tooltip');
            
            if (content) {
                // 显示提示
                tooltip.textContent = content;
                tooltip.style.opacity = '1';
                
                // 计算位置
                const rect = icon.getBoundingClientRect();
                tooltip.style.left = (rect.right + 10) + 'px';
                tooltip.style.top = (rect.top - 5) + 'px';
                
                // 确保提示不超出窗口
                const tooltipRect = tooltip.getBoundingClientRect();
                if (tooltipRect.right > window.innerWidth) {
                    tooltip.style.left = (rect.left - tooltipRect.width - 10) + 'px';
                }
                if (tooltipRect.bottom > window.innerHeight) {
                    tooltip.style.top = (window.innerHeight - tooltipRect.height - 10) + 'px';
                }
            }
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.has-tooltip') || e.target.classList.contains('has-tooltip')) {
            // 隐藏提示
            tooltip.style.opacity = '0';
        }
    });
}

function initTabs() {
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            // 移除所有active类
            tabTriggers.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));
            
            // 添加active类到当前tab
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.remove('hidden');
            
            // 如果切换到网格标签，确保网格数据已生成
            if (tabId === 'grid') {
                const gridTable = document.getElementById('gridTable');
                if (gridTable.querySelector('tbody').children.length === 0) {
                    generateGrid();
                }
            }
        });
    });
}

function initGridTable() {
    const transactionData = [
        { id: 1, date: '2023-08-01', type: '买入', price: '0.950', amount: '10,450', quantity: '11,000', status: '已完成' },
        { id: 2, date: '2023-08-05', type: '卖出', price: '1.000', amount: '10,600', quantity: '10,600', status: '已完成' },
        { id: 3, date: '2023-08-10', type: '买入', price: '0.950', amount: '10,450', quantity: '11,000', status: '已完成' },
        { id: 4, date: '2023-08-15', type: '卖出', price: '1.000', amount: '10,600', quantity: '10,600', status: '已完成' },
        { id: 5, date: '2023-08-20', type: '买入', price: '0.900', amount: '10,900', quantity: '12,100', status: '已完成' },
        { id: 6, date: '2023-08-25', type: '卖出', price: '0.950', amount: '11,400', quantity: '12,000', status: '已完成' },
    ];
    
    const table = document.getElementById('transactionTable');
    
    let transactionHtml = `
        <thead>
            <tr>
                <th class="py-3 px-4 text-left text-xs font-semibold text-slate-700 border-b">ID</th>
                <th class="py-3 px-4 text-left text-xs font-semibold text-slate-700 border-b">日期</th>
                <th class="py-3 px-4 text-left text-xs font-semibold text-slate-700 border-b">交易类型</th>
                <th class="py-3 px-4 text-left text-xs font-semibold text-slate-700 border-b">价格</th>
                <th class="py-3 px-4 text-left text-xs font-semibold text-slate-700 border-b">金额</th>
                <th class="py-3 px-4 text-left text-xs font-semibold text-slate-700 border-b">数量</th>
                <th class="py-3 px-4 text-left text-xs font-semibold text-slate-700 border-b">状态</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    transactionData.forEach(item => {
        transactionHtml += `
            <tr class="hover:bg-gray-50">
                <td class="py-3 px-4 text-sm text-slate-700 border-b">${item.id}</td>
                <td class="py-3 px-4 text-sm text-slate-700 border-b">${item.date}</td>
                <td class="py-3 px-4 text-sm font-medium ${item.type === '买入' ? 'text-green-600' : 'text-blue-600'} border-b">${item.type}</td>
                <td class="py-3 px-4 text-sm text-slate-700 border-b">${item.price}</td>
                <td class="py-3 px-4 text-sm text-slate-700 border-b">¥ ${item.amount}</td>
                <td class="py-3 px-4 text-sm text-slate-700 border-b">${item.quantity}</td>
                <td class="py-3 px-4 text-sm text-slate-700 border-b">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${item.status === '已完成' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                        ${item.status}
                    </span>
                </td>
            </tr>
        `;
    });
    
    transactionHtml += '</tbody>';
    table.innerHTML = transactionHtml;
}

function generateGrid() {
    // 获取表单参数
    const params = {
        targetType: document.getElementById('targetType').value,
        minQuoteUnit: parseFloat(document.getElementById('minQuoteUnit').value),
        minTradeUnit: parseInt(document.getElementById('minTradeUnit').value),
        basePrice: parseFloat(document.getElementById('basePrice').value),
        unitAmount: parseFloat(document.getElementById('unitAmount').value),
        minPrice: parseFloat(document.getElementById('minPrice').value),
        smallGridStep: parseFloat(document.getElementById('smallGridStep').value) / 100,
        mediumGridStep: parseFloat(document.getElementById('mediumGridStep').value) / 100,
        largeGridStep: parseFloat(document.getElementById('largeGridStep').value) / 100,
        levelCoeff: parseFloat(document.getElementById('levelCoeff').value),
        amountCoeff: parseFloat(document.getElementById('amountCoeff').value),
        profitCoeff: parseFloat(document.getElementById('profitCoeff').value)
    };
    
    // 调用网格计算函数
    const gridData = calculateGrid(params);
    
    // 更新表格
    updateGridTable(gridData);
    
    // 更新汇总信息
    updateSummaryInfo(gridData.summary);
}

function calculateGrid(params) {
    const gridData = { 
        levels: [],
        summary: {
            totalBuyAmount: 0,
            totalBuyQuantity: 0,
            totalSellAmount: 0,
            totalSellQuantity: 0,
            totalRemainingShares: 0,
            totalProfit: 0,
            profitRate: 0
        }
    };
    
    // 计算小网格
    generateGridLevels('小网', 1.0, params.smallGridStep, 10, params);
    
    // 计算中网格
    generateGridLevels('中网', 0.85, params.mediumGridStep, 6, params);
    
    // 计算大网格
    generateGridLevels('大网', 0.70, params.largeGridStep, 3, params);
    
    // 本地辅助函数，生成网格档位
    function generateGridLevels(gridType, startLevel, step, maxLevels, params) {
        let currentLevel = startLevel;
        let prevBuyPrice = params.basePrice;
        
        for (let i = 1; i <= maxLevels && currentLevel >= params.minPrice; i++) {
            // 应用档位加码系数
            if (gridType === '小网' && i >= 4 && params.levelCoeff > 0) {
                // 小网从第4档开始应用档位加码
                currentLevel = currentLevel - step - 0.01 * params.levelCoeff * (i - 3);
            } else if (gridType === '中网' && i >= 2 && params.levelCoeff > 0) {
                // 中网从第2档开始应用档位加码（系数翻倍）
                currentLevel = currentLevel - step - 0.01 * params.levelCoeff * 2 * (i - 1);
            } else if (gridType === '大网' && i >= 2 && params.levelCoeff > 0) {
                // 大网从第2档开始应用档位加码（系数翻3倍）
                currentLevel = currentLevel - step - 0.01 * params.levelCoeff * 3 * (i - 1);
            } else {
                // 正常扣减步长
                currentLevel = currentLevel - step;
            }
            
            // 确保不低于最低价
            if (currentLevel < params.minPrice) break;
            
            // 计算买入价和触发价
            const buyPrice = roundToDecimalPlaces(params.basePrice * currentLevel, 2);
            const buyTriggerPrice = roundToDecimalPlaces(buyPrice + 0.005, 3);
            
            // 计算买入金额（应用金额加码系数）
            const buyAmount = roundToDecimalPlaces(params.unitAmount + params.unitAmount * params.amountCoeff * (1 - currentLevel), 2);
            
            // 计算买入股数
            const buyQuantity = Math.round(buyAmount / buyPrice / params.minTradeUnit) * params.minTradeUnit;
            const actualBuyAmount = roundToDecimalPlaces(buyQuantity * buyPrice, 2);
            
            // 计算卖出价和触发价
            let sellPrice, sellTriggerPrice;
            
            // 特殊处理小网第一档的卖出价和卖出触发价
            if (gridType === '小网' && i === 1) {
                sellPrice = 1.005; // 小网第一档卖出价固定为1.005
                sellTriggerPrice = 1.045; // 小网第一档卖出触发价固定为1.045
            } else {
                sellPrice = prevBuyPrice;
                sellTriggerPrice = roundToDecimalPlaces(sellPrice - 0.005, 3);
            }
            
            // 计算卖出股数（考虑保留利润）
            const profit = (sellPrice - buyPrice) * buyQuantity;
            const profitToRetain = profit * params.profitCoeff;
            const sharesToRetain = Math.floor(profitToRetain / sellPrice / params.minTradeUnit) * params.minTradeUnit;
            const sellQuantity = buyQuantity - sharesToRetain;
            const sellAmount = roundToDecimalPlaces(sellQuantity * sellPrice, 2);
            
            // 计算单个档位的利润和利润率
            const levelProfit = roundToDecimalPlaces(sellAmount - actualBuyAmount, 2);
            const levelProfitRate = roundToDecimalPlaces(levelProfit / actualBuyAmount * 100, 2);
            
            // 添加到网格数据
            gridData.levels.push({
                gridType,
                level: i,
                levelValue: currentLevel,
                buyTriggerPrice,
                buyPrice,
                buyAmount: actualBuyAmount,
                buyQuantity,
                sellTriggerPrice,
                sellPrice,
                sellQuantity,
                sellAmount,
                profit: levelProfit,
                profitRate: levelProfitRate
            });
            
            // 更新汇总数据
            gridData.summary.totalBuyAmount += actualBuyAmount;
            gridData.summary.totalBuyQuantity += buyQuantity;
            gridData.summary.totalSellAmount += sellAmount;
            gridData.summary.totalSellQuantity += sellQuantity;
            gridData.summary.totalRemainingShares += buyQuantity - sellQuantity;
            
            // 更新前一次买入价（用于下一档的卖出价计算）
            prevBuyPrice = buyPrice;
        }
    }
    
    // 计算总利润和利润率
    gridData.summary.totalBuyAmount = roundToDecimalPlaces(gridData.summary.totalBuyAmount, 2);
    gridData.summary.totalSellAmount = roundToDecimalPlaces(gridData.summary.totalSellAmount, 2);
    
    // 计算总利润 = 总卖出金额 - 总买入金额 + 总剩余股数 × 基准价
    gridData.summary.totalProfit = roundToDecimalPlaces(
        gridData.summary.totalSellAmount - 
        gridData.summary.totalBuyAmount + 
        gridData.summary.totalRemainingShares * params.basePrice, 
        2
    );
    
    // 计算总利润率
    gridData.summary.profitRate = roundToDecimalPlaces(
        gridData.summary.totalProfit / gridData.summary.totalBuyAmount * 100, 
        2
    );
    
    return gridData;
}

function updateGridTable(gridData) {
    const tableBody = document.querySelector('#gridTable tbody');
    tableBody.innerHTML = '';
    
    gridData.levels.forEach(level => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4 text-sm text-slate-700 border-b">${level.gridType}</td>
            <td class="py-3 px-4 text-sm text-slate-700 border-b">${level.level}</td>
            <td class="py-3 px-4 text-sm text-slate-700 border-b">${level.buyTriggerPrice.toFixed(3)}</td>
            <td class="py-3 px-4 text-sm text-slate-700 border-b">${level.buyPrice.toFixed(3)}</td>
            <td class="py-3 px-4 text-sm text-slate-700 border-b">¥ ${level.buyAmount.toFixed(2)}</td>
            <td class="py-3 px-4 text-sm text-slate-700 border-b">${level.buyQuantity}</td>
            <td class="py-3 px-4 text-sm text-slate-700 border-b">${level.sellTriggerPrice.toFixed(3)}</td>
            <td class="py-3 px-4 text-sm text-slate-700 border-b">${level.sellPrice.toFixed(3)}</td>
            <td class="py-3 px-4 text-sm text-slate-700 border-b">${level.sellQuantity}</td>
            <td class="py-3 px-4 text-sm text-slate-700 border-b">¥ ${level.sellAmount.toFixed(2)}</td>
            <td class="py-3 px-4 text-sm text-slate-700 border-b">¥ ${level.profit.toFixed(2)}</td>
            <td class="py-3 px-4 text-sm text-slate-700 border-b">${level.profitRate.toFixed(2)}%</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateSummaryInfo(summary) {
    document.getElementById('totalBuyAmount').textContent = `¥ ${summary.totalBuyAmount.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('totalBuyQuantity').textContent = summary.totalBuyQuantity.toLocaleString('zh-CN');
    document.getElementById('totalSellAmount').textContent = `¥ ${summary.totalSellAmount.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('totalSellQuantity').textContent = summary.totalSellQuantity.toLocaleString('zh-CN');
    document.getElementById('totalShares').textContent = summary.totalRemainingShares.toLocaleString('zh-CN');
    document.getElementById('profit').textContent = `¥ ${summary.totalProfit.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('profitRate').textContent = `${summary.profitRate.toFixed(2)}%`;
}

function openChartModal() {
    document.getElementById('chartModal').classList.remove('hidden');
    document.getElementById('chartModal').classList.add('flex');
    
    // 在模态窗口中重新初始化趋势图
    // 这里假设趋势图初始化函数已经定义
    if (typeof window.initModalTrendChart === 'function') {
        window.initModalTrendChart();
    }
}

function closeChartModal() {
    document.getElementById('chartModal').classList.add('hidden');
    document.getElementById('chartModal').classList.remove('flex');
}

function roundToDecimalPlaces(value, places) {
    const multiplier = Math.pow(10, places);
    return Math.round(value * multiplier) / multiplier;
} 
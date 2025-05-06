/**
 * ETF投资工具 - 主要JavaScript文件
 * ================================
 * 
 * 本文件包含ETF投资工具的核心功能实现，包括：
 * 1. 页面初始化与数据加载
 * 2. 大类资产排名与详情展示
 * 3. ETF卡片的动态生成与交互
 * 4. 排序与资产筛选功能
 * 5. 资金状况动态显示
 * 
 * 重要说明：
 * - 本文件依赖processed-data.js中的预处理数据
 * - 每次更新etf.json或adjust.json后，必须运行process-data.js重新生成预处理数据
 * - 资产类型标识必须保持一致性，特别是境内债券统一使用'cn-bond'
 * - 现金资产有特殊处理，不在右侧详情中显示
 * 
 * 主要函数索引：
 * - initPlanPage: 页面初始化
 * - generateAssetGroupsHTML: 动态生成资产组HTML
 * - showAssetDetails: 显示资产详情
 * - sortAssets: 排序资产列表
 * - updateFundStatusDouble: 更新资金状况显示
 */

// --- Function Definitions Start ---

/**
 * 加载dateUtils.js脚本
 * @returns {Promise} - 加载完成的Promise
 */
function loadDateUtilsScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'dateUtils.js'; // 确保路径相对于 HTML 文件
        script.onload = () => {
            console.log('dateUtils.js 加载成功');
            // 假设 dateUtils.js 将其功能附加到 window.dateUtils
            if (typeof window.dateUtils !== 'undefined') {
                resolve();
            } else {
                console.warn('dateUtils.js 已加载，但 window.dateUtils 未定义');
                // 仍然 resolve，让后续逻辑使用内联备份
                resolve(); 
            }
        };
        script.onerror = (err) => {
            console.error('dateUtils.js 加载失败:', err);
            reject(err); // reject Promise 让 catch 处理
        };
        document.head.appendChild(script);
    });
}

/**
 * 页面初始化函数
 * 设置各种事件监听和加载初始数据
 * 
 * 重要变更：整体思路已调整为完全动态生成HTML内容，而不依赖于HTML中的硬编码值。
 * 这样当etf.json和adjust.json文件更新时，页面将自动显示最新数据，无需手动修改HTML。
 */
function initPlanPage() {
    console.log('初始化计划页面');
    
    // 检查当前页面类型
    const isGridPlan = window.currentPlan === 'grid';
    console.log('当前页面类型:', window.currentPlan);
    
    // 检查是否有预处理数据
    if (typeof processedData !== 'undefined') {
        console.log('找到预处理数据，将使用它来更新UI');
        
        // 网格策略页面不需要更新资金状况和资产排名等内容
        if (!isGridPlan) {
            // 更新资金状况双行显示
            updateFundStatusDouble(processedData);
            // 更新资产排名的逻辑已移至 loadAssetInfo()
        }
        // ETF 卡片数据加载和颜色设置已移至 DOMContentLoaded
    } else {
        console.warn('未找到预处理数据，将尝试通过fetch或XHR加载数据');
        // 实际数据加载应在 DOMContentLoaded 中触发
    }

    // 设置计划标签切换
    setupPlanTabs();
    
    // 只有非网格策略页面需要设置排序控件和资产项点击
    if (!isGridPlan) {
        // 设置排序控件
        setupSortControls();
        
        // 设置资产项点击
        setupAssetItems();
    }
}

/**
 * 设置计划标签切换
 * 切换150计划和网格策略的数据展示
 */
function setupPlanTabs() {
    const planTabs = document.querySelectorAll('.plan-tab');
    
    planTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签的active类
            planTabs.forEach(t => t.classList.remove('active'));
            
            // 给当前点击的标签添加active类
            this.classList.add('active');
            
            // 获取当前选择的计划
            const planType = this.getAttribute('data-plan');
            
            // 跳转到相应的计划页面
            if (planType === '150') {
                window.location.href = '150plan.html';
            } else if (planType === 'grid') {
                window.location.href = '../grid/grid.html';
            }
        });
    });
}

/**
 * 设置排序控制
 * 可按份数或收益率排序资产列表
 */
function setupSortControls() {
    const sortBtns = document.querySelectorAll('.sort-btn');
    
    sortBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有排序按钮的active类
            sortBtns.forEach(b => b.classList.remove('active'));
            
            // 给当前点击的按钮添加active类
            this.classList.add('active');
            
            // 获取排序方式
            const sortType = this.getAttribute('data-sort');
            
            // 根据排序方式重新排序和加载数据
            sortAssets(sortType);
        });
    });
}

/**
 * 设置资产项点击事件
 * 点击资产项显示相应的基金详情
 */
function setupAssetItems() {
    const assetItems = document.querySelectorAll('.asset-item');
    
    assetItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有资产项的active类
            assetItems.forEach(i => i.classList.remove('active'));
            
            // 给当前点击的资产项添加active类
            this.classList.add('active');
            
            // 获取资产类型
            const assetType = this.getAttribute('data-asset-type');
            
            // 显示该资产类型的详情
            showAssetDetails(assetType);
        });
    });
}

/**
 * 从URL获取选定的资产类型
 */
function getSelectedAssetType() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('asset');
}

/**
 * 获取排序参数
 */
function getSortParam() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sort') || 'shares'; // 默认按份数排序
}

/**
 * 更新URL参数
 */
function updateUrlParams(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
}

/**
 * 按指定方式排序资产
 */
function sortAssets(sortType) {
    // 检查是否有预处理数据及assetRankings
    if (typeof processedData !== 'undefined' && processedData.assetRankings) {
        const assetList = document.querySelector('.asset-list');
        if (!assetList) return;
        
        // 根据排序方式获取对应的排序结果
        let sortedAssets;
        if (sortType === 'shares') {
            console.log('按份数排序');
            sortedAssets = processedData.assetRankings.byUnit;
        } else if (sortType === 'profit') {
            console.log('按收益率排序');
            sortedAssets = processedData.assetRankings.byProfit;
        } else {
            console.warn('未知的排序方式:', sortType);
            return;
        }
        
        // 确保有排序结果
        if (!sortedAssets || sortedAssets.length === 0) {
            console.warn('无排序结果');
            return;
        }
        
        console.log(`使用预处理的排序结果，共${sortedAssets.length}项`);
        
        // 清空当前资产列表的选中状态
        const assetItems = Array.from(assetList.querySelectorAll('.asset-item'));
        assetItems.forEach(item => item.classList.remove('active'));
        
        // 遍历排序后的资产，更新资产排名列表
        sortedAssets.forEach(asset => {
            const assetType = getAssetTypeFromClassName(asset.className);
            const assetItem = assetList.querySelector(`.asset-item[data-asset-type="${assetType}"]`);
            
            if (assetItem) {
                // 将该项移动到列表末尾，实现排序
                assetList.appendChild(assetItem);
                // 数据更新由 loadAssetInfo 负责
            }
        });
        
        // 选中第一个资产
        const firstAssetItem = assetList.querySelector('.asset-item');
        if (firstAssetItem) {
            firstAssetItem.classList.add('active');
            const firstAssetType = firstAssetItem.getAttribute('data-asset-type');
            showAssetDetails(firstAssetType); // 触发滚动
        }
        
        // 更新URL参数
        updateUrlParams('sort', sortType);
    } else {
        // 兼容旧代码：如果没有预处理数据，使用原来的DOM操作方式排序
        console.warn('未找到预处理的资产排名数据，使用DOM操作排序');
        
        const assetList = document.querySelector('.asset-list');
        const assetItems = Array.from(assetList.querySelectorAll('.asset-item'));
        
        // 根据排序方式进行排序
        if (sortType === 'shares') {
            assetItems.sort((a, b) => {
                const aShares = a.querySelector('.asset-shares')?.textContent || '0份';
                const bShares = b.querySelector('.asset-shares')?.textContent || '0份';
                const aMatch = aShares.match(/(\d+)份/);
                const bMatch = bShares.match(/(\d+)份/);
                return bMatch && aMatch ? parseInt(bMatch[1]) - parseInt(aMatch[1]) : 0;
            });
        } else if (sortType === 'profit') {
            assetItems.sort((a, b) => {
                const aProfit = a.querySelector('.asset-profit')?.textContent || '+0.00%';
                const bProfit = b.querySelector('.asset-profit')?.textContent || '+0.00%';
                const aMatch = aProfit.match(/([+\-]?\d+(\.\d+)?)%/);
                const bMatch = bProfit.match(/([+\-]?\d+(\.\d+)?)%/);
                return bMatch && aMatch ? parseFloat(bMatch[1]) - parseFloat(aMatch[1]) : 0;
            });
        }
        
        assetItems.forEach(item => assetList.appendChild(item));
        
        if (assetItems.length > 0) {
            assetItems.forEach(item => item.classList.remove('active'));
            assetItems[0].classList.add('active');
            const firstAssetType = assetItems[0].getAttribute('data-asset-type');
            showAssetDetails(firstAssetType); // 触发滚动
        }
        
        updateUrlParams('sort', sortType);
    }
}

/**
 * 显示资产详情
 * 
 * 重要说明：
 * 1. 此函数处理点击左侧资产项后的交互逻辑
 * 2. 现金资产(cash)有特殊处理：点击不会有任何响应
 * 3. 点击其他资产会高亮显示并滚动到对应的资产组
 * 
 * @param {string} assetType - 资产类型
 */
function showAssetDetails(assetType) {
    if (assetType === 'cash') {
        console.log('现金资产无详情可显示，已跳过操作');
        return;
    }
    
    const assetItems = document.querySelectorAll('.asset-item');
    assetItems.forEach(item => {
        if (item.dataset.assetType === assetType) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    scrollToAssetGroup(assetType);
    updateUrlParams('asset', assetType);
}

/**
 * 滚动到对应的资产组
 * @param {string} assetType - 资产类型
 */
function scrollToAssetGroup(assetType) {
    if (assetType === 'cash') {
        return;
    }
    
    console.log(`尝试滚动到资产组: ${assetType}`);
    
    // 优先使用 data-asset-type 属性查找
    const targetGroup = document.querySelector(`.asset-group[data-asset-type="${assetType}"]`);
    
    if (targetGroup) {
        console.log(`找到匹配的资产组: ${assetType}`);
        targetGroup.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log(`已滚动到资产组: ${assetType}`);
    } else {
        console.warn(`未找到资产组: ${assetType}`);
        // 可以添加后备查找逻辑（例如通过图标或标题），但优先确保 data-asset-type 正确设置
    }
}

/**
 * 设置基金卡片颜色
 * 根据现值对比平均单价设置卡片标题栏的颜色 (现在基于 compareWithAvg)
 */
function setupFundCardColors() {
    console.log('设置基金卡片颜色 (基于 compareWithAvg)');
    const fundCards = document.querySelectorAll('.fund-card');
    
    fundCards.forEach(card => {
        const fundHeader = card.querySelector('.fund-header');
        if (!fundHeader) return;

        // 颜色应由 createFundCard 根据 compareWithAvg 直接设置
        // 此函数可作为后备或移除
        if (!(fundHeader.classList.contains('positive') || fundHeader.classList.contains('negative'))) {
            console.warn(`卡片 ${card.dataset.fundCode} 缺少颜色类，createFundCard可能未正确设置`);
            // 可选：添加基于DOM的后备颜色设置逻辑，但不推荐
        }
    });
}

/**
 * 加载资产信息 (简化)
 * 主要功能变为更新左侧资产排名列表。
 */
async function loadAssetInfo() {
    if (typeof processedData === 'undefined' || !processedData.summary || !processedData.assetRankings) {
        console.warn('loadAssetInfo: 预处理数据不完整，无法更新左侧排名列表');
        return;
    }

    console.log('loadAssetInfo: 使用预处理数据更新左侧资产排名列表');
    
    const assetRankingList = document.querySelector('.asset-list');
    if (!assetRankingList) {
        console.error('未找到.asset-list元素，无法更新资产排名');
        return;
    }
    
    // 使用排名数据更新左侧列表项
    const rankingData = processedData.assetRankings.byUnit; // 或者根据当前排序选择
    if (rankingData) {
        rankingData.forEach(asset => {
            updateAssetRankingItem(
                asset.className,
                asset.unit,
                asset.percent * 100, // 转换为百分比
                asset.accProfitRate * 100 // 转换为百分比
            );
        });
    } else {
        console.warn('未在预处理数据中找到 assetRankings.byUnit，无法更新左侧排名');
    }
    
    console.log('左侧资产排名列表更新完成');
}

/**
 * 更新左侧资产排名列表中的项
 */
function updateAssetRankingItem(className, unit, percent, accProfitRate) {
    // console.log(`updateAssetRankingItem for ${className}: unit=${unit}, percent=${percent}, accProfitRate=${accProfitRate}`);
    const assetType = getAssetTypeFromClassName(className);
    const assetItem = document.querySelector(`.asset-item[data-asset-type="${assetType}"]`);
    
    if (!assetItem) {
        console.warn(`未找到资产项: ${className} (${assetType})`);
        return;
    }
    
    const sharesElem = assetItem.querySelector('.asset-shares');
    const ratioElem = assetItem.querySelector('.asset-ratio');
    const profitElem = assetItem.querySelector('.asset-profit');
    
    if (sharesElem) sharesElem.textContent = `${unit}份`;
    if (ratioElem) ratioElem.textContent = `(${percent.toFixed(2)}%)`;
    if (profitElem) {
        profitElem.textContent = `${accProfitRate >= 0 ? '+' : ''}${accProfitRate.toFixed(2)}%`;
        profitElem.className = `asset-profit ${accProfitRate >= 0 ? 'positive' : 'negative'}`;
    }
}

/**
 * 更新右侧资产详情头部 (现在由 generateAssetGroupsHTML 处理)
 */
// function updateAssetDetailHeader(className, unit, percent, accProfitRate) { ... }

// 资产类型映射 (辅助)
const assetTypeMap = {
    'A股': 'a-stock',
    '海外新兴市场股票': 'hk-stock',
    '海外债券': 'global-bond',
    '海外成熟市场股票': 'global-market',
    '境内债券': 'cn-bond',
    '现金': 'cash',
    '黄金': 'gold',
    '原油': 'oil'
};

/**
 * 获取资产类型标识符
 * 
 * 重要说明：
 * 此函数在整个系统中起关键作用，维护资产类名与HTML标识符的映射关系。
 * 必须确保HTML中的资产类型标识(data-asset-type)与此函数返回的值保持一致。
 * 
 * 特别注意：
 * - 境内债券统一使用 'cn-bond'
 * - 若添加新的资产类型，需要在此函数和CSS中添加对应的映射关系和样式
 * 
 * @param {string} className - 大类资产名称
 * @returns {string} 对应的资产类型标识符
 */
function getAssetTypeFromClassName(className) {
    return assetTypeMap[className] || className.toLowerCase().replace(/\s/g, '-');
}

/**
 * 加载并更新ETF卡片的操作信息 (简化)
 * 现在主要负责调用 updateOperationInfo 来填充最后操作，并进行排序。
 */
async function loadEtfCardData() {
    if (typeof processedData === 'undefined' || !processedData.assets) {
        console.warn('loadEtfCardData: 预处理数据不完整，无法更新操作信息。');
        return;
    }
    console.log('loadEtfCardData: 开始更新ETF卡片操作信息并排序');

    const allFundCards = document.querySelectorAll('.fund-card');
    
    if (allFundCards.length === 0) {
        console.warn('loadEtfCardData: 未找到任何ETF卡片元素。generateAssetGroupsHTML 是否已正确执行？');
        return;
    }
    console.log(`loadEtfCardData: 找到 ${allFundCards.length} 个ETF卡片，准备更新操作信息...`);

    allFundCards.forEach((card, index) => {
        try {
            const fundCode = card.dataset.fundCode;
            if (!fundCode) {
                console.warn(`卡片 ${index} 缺少 data-fund-code 属性，跳过更新`);
                return;
            }

            // 从预处理数据中查找匹配的基金
            let matchedFund = null;
            for (const asset of processedData.assets) {
                if (asset.funds) {
                    // 使用 .find() 并进行字符串比较（去除前导零）
                    matchedFund = asset.funds.find(f => String(f.fundCode).replace(/^0+/, '') === String(fundCode).replace(/^0+/, ''));
                    if (matchedFund) break;
                }
            }

            if (!matchedFund) {
                console.warn(`loadEtfCardData: 未在预处理数据中找到基金代码 ${fundCode} 的信息`);
                return;
            }
            
            // 准备操作信息
            let operationInfoForUpdate = null;
            if (matchedFund.latestOperation) {
                const isDisabled = card.classList.contains('disabled');
                operationInfoForUpdate = {
                    type: isDisabled ? '卖出' : matchedFund.latestOperation.tradeType,
                    shares: matchedFund.latestOperation.shares, 
                    date: matchedFund.latestOperation.navDate // 使用时间戳
                };
                // 设置排序用的 data 属性
                if (operationInfoForUpdate.date) {
                    card.dataset.operationDate = operationInfoForUpdate.date;
                }
            }

            // 调用 updateOperationInfo 更新显示
            updateOperationInfo(card, operationInfoForUpdate);
            
        } catch (error) {
            console.error(`更新卡片[${index}] (代码: ${fundCode}) 的操作信息时发生错误:`, error);
        }
    });

    console.log('所有ETF卡片操作信息更新尝试完成，开始按照最后操作时间排序...');
        
    // 对卡片进行排序
    sortFundCardsByOperationDate();
        
    console.log('所有ETF卡片已按最后操作时间排序完成');
}

/**
 * 对同一大类资产下的ETF卡片按照最后操作时间从近到远排序
 */
function sortFundCardsByOperationDate() {
    const assetGroups = document.querySelectorAll('.asset-group');
    
    assetGroups.forEach(group => {
        const fundCardsContainer = group.querySelector('.fund-cards');
        if (!fundCardsContainer) return;
        
        const activeFundCards = Array.from(fundCardsContainer.querySelectorAll('.fund-card:not(.disabled)'));
        const disabledFundCards = Array.from(fundCardsContainer.querySelectorAll('.fund-card.disabled'));
        
        const groupTitle = group.querySelector('.asset-group-header h4')?.textContent.trim() || '未知资产组';
        // console.log(`开始排序 "${groupTitle}" 下的${activeFundCards.length}张活跃ETF卡片和${disabledFundCards.length}张已清仓ETF卡片`);
        
        if (activeFundCards.length + disabledFundCards.length === 0) return;
        
        if (activeFundCards.length > 1) {
            activeFundCards.sort((a, b) => {
                const dateA = parseInt(a.dataset.operationDate || '0');
                const dateB = parseInt(b.dataset.operationDate || '0');
                return dateB - dateA; // 降序
            });
        }
        
        if (disabledFundCards.length > 1) {
            disabledFundCards.sort((a, b) => {
                const dateA = parseInt(a.dataset.operationDate || '0');
                const dateB = parseInt(b.dataset.operationDate || '0');
                return dateB - dateA; // 降序
            });
        }
        
        // 清空容器，然后按顺序重新添加
        fundCardsContainer.innerHTML = '';
        activeFundCards.forEach(card => fundCardsContainer.appendChild(card));
        disabledFundCards.forEach(card => fundCardsContainer.appendChild(card));
        
        // console.log(`"${groupTitle}" 下的ETF卡片已按最后操作时间排序完成`);
    });
}


/**
 * 更新卡片中的最后操作信息
 */
function updateOperationInfo(card, operationInfo) {
    const detailsElement = card.querySelector('.operation-details'); 
    const fundCodeForLog = card.dataset.fundCode || 'Unknown';

    if (!detailsElement) {
        if (!card.dataset.operationElementNotFound) {
            console.warn(`[${fundCodeForLog}] 无法找到 .operation-details 元素`);
            card.dataset.operationElementNotFound = 'true';
        }
        return;
    }

    if (operationInfo && operationInfo.date) {
        let dateString;
        
        if (typeof dateUtils !== 'undefined' && typeof dateUtils.convertTimestampToDate === 'function') {
            dateString = dateUtils.convertTimestampToDate(operationInfo.date);
        } else {
            console.warn(`[${fundCodeForLog}] dateUtils 不可用或缺少 convertTimestampToDate，使用内联格式化`);
            dateString = inlineDateUtils.convertTimestampToDate(operationInfo.date);
        }
        
        const type = operationInfo.type || '';
        const shares = operationInfo.shares !== undefined ? operationInfo.shares + '份' : '';
        const operationText = `${type} ${shares} (${dateString})`.trim();
        
        detailsElement.textContent = operationText;
        detailsElement.classList.remove('buy', 'sell');
        if (type === '买入') {
            detailsElement.classList.add('buy');
        } else if (type === '卖出') {
            detailsElement.classList.add('sell');
        }

    } else {
        detailsElement.textContent = '暂无操作'; 
        detailsElement.classList.remove('buy', 'sell');
        if (operationInfo) {
            console.warn(`[${fundCodeForLog}] 缺少操作日期或日期工具不可用`, operationInfo);
        } else {
             // console.log(`[${fundCodeForLog}] 无操作信息提供`);
        }
    }
}

/**
 * 使用XMLHttpRequest加载数据 (如果还需要)
 */
// function loadDataWithXHR() { ... }

/**
 * 更新资金状况双行显示
 * 
 * 重要说明：
 * 1. 此函数负责计算并显示页面顶部的持仓和现金信息
 * 2. 依赖HTML中的四个元素ID: 
 *    - total-position-units, total-position-percent
 *    - total-cash-units, total-cash-percent
 * 
 * @param {Object} data - 预处理数据
 */
function updateFundStatusDouble(data) {
    if (!data || !data.summary || !data.summary.assetDistribution) {
        console.warn('预处理数据不完整，无法更新资金状况显示');
        return;
    }
    
    const positionUnitsElem = document.getElementById('total-position-units');
    const positionPercentElem = document.getElementById('total-position-percent');
    const cashUnitsElem = document.getElementById('total-cash-units');
    const cashPercentElem = document.getElementById('total-cash-percent');
    
    if (!positionUnitsElem || !positionPercentElem || !cashUnitsElem || !cashPercentElem) {
        console.warn('未找到资金状况显示元素');
        return;
    }
    
    let totalPositionUnits = 0;
    let cashUnits = 0;
    const totalUnits = 150; // 150计划总份数
    
    const assetDistribution = data.summary.assetDistribution;
    
    for (const className in assetDistribution) {
        const assetData = assetDistribution[className];
        if (className === '现金') {
            cashUnits = assetData.unit;
        } else {
            totalPositionUnits += assetData.unit;
        }
    }
    
    const positionPercent = (totalPositionUnits / totalUnits * 100).toFixed(2);
    const cashPercent = (cashUnits / totalUnits * 100).toFixed(2);
    
    positionUnitsElem.textContent = totalPositionUnits;
    positionPercentElem.textContent = positionPercent + '%';
    cashUnitsElem.textContent = cashUnits;
    cashPercentElem.textContent = cashPercent + '%';
    
    console.log(`更新资金状况: 持仓${totalPositionUnits}份(${positionPercent}%), 现金${cashUnits}份(${cashPercent}%)`);
}

/**
 * 完全动态生成资产组HTML结构
 * @param {Array} processedAssets - 预处理后的资产数据数组
 */
function generateAssetGroupsHTML(processedAssets) {
    console.log('开始动态生成资产组HTML结构 (使用预处理数据)');
    
    if (!processedAssets || !Array.isArray(processedAssets)) {
        console.error('预处理资产数据格式不正确，无法生成资产组HTML');
        return;
    }
    
    const fundCardsContainer = document.querySelector('.fund-cards-container');
    if (!fundCardsContainer) {
        console.error('未找到fund-cards-container容器，无法生成资产组HTML');
        return;
    }
    
    fundCardsContainer.innerHTML = '';
    
    processedAssets.forEach(assetClass => {
        if (!assetClass.funds || !Array.isArray(assetClass.funds)) return;
        if (assetClass.className === '现金') {
            // console.log('跳过现金资产 - 不在"大类资产详情"中显示现金');
            return;
        }
        
        const className = assetClass.className;
        const assetTypeCode = getAssetTypeFromClassName(className);
        const unit = assetClass.unit || 0;
        const percent = assetClass.percent || 0;
        const accProfitRate = assetClass.accProfitRate || 0;
        
        // 查找最后操作日期 (如果有)
        console.log(`[${className}] Checking latestOperation:`, assetClass.latestOperation); // Log the operation object
        let latestOpDateStr = '暂无操作';
        if (assetClass.latestOperation && assetClass.latestOperation.timestamp) { 
            const timestamp = assetClass.latestOperation.timestamp;
            console.log(`[${className}] Found timestamp: ${timestamp}`); // Log the timestamp
            if (typeof dateUtils !== 'undefined' && typeof dateUtils.convertTimestampToDate === 'function') {
                latestOpDateStr = dateUtils.convertTimestampToDate(timestamp);
                console.log(`[${className}] Converted via dateUtils: ${latestOpDateStr}`); // Log conversion result
            } else {
                latestOpDateStr = inlineDateUtils.convertTimestampToDate(timestamp);
                console.log(`[${className}] Converted via inlineDateUtils: ${latestOpDateStr}`); // Log conversion result
            }
        } else {
            console.log(`[${className}] No valid latestOperation.timestamp found.`); // Log if no timestamp
        }

        const assetGroupDiv = document.createElement('div');
        assetGroupDiv.className = 'asset-group';
        assetGroupDiv.dataset.assetType = assetTypeCode;
        assetGroupDiv.innerHTML = `
            <div class="asset-group-header">
                <div class="title-section">
                    <span class="asset-icon ${assetTypeCode}"></span>
                    <h4>${className} <span class="detail-shares">${unit}份 (${(percent * 100).toFixed(2)}%)</span></h4>
                </div>
                <div class="detail-info">
                    <span class="detail-profit ${accProfitRate >= 0 ? 'positive' : 'negative'}">累计收益率 ${accProfitRate >= 0 ? '+' : ''}${(accProfitRate * 100).toFixed(2)}%</span>
                    <span class="detail-date">最后操作：${latestOpDateStr}</span> 
                </div>
            </div>
            <div class="fund-cards"></div>
        `;
        
        fundCardsContainer.appendChild(assetGroupDiv);
        
        const fundCardsDiv = assetGroupDiv.querySelector('.fund-cards');
        
        assetClass.funds.forEach(fund => {
            if (fund.isCash) return;
            const fundCard = createFundCard(fund);
            if (fundCard) {
                fundCardsDiv.appendChild(fundCard);
            }
        });
    });
    
    console.log('资产组HTML结构生成完成 (使用预处理数据)');
}

/**
 * 创建单个基金卡片 (使用预处理数据)
 * @param {Object} fund - 预处理后的基金数据对象
 * @returns {Element|null} - 基金卡片DOM元素或null
 */
function createFundCard(fund) {
    // console.log(`[${fund?.fundCode || 'Unknown'}] createFundCard called. Fund data:`, fund);
    if (!fund || !fund.fundCode) {
        console.warn('[createFundCard] 无效的基金数据输入:', fund);
        return null;
    }
    
    const planUnit = fund.planUnit || 0;
    const isActive = planUnit > 0;
    
    const cardDiv = document.createElement('div');
    cardDiv.className = `fund-card${!isActive ? ' disabled' : ''}`;
    cardDiv.dataset.fundCode = fund.fundCode;
    
    let headerClass = ''; // Default to no color class
    if (isActive && fund.compareWithAvg !== undefined && fund.compareWithAvg !== null) {
        const compareAvg = fund.compareWithAvg; // 已经是百分比
        headerClass = compareAvg >= 0 ? 'positive' : 'negative';
    } else if (isActive) {
        // console.warn(`[${fund.fundCode}] compareWithAvg is missing or invalid:`, fund.compareWithAvg, ". Header color not set.");
    }

    const fundName = (fund.variety ? fund.variety + '-' : '') + fund.fundName;
    const navDateStr = fund.navDate || ''; // 预处理数据中 navDate 已经是 YYYY-MM-DD

    let innerHtml = `
        <div class="fund-header${headerClass ? ' ' + headerClass : ''}">
            <div class="fund-title-group">
                <span class="fund-title" title="${fundName}">${fundName}</span>
                <span class="fund-code">${fund.fundCode}</span>
            </div>
        </div>
        <div class="fund-data">
            <div class="fund-data-row">
                <span class="fund-label">最后操作</span>
                <span class="fund-value operation-details">--</span> 
            </div>
    `;
    
    innerHtml += `
        <div class="fund-data-row">
            <span class="fund-label">份数/占比</span>
            <span class="fund-value">${isActive ? planUnit + '份 / ' + (fund.percent * 100).toFixed(2) + '%' : '已清仓 / 0%'}</span>
        </div>
    `;
    
    const accProfit = fund.accProfit || 0;
    const accProfitClass = accProfit >= 0 ? 'positive' : 'negative';
    innerHtml += `
        <div class="fund-data-row">
            <span class="fund-label">累计收益率</span>
            <span class="fund-value ${accProfitClass}">${accProfit >= 0 ? '+' : ''}${(accProfit * 100).toFixed(2)}%</span>
        </div>
    `;
    
    if (isActive) {
        innerHtml += `
            <div class="fund-data-row">
                <span class="fund-label">平均持有单价</span>
                <span class="fund-value">${fund.unitValue ? fund.unitValue.toFixed(4) : '--'}</span>
            </div>
        `;
        
        if (fund.historicalLow && fund.historicalLow > 0) {
            innerHtml += `
                <div class="fund-data-row">
                    <span class="fund-label">历史最低单价</span>
                    <span class="fund-value">${fund.historicalLow.toFixed(4)}</span>
                </div>
            `;
        } else {
             // 不显示此行
        }
    }
    
    innerHtml += `
        <div class="fund-data-row">
            <span class="fund-label">最新净值</span>
            <span class="fund-value">${fund.nav ? parseFloat(fund.nav).toFixed(4) : '--'} ${navDateStr ? '(' + navDateStr + ')' : ''}</span>
        </div>
    `;
    
    if (isActive) {
        if (fund.compareWithAvg !== undefined && fund.unitValue) {
            const percentDiff = fund.compareWithAvg; // 已经是百分比
            const diffClass = percentDiff >= 0 ? 'positive' : 'negative';
            innerHtml += `
                <div class="fund-data-row">
                    <span class="fund-label">现值对比平均单价</span>
                    <span class="fund-value ${diffClass}">${percentDiff >= 0 ? '+' : ''}${percentDiff.toFixed(2)}%</span>
                </div>
            `;
        }
        
        if (fund.compareWithLowest !== undefined && fund.historicalLow) {
            const percentDiffLow = fund.compareWithLowest; // 已经是百分比
            const diffClassLow = percentDiffLow >= 0 ? 'positive' : 'negative';
            innerHtml += `
                <div class="fund-data-row">
                    <span class="fund-label">现值对比历史最低单价</span>
                    <span class="fund-value ${diffClassLow}">${percentDiffLow >= 0 ? '+' : ''}${percentDiffLow.toFixed(2)}%</span>
                </div>
            `;
        } else if (fund.historicalLow) {
             // 不显示此行
        }
    }
    
    innerHtml += `</div>`;
    cardDiv.innerHTML = innerHtml;

    return cardDiv;
}

// --- Function Definitions End ---


// --- Global Variables and Initial Setup Start ---

// 全局变量 (如果需要)
let adjustData = []; // 可能不再需要全局，取决于是否还有旧代码依赖

// 添加内联的日期工具函数作为备份
const inlineDateUtils = {
    /**
     * 将毫秒时间戳转换为标准日期格式（YYYY-MM-DD）
     * @param {number} timestamp - 毫秒级时间戳
     * @returns {string} 格式化的日期字符串
     */
    convertTimestampToDate: function(timestamp) {
        try {
            timestamp = parseInt(timestamp);
            if (isNaN(timestamp)) {
                // console.warn('时间戳格式无效:', timestamp);
                return '--';
            }
            const date = new Date(timestamp);
            // 尝试使用Intl确保时区正确性
            try {
                 const formatter = new Intl.DateTimeFormat('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    timeZone: 'Asia/Shanghai' // 明确指定中国时区
                });
                return formatter.format(date).replace(/\//g, '-');
            } catch (e) {
                 console.warn('Intl.DateTimeFormat 不可用或出错，使用 Date 方法替代:', e);
                 // 使用 getFullYear, getMonth, getDate - 注意这可能受浏览器本地时区影响
                 const year = date.getFullYear();
                 const month = String(date.getMonth() + 1).padStart(2, '0');
                 const day = String(date.getDate()).padStart(2, '0');
                 return `${year}-${month}-${day}`;
            }
           
        } catch (error) {
            console.error('日期转换错误:', error);
            return '--';
        }
    }
};

// 确保全局dateUtils对象存在，如果不存在则使用内联版本
// 这段逻辑现在移动到 DOMContentLoaded 内部，以处理异步加载
// if (typeof window.dateUtils === 'undefined') {
//     window.dateUtils = inlineDateUtils;
//     console.log('初始设置：未找到dateUtils.js，使用内联版本');
// }

// --- Global Variables and Initial Setup End ---


// --- DOMContentLoaded Event Listener Start ---

document.addEventListener('DOMContentLoaded', function() {
    // 优先使用内联日期工具，然后尝试加载外部脚本并替换（如果成功）
    if (typeof window.dateUtils === 'undefined') {
        window.dateUtils = inlineDateUtils;
        console.log('初始设置：使用内联日期工具');
    }

    // 尝试异步加载 dateUtils.js
    loadDateUtilsScript().then(() => {
        // 加载成功（或者脚本认为已加载但未定义 window.dateUtils）
        // 如果 dateUtils.js 正确加载并定义了 window.dateUtils，它将覆盖内联版本
        console.log('dateUtils.js 加载尝试完成');
        initializePageContent(); // 调用核心初始化逻辑
    }).catch(error => {
        // 加载失败
        console.error('dateUtils.js 加载失败，将完全依赖内联日期工具:', error);
        // 仍然继续初始化，因为 window.dateUtils 已经是内联版本
        initializePageContent(); // 调用核心初始化逻辑
    });
});

/**
 * 页面核心初始化逻辑
 * 在 DOMContentLoaded 和 dateUtils 加载尝试后调用
 */
function initializePageContent() {
    // 检查预处理数据
    if (typeof processedData !== 'undefined' && processedData.assets) {
        console.log('预处理数据可用，开始初始化页面内容');

        // 1. Basic page setup (needs DOM ready)
        initPlanPage(); // Sets up tabs, sort controls etc.

        // 2. Generate Asset Groups and Fund Cards using PROCESSED data
        generateAssetGroupsHTML(processedData.assets);

        // 3. Update asset ranking list on the left (uses processedData)
        loadAssetInfo(); // Now primarily updates the left ranking list
        
        // 4. Update operation details in cards and sort
        loadEtfCardData(); // Simplified: focuses on updateOperationInfo and sorting

        // 5. Apply colors after cards are created and data populated
        // setTimeout(setupFundCardColors, 100); // 短暂延迟可能有助于确保DOM更新
        setupFundCardColors(); // 尝试立即应用
        
        // 6. Apply initial sort based on URL or default
        const initialSort = getSortParam();
        sortAssets(initialSort);

        // 7. Select initial asset based on URL or default (first item)
        const initialAsset = getSelectedAssetType();
        if (initialAsset) {
            showAssetDetails(initialAsset);
        } else {
            // Select the first asset in the sorted list if none specified
            const firstAssetItem = document.querySelector('.asset-list .asset-item');
            if (firstAssetItem) {
                const firstAssetType = firstAssetItem.dataset.assetType;
                if (firstAssetType !== 'cash') { // Don't auto-select cash
                    showAssetDetails(firstAssetType);
                }
            }
        }
        
    } else {
         console.error('预处理数据 (processedData) 未定义或无效，页面无法完全初始化！');
         // Consider showing a user-friendly error message on the page
         const container = document.querySelector('.fund-cards-container');
         if (container) {
             container.innerHTML = '<p style="color: red; text-align: center; margin-top: 20px;">关键数据加载失败，无法显示内容。请检查 processed-data.js 文件或联系管理员。</p>';
         }
         // alert('关键数据加载失败...'); // Avoid alert if possible
    }
}

// --- DOMContentLoaded Event Listener End --- 
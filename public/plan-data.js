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

/**
 * 计划数据页面JavaScript
 * 用于处理ETF计划数据展示、交互和数据加载
 */

// 全局变量，用于存储调整数据
let adjustData = [];

document.addEventListener('DOMContentLoaded', function() {
    // 加载dateUtils.js
    loadDateUtilsScript().then(() => {
        console.log('日期工具已加载');
        
        // 初始化页面
        initPlanPage(); // initPlanPage now relies on processedData, call it first
        
        // 设置基金卡片颜色 - 可以稍后调用
        // setupFundCardColors(); 

        // 加载大类资产信息 - 依赖 processedData 或 fetch, 可以在 initPlanPage 后
        loadAssetInfo();

        // 加载大类资产信息和最后操作时间 - 依赖 adjust.json, 可以在 initPlanPage 后
        loadAssetLatestOperationTime();
        
        // 加载ETF卡片数据 - ***必须在 dateUtils 加载后执行***
        loadEtfCardData(); 

        // 将颜色设置移到数据加载后，确保卡片已生成
        setTimeout(setupFundCardColors, 1000); // Increase delay slightly if needed

    }).catch(error => {
        console.error('日期工具加载失败:', error);
        // 如果 dateUtils 加载失败，显示错误信息，阻止进一步执行依赖它的代码
        alert('关键日期工具加载失败，页面功能可能不完整！请检查网络连接或刷新重试。');
        // 移除依赖 dateUtils 的调用
        // initPlanPage();
        // setupFundCardColors();
        // loadAssetInfo();
        // loadAssetLatestOperationTime();
        // loadEtfCardData();
    });
});

/**
 * 加载dateUtils.js脚本
 * @returns {Promise} - 加载完成的Promise
 */
function loadDateUtilsScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'dateUtils.js';
        script.onload = () => {
            console.log('dateUtils.js 加载成功');
            resolve();
        };
        script.onerror = (err) => {
            console.error('dateUtils.js 加载失败:', err);
            reject(err);
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
        
        // 设置一个短暂的延迟，确保DOM已完全加载
        setTimeout(() => {
            // 网格策略页面不需要更新资金状况和资产排名等内容
            if (!isGridPlan) {
                // 更新资金状况双行显示
                updateFundStatusDouble(processedData);
                
                // 如果有预处理好的资产排名数据，使用它来更新UI
                if (processedData.assetRankings && processedData.assetRankings.byUnit) {
                    // 更新每个资产项的数据
                    processedData.assetRankings.byUnit.forEach(asset => {
                        // 更新资产项
                        updateAssetRankingItem(
                            asset.className,
                            asset.unit,
                            asset.percent * 100, // 转换为百分比
                            asset.accProfitRate * 100 // 转换为百分比
                        );
                    });
                } else {
                    // 如果没有assetRankings，fallback到原来的方法
                    console.log('未找到预处理的资产排名数据，使用assetDistribution');
                    const assetDistribution = processedData.summary.assetDistribution;
                    
                    // 遍历所有大类资产，更新资产排名列表
                    for (const className in assetDistribution) {
                        const assetData = assetDistribution[className];
                        updateAssetRankingItem(
                            className, 
                            assetData.unit, 
                            assetData.percent * 100, 
                            assetData.accProfitRate * 100
                        );
                    }
                }
            }
            
            // 所有页面都需要加载ETF卡片数据
            loadEtfCardData();
            
            // 设置基金卡片颜色
            setTimeout(setupFundCardColors, 500);
        }, 100);
    } else {
        console.warn('未找到预处理数据，将尝试通过fetch或XHR加载数据');
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
    
    // 加载初始数据 (移除，因为数据应来自 processed-data.js)
    // loadPlanData();
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
 * 加载计划数据 (此函数可能不再需要，因为数据应来自 processed-data.js)
 */
async function loadPlanData() {
    console.log('加载计划数据');
    
    try {
        // 首先检查localStorage中是否有更新的数据
        const storedData = localStorage.getItem('fundData');
        let fundData;
        
        if (storedData) {
            console.log('使用localStorage中的数据');
            fundData = JSON.parse(storedData);
        } else {
            // 如果没有，则从文件加载
            console.log('从文件加载数据');
            const response = await fetch('data/fund-data.json');
            fundData = await response.json();
        }
        
        // 更新UI以显示数据
        updateFundStatus(fundData.fundStatus, fundData.lastUpdate);
        
        // 获取排序方式
        const sortBy = getSortParam();
        updateAssetList(fundData.assets, sortBy);
        
        // 获取选中的资产类型，如果有
        const selectedAssetType = getSelectedAssetType();
        if (selectedAssetType) {
            // 找到相应的资产数据
            const selectedAsset = fundData.assets.find(asset => asset.type === selectedAssetType);
            if (selectedAsset) {
                loadAssetDetails(selectedAsset);
            }
        }
        
        console.log('数据加载完成');
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

/**
 * 更新资金状况区域
 */
function updateFundStatus(fundStatus, lastUpdate) {
    // 更新资金数据
    document.querySelector('.invested-amount').textContent = `¥${fundStatus.invested.toLocaleString()}`;
    document.querySelector('.cash-amount').textContent = `¥${fundStatus.cash.toLocaleString()}`;
    document.querySelector('.ratio-value').textContent = `${fundStatus.ratio}%`;
    
    // 更新最后更新时间
    const dateElem = document.querySelector('.update-date');
    if (dateElem) {
        dateElem.textContent = `数据更新：${lastUpdate}`;
    }
}

/**
 * 更新资产列表
 */
function updateAssetList(assets, sortBy = 'shares') {
    console.log(`按${sortBy}排序资产列表`);
    
    // 对资产进行排序
    const sortedAssets = [...assets].sort((a, b) => {
        if (sortBy === 'shares') {
            return b.shares - a.shares; // 份数降序
        } else {
            return b.profit - a.profit; // 收益率降序
        }
    });
    
    // 获取资产列表容器
    const assetList = document.querySelector('.asset-list');
    if (!assetList) return;
    
    // 清空现有内容
    assetList.innerHTML = '';
    
    // 添加新的资产项
    sortedAssets.forEach(asset => {
        const assetItem = document.createElement('div');
        assetItem.className = 'asset-item';
        assetItem.dataset.type = asset.type;
        
        // 根据收益率设置样式
        const profitClass = asset.profit >= 0 ? 'positive' : 'negative';
        
        assetItem.innerHTML = `
            <div class="asset-icon ${asset.icon}"></div>
            <div class="asset-info">
                <div class="asset-name">${asset.name}</div>
                <div class="asset-data">
                    <span class="asset-shares">${asset.shares}份</span>
                    <span class="asset-ratio">${asset.ratio}%</span>
                </div>
            </div>
            <div class="asset-profit ${profitClass}">${asset.profit}%</div>
        `;
        
        // 添加点击事件
        assetItem.addEventListener('click', () => {
            // 移除之前选中的项
            document.querySelectorAll('.asset-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
            
            // 标记当前项为选中
            assetItem.classList.add('selected');
            
            // 加载资产详情
            loadAssetDetails(asset);
            
            // 更新URL参数
            updateUrlParams('asset', asset.type);
        });
        
        assetList.appendChild(assetItem);
    });
    
    // 如果URL中有选定的资产，选中它
    const selectedAssetType = getSelectedAssetType();
    if (selectedAssetType) {
        const selectedItem = assetList.querySelector(`.asset-item[data-type="${selectedAssetType}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }
}

/**
 * 加载资产详情
 */
function loadAssetDetails(asset) {
    console.log(`加载资产[${asset.name}]详情`);
    
    // 更新资产详情容器标题
    const detailTitle = document.querySelector('.asset-detail-title');
    if (detailTitle) {
        detailTitle.innerHTML = `
            <span class="asset-icon ${asset.icon}"></span>
            <h3>${asset.name} <span class="detail-shares">${asset.shares}份</span></h3>
        `;
    }
    
    // 更新资产详情容器内容
    const detailContent = document.querySelector('.asset-detail-content');
    if (!detailContent) return;
    
    // 清空现有内容
    detailContent.innerHTML = '';
    
    // 添加每个基金的卡片
    asset.funds.forEach(fund => {
        // 根据预估价格差设置样式
        const priceClass = fund.priceDiff >= 0 ? 'positive' : 'negative';
        const headerClass = fund.priceDiff >= 0 ? 'positive' : 'negative';
        const priceSignChar = fund.priceDiff >= 0 ? '+' : '';
        
        // 确保基金代码始终显示为 6 位数字
        const fundCode = String(fund.code).padStart(6, '0');
        
        const fundCard = document.createElement('div');
        fundCard.className = 'fund-card';
        fundCard.innerHTML = `
            <div class="fund-header ${headerClass}">
                <div class="fund-title-group">
                    <span class="fund-title">${fund.name}</span>
                    <span class="fund-code">${fundCode}</span>
                </div>
            </div>
            <div class="fund-data">
                <div class="fund-data-row">
                    <span class="fund-label">场内参考代码</span>
                    <span class="fund-value">${fund.inMarketCode || '无'}</span>
                </div>
                <div class="fund-data-row">
                    <span class="fund-label">E大平均持有价格</span>
                    <span class="fund-value">${fund.avgPrice}</span>
                </div>
                <div class="fund-data-row">
                    <span class="fund-label">E大持仓份数</span>
                    <span class="fund-value">${fund.shares}</span>
                </div>
                <div class="fund-data-row">
                    <span class="fund-label">持仓占比</span>
                    <span class="fund-value">${fund.ratio}%</span>
                </div>
                <div class="fund-data-row">
                    <span class="fund-label">预估净值</span>
                    <span class="fund-value">${fund.estValue}</span>
                </div>
                <div class="fund-data-row">
                    <span class="fund-label">预估价格差</span>
                    <span class="fund-value ${priceClass}">${priceSignChar}${fund.priceDiff}%</span>
                </div>
            </div>
        `;
        
        detailContent.appendChild(fundCard);
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
        const assetItems = Array.from(document.querySelectorAll('.asset-item'));
        assetItems.forEach(item => item.classList.remove('active'));
        
        // 遍历排序后的资产，更新资产排名列表
        sortedAssets.forEach(asset => {
            const assetType = getAssetTypeFromClassName(asset.className);
            const assetItem = document.querySelector(`.asset-item[data-asset-type="${assetType}"]`);
            
            if (assetItem) {
                // 将该项移动到列表末尾，实现排序
                assetList.appendChild(assetItem);
                
                // 更新份数和占比显示
                updateAssetRankingItem(
                    asset.className,
                    asset.unit,
                    asset.percent * 100, // 转换为百分比
                    asset.accProfitRate * 100 // 转换为百分比
                );
            }
        });
        
        // 选中第一个资产
        const firstAssetItem = assetList.querySelector('.asset-item');
        if (firstAssetItem) {
            firstAssetItem.classList.add('active');
            const firstAssetType = firstAssetItem.getAttribute('data-asset-type');
            showAssetDetails(firstAssetType);
        }
        
        // 更新URL参数
        updateUrlParams('sort', sortType);
    } else {
        // 兼容旧代码：如果没有预处理数据，使用原来的DOM操作方式排序
        console.warn('未找到预处理的资产排名数据，使用DOM操作排序');
        
        // 获取所有资产项
        const assetList = document.querySelector('.asset-list');
        const assetItems = Array.from(document.querySelectorAll('.asset-item'));
        
        // 根据排序方式进行排序
        if (sortType === 'shares') {
            // 按份数排序
            assetItems.sort((a, b) => {
                const aShares = a.querySelector('.asset-shares').textContent;
                const bShares = b.querySelector('.asset-shares').textContent;
                
                // 提取数字部分，排除"份"和"%"
                const aMatch = aShares.match(/(\d+)份/);
                const bMatch = bShares.match(/(\d+)份/);
                
                // 已清仓的项目放最后
                if (aShares.includes('已清仓')) return 1;
                if (bShares.includes('已清仓')) return -1;
                
                return bMatch && aMatch ? parseInt(bMatch[1]) - parseInt(aMatch[1]) : 0;
            });
        } else if (sortType === 'profit') {
            // 按收益率排序
            assetItems.sort((a, b) => {
                const aProfit = a.querySelector('.asset-profit').textContent;
                const bProfit = b.querySelector('.asset-profit').textContent;
                
                // 提取数字部分，包括"+"或"-"符号
                const aMatch = aProfit.match(/([\+\-]\d+\.\d+)%/);
                const bMatch = bProfit.match(/([\+\-]\d+\.\d+)%/);
                
                return bMatch && aMatch ? parseFloat(bMatch[1]) - parseFloat(aMatch[1]) : 0;
            });
        }
        
        // 重新添加排序后的资产项
        assetItems.forEach(item => {
            assetList.appendChild(item);
        });
        
        // 更新展示的详情，选中第一个资产
        if (assetItems.length > 0) {
            // 移除所有active类
            assetItems.forEach(item => item.classList.remove('active'));
            
            // 给第一个添加active类
            assetItems[0].classList.add('active');
            
            // 获取第一个资产的类型并显示其详情
            const firstAssetType = assetItems[0].getAttribute('data-asset-type');
            showAssetDetails(firstAssetType);
        }
        
        // 更新URL参数
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
    // 如果是现金资产，不做任何操作
    if (assetType === 'cash') {
        console.log('现金资产无详情可显示，已跳过操作');
        return;
    }
    
    // 标记选中的资产项
    const assetItems = document.querySelectorAll('.asset-item');
    assetItems.forEach(item => {
        if (item.dataset.assetType === assetType) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 滚动到对应的资产组
    scrollToAssetGroup(assetType);
    
    // 更新URL参数
    updateUrlParams('asset', assetType);
}

/**
 * 滚动到对应的资产组
 * @param {string} assetType - 资产类型
 */
function scrollToAssetGroup(assetType) {
    // 如果是现金资产，不执行滚动
    if (assetType === 'cash') {
        return;
    }
    
    console.log(`尝试滚动到资产组: ${assetType}`);
    
    // 获取所有资产组
    const assetGroups = document.querySelectorAll('.asset-group');
    let targetGroup = null;
    
    // 遍历所有资产组，查找匹配的资产类型
    for (const group of assetGroups) {
        const assetIcon = group.querySelector('.asset-icon');
        if (assetIcon && assetIcon.classList.contains(assetType)) {
            targetGroup = group;
            console.log(`找到匹配的资产组: ${assetType}`);
            break;
        }
    }
    
    // 如果未找到匹配的资产组，尝试使用特殊处理
    if (!targetGroup && assetType === 'cn-bond') {
        console.log('使用特殊处理查找境内债券资产组');
        // 查找标题中包含"境内债券"的资产组
        for (const group of assetGroups) {
            const title = group.querySelector('.asset-group-header h4');
            if (title && title.textContent.includes('境内债券')) {
                targetGroup = group;
                console.log('找到境内债券资产组');
                break;
            }
        }
    }
    
    // 如果找到目标资产组，滚动到其位置
    if (targetGroup) {
        targetGroup.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log(`已滚动到资产组: ${assetType}`);
    } else {
        console.warn(`未找到资产组: ${assetType}`);
    }
}

/**
 * 设置基金卡片颜色
 * 根据现值对比平均单价设置卡片标题栏的颜色
 */
function setupFundCardColors() {
    console.log('设置基金卡片颜色');
    // 查找所有基金卡片
    const fundCards = document.querySelectorAll('.fund-card');
    
    fundCards.forEach(card => {
        // 查找卡片中的"现值对比平均单价"元素
        const priceChangeElements = card.querySelectorAll('.fund-data-row .fund-label');
        let priceChangeElement = null;
        
        // 查找包含"现值对比平均单价"文本的标签元素
        for (let i = 0; i < priceChangeElements.length; i++) {
            if (priceChangeElements[i].textContent.includes('现值对比平均单价')) {
                // 获取对应的值元素
                priceChangeElement = priceChangeElements[i].nextElementSibling;
                break;
            }
        }
        
        // 如果找到了"现值对比平均单价"元素
        if (priceChangeElement) {
            // 获取卡片的标题元素
            const fundHeader = card.querySelector('.fund-header');
            
            // 从文本中提取百分比值
            const percentText = priceChangeElement.textContent;
            const percentMatch = percentText.match(/([+-]?\d+(\.\d+)?)%/);
            
            if (percentMatch) {
                const percentValue = parseFloat(percentMatch[1]);
                
                // 根据百分比的正负值设置对应的类名
                if (percentValue >= 0) {
                fundHeader.classList.add('positive');
                fundHeader.classList.remove('negative');
                } else {
                fundHeader.classList.add('negative');
                fundHeader.classList.remove('positive');
                }
            }
        }
    });
}

/**
 * 更新HTML中各大类资产的最后操作日期
 */
function updateAssetOperationDates(assetOperationTimes) {
    const assetGroups = document.querySelectorAll('.asset-group');
    
    assetGroups.forEach(group => {
        const titleElement = group.querySelector('.asset-group-header h4');
        if (!titleElement) return;
        
        // 提取标题中的资产类型
        let assetType = titleElement.textContent.split(' ')[0];
        
        // 处理特殊情况
        if (assetType === '现金(未投入部分)') {
            assetType = '现金';
        } else if (assetType.includes('境内')) {
            assetType = '境内债券';
        }
        
        // 如果找到匹配的资产类型，更新日期
        if (assetOperationTimes.hasOwnProperty(assetType)) {
            const dateElement = group.querySelector('.detail-date');
            if (dateElement) {
                dateElement.textContent = assetOperationTimes[assetType];
            }
        }
    });
}

/**
 * 加载大类资产的最后操作时间
 * 通过分析调整记录来确定各个大类资产的最后操作时间
 */
async function loadAssetLatestOperationTime() {
    try {
        let adjustmentData;
        
        // 尝试通过fetch加载数据
        try {
            // 从adjust.json获取调整记录
            const response = await fetch('/data/adjust.json', { // 修改路径
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            });
            adjustmentData = await response.json();
        } catch (fetchError) {
            console.warn('通过fetch加载调整数据失败，尝试使用内联数据:', fetchError);
            
            // 如果fetch失败（可能是因为CORS限制），使用内联数据或备用方法
            if (window.adjustData) {
                // 如果loadEtfCardData已经加载了数据
                console.log('使用window.adjustData数据');
                adjustmentData = window.adjustData;
            } else {
                try {
                    // 使用XMLHttpRequest加载
                    const result = await loadAdjustDataWithXHR();
                    adjustmentData = result;
                } catch (xhrError) {
                    console.error('备用数据加载方法也失败:', xhrError);
                    throw new Error('无法加载调整数据：' + xhrError.message);
                }
            }
        }
        
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
        if (adjustmentData && Array.isArray(adjustmentData)) {
            adjustmentData.forEach(adjustment => {
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
        } else {
            console.error('调整数据格式不正确');
        }
        
        // 将时间戳转换为可读日期
        for (const assetType in assetOperationTimes) {
            if (assetOperationTimes[assetType] > 0) {
                assetOperationTimes[assetType] = convertNavdataToDate(assetOperationTimes[assetType]);
            } else {
                assetOperationTimes[assetType] = '暂无操作';
            }
        }
        
        // 更新HTML中的日期信息
        updateAssetOperationDates(assetOperationTimes);
        
        console.log('资产最后操作时间加载完成', assetOperationTimes);
    } catch (error) {
        console.error('获取资产最后操作时间失败:', error);
    }
}

/**
 * 使用XMLHttpRequest加载调整数据
 */
function loadAdjustDataWithXHR() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.overrideMimeType("application/json");
        xhr.open('GET', 'adjust.json', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve(data);
                    } catch (error) {
                        reject(new Error('调整数据解析失败: ' + error.message));
                    }
                } else {
                    reject(new Error('加载调整数据失败: ' + xhr.status));
                }
            }
        };
        xhr.send(null);
    });
}

// 将adjustTxnDate数值转换为可读的日期格式
function convertNavdataToDate(timestamp) {
    if (!timestamp) return '未知日期';
    
    // 创建日期对象
    const date = new Date(timestamp);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
        return '无效日期';
    }
    
    // 格式化为YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 加载资产信息
 * 从etf.json中获取各大类资产的信息并更新界面显示
 */
async function loadAssetInfo() {
    try {
        let etfData;
        
        // 尝试通过fetch加载数据
        try {
            // 从etf.json获取ETF数据
            const response = await fetch('/data/etf.json', { // 修改路径
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            });
            etfData = await response.json();
        } catch (fetchError) {
            console.warn('通过fetch加载ETF数据失败，尝试使用内联数据:', fetchError);
            
            // 如果fetch失败（可能是因为CORS限制），使用内联数据或备用方法
            if (window.etfData) {
                // 如果已经有加载好的ETF数据
                console.log('使用window.etfData数据');
                etfData = window.etfData;
            } else {
                try {
                    // 使用XMLHttpRequest加载
                    const result = await loadEtfDataWithXHR();
                    etfData = result;
                } catch (xhrError) {
                    console.error('备用数据加载方法也失败:', xhrError);
                    throw new Error('无法加载ETF数据：' + xhrError.message);
                }
            }
        }
        
        if (!etfData || !etfData.composition) {
            console.error('ETF数据格式不正确');
            return;
        }
        
        // 将ETF数据保存到全局变量，供其他函数使用
        window.etfData = etfData;
        
        // 检查页面结构
        const assetRankingList = document.querySelector('.asset-list');
        const fundCardsContainer = document.querySelector('.fund-cards-container');
        
        if (!assetRankingList) {
            console.error('未找到.asset-list元素，无法更新资产排名');
        }
        
        if (!fundCardsContainer) {
            console.error('未找到.fund-cards-container元素，无法更新资产详情');
        }
        
        // 更新左侧资产排名列表
        if (assetRankingList) {
            // 清空现有内容（可选，如果你想完全重建）
            // assetRankingList.innerHTML = '';
            
            // 遍历所有大类资产
            etfData.composition.forEach(assetClass => {
                const className = assetClass.className;
                const unit = assetClass.unit;
                const percent = assetClass.percent;
                
                // 获取累计收益率
                let accProfitRate = assetClass.accProfitRate;
                
                // 特殊处理现金类资产，从compList中获取accProfit
                if (assetClass.isCash && className === '现金' && 
                    assetClass.compList && assetClass.compList.length > 0) {
                    // 使用现金compList中的accProfit
                    accProfitRate = assetClass.compList[0].accProfit || 0;
                }
                
                // 更新左侧资产排名列表 - 确保乘以100
                updateAssetRankingItem(className, unit, percent * 100, accProfitRate * 100);
            });
        }
        
        // 完全动态生成右侧资产详情部分
        if (fundCardsContainer) {
            // 使用新的方法动态生成资产组HTML
            generateAssetGroupsHTML(etfData);
        } else {
            // 如果还是想保留原来的更新逻辑作为备选
            console.warn('使用旧方法更新资产详情...');
            
            // 遍历所有大类资产
            etfData.composition.forEach(assetClass => {
                const className = assetClass.className;
                const unit = assetClass.unit;
                const percent = assetClass.percent;
                const accProfitRate = assetClass.accProfitRate;
                
                // 更新右侧资产详情部分 - 确保乘以100
                updateAssetDetailHeader(className, unit, percent * 100, accProfitRate * 100);
            });
        }
        
        console.log('资产信息加载完成');
    } catch (error) {
        console.error('获取资产信息失败:', error);
    }
}

/**
 * 使用XMLHttpRequest加载ETF数据
 */
function loadEtfDataWithXHR() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.overrideMimeType("application/json");
        xhr.open('GET', 'etf.json', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve(data);
                    } catch (error) {
                        reject(new Error('ETF数据解析失败: ' + error.message));
                    }
                } else {
                    reject(new Error('加载ETF数据失败: ' + xhr.status));
                }
            }
        };
        xhr.send(null);
    });
}

/**
 * 更新左侧资产排名列表中的项
 */
function updateAssetRankingItem(className, unit, percent, accProfitRate) {
    // --- DEBUGGING: Log input values ---
    console.log(`updateAssetRankingItem for ${className}: unit=${unit}, percent=${percent}, accProfitRate=${accProfitRate}`);
    // ----------------------------------

    // 根据资产名称找到对应的元素
    let assetType = getAssetTypeFromClassName(className);
    const assetItem = document.querySelector(`.asset-item[data-asset-type="${assetType}"]`);
    
    if (!assetItem) {
        console.warn(`未找到资产项: ${className} (${assetType})`);
        return;
    }
    
    // 更新份数和占比
    const sharesElem = assetItem.querySelector('.asset-shares');
    if (sharesElem) {
        // 确保percent是以小数形式传入的，直接格式化为百分比显示
        sharesElem.textContent = `${unit}份 (${percent.toFixed(2)}%)`;
    }
    
    // 更新累计收益率
    const profitElem = assetItem.querySelector('.asset-profit');
    if (profitElem) {
        // 确保accProfitRate是以小数形式传入的，直接格式化为百分比显示
        profitElem.textContent = `+${accProfitRate.toFixed(2)}%`;
        profitElem.className = `asset-profit ${accProfitRate >= 0 ? 'positive' : 'negative'}`;
    }
}

/**
 * 更新右侧资产详情头部
 */
function updateAssetDetailHeader(className, unit, percent, accProfitRate) {
    // 找到对应的资产组
    const assetGroupHeaders = document.querySelectorAll('.asset-group-header');
    
    assetGroupHeaders.forEach(header => {
        const titleElem = header.querySelector('h4');
        if (!titleElem) return;
        
        // 判断是否是当前处理的资产类别
        let currentTitle = titleElem.textContent.split(' ')[0];
        if ((className === '现金' && currentTitle.includes('现金')) ||
            (className === '境内债券' && currentTitle.includes('境内')) ||
            (currentTitle === className)) {
            
            // 输出日志用于调试
            console.log(`更新${className}资产详情头部，份数:${unit}, 占比:${percent}, 收益率:${accProfitRate}`);
            
            // 更新份数和占比
            const sharesElem = header.querySelector('.detail-shares');
            if (sharesElem) {
                // 确保percent是以小数形式传入的，直接格式化为百分比显示
                sharesElem.textContent = `${unit}份 (${percent.toFixed(2)}%)`;
            }
            
            // 更新累计收益率
            const profitElem = header.querySelector('.detail-profit');
            if (profitElem) {
                // 确保accProfitRate是以小数形式传入的，直接格式化为百分比显示
                profitElem.textContent = `累计收益率 +${accProfitRate.toFixed(2)}%`;
                profitElem.className = `detail-profit ${accProfitRate >= 0 ? 'positive' : 'negative'}`;
            }
        }
    });
}

/**
 * 获取资产类型标识符
 * 
 * 重要说明：
 * 此函数在整个系统中起关键作用，维护资产类名与HTML标识符的映射关系。
 * 必须确保HTML中的资产类型标识(data-asset-type)与此函数返回的值保持一致。
 * 
 * 特别注意：
 * - 境内债券统一使用 'cn-bond'，不要在HTML中使用 'domestic-bond'
 * - 若添加新的资产类型，需要在此函数中添加对应的映射关系
 * - 同时需要在CSS中添加对应的颜色样式
 * 
 * @param {string} className - 大类资产名称
 * @returns {string} 对应的资产类型标识符
 */
function getAssetTypeFromClassName(className) {
    switch (className) {
        case 'A股': return 'a-stock';
        case '海外新兴市场股票': return 'hk-stock';
        case '海外债券': return 'global-bond';
        case '海外成熟市场股票': return 'global-market';
        case '境内债券': return 'cn-bond';
        case '现金': return 'cash';
        case '黄金': return 'gold';
        case '原油': return 'oil';
        default: return className.toLowerCase().replace(/\s/g, '-');
    }
}

/**
 * 加载ETF卡片数据
 * 从etf.json和adjust.json获取ETF基金的详细信息，更新卡片显示
 */
async function loadEtfCardData() {
    try {
        let etfData, adjustData;
        
        // 检查是否有预处理数据
        if (typeof processedData !== 'undefined') {
            console.log('使用预处理数据更新ETF卡片');
            etfData = processedData.originalData;
            updateEtfCardsWithProcessedData(processedData.assets);
            
            // 在更新完成后对卡片进行排序
            sortFundCardsByOperationDate();
            return;
        }
        
        // 如果没有预处理数据，使用原始的加载方法
        console.warn('未找到预处理数据，尝试通过fetch或XHR加载数据');
        
        // 尝试通过fetch加载数据
        try {
            // 加载ETF数据
            const etfResponse = await fetch('/data/etf.json', { // 修改路径
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            });
            etfData = await etfResponse.json();
            
            // 加载调整数据
            const adjustResponse = await fetch('/data/adjust.json', { // 修改路径
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            });
            adjustData = await adjustResponse.json(); // 存储到全局变量
        } catch (fetchError) {
            console.warn('通过fetch加载数据失败，尝试使用内联数据:', fetchError);
            
            // 如果fetch失败（可能是因为CORS限制），使用内联数据
            try {
                // 从加载数据的备用方法中获取
                const data = await loadDataWithXHR();
                etfData = data.etfData;
                adjustData = data.adjustData;
            } catch (xhrError) {
                console.error('备用数据加载方法也失败:', xhrError);
                throw new Error('无法加载数据：' + xhrError.message);
            }
        }
        
        if (!etfData || !etfData.composition || !adjustData) {
            console.error('数据格式不正确');
            return;
        }
        
        // 保存到全局变量，供其他函数使用
        window.adjustData = adjustData;
        
        // 确保首先调用了generateAssetGroupsHTML来创建HTML结构
        // 如果HTML结构还没创建，调用generateAssetGroupsHTML
        const fundCardsContainer = document.querySelector('.fund-cards-container');
        if (fundCardsContainer && fundCardsContainer.querySelectorAll('.asset-group').length === 0) {
            console.log('HTML结构尚未创建，先生成HTML结构');
            generateAssetGroupsHTML(etfData);
        }
        
        console.log('ETF数据和调整数据加载成功，开始更新卡片...');
        
        // 获取所有ETF卡片（包括活跃和已清仓的）
        const allFundCards = document.querySelectorAll('.fund-card');
        const activeFundCards = document.querySelectorAll('.fund-card:not(.disabled)');
        
        console.log(`找到${activeFundCards.length}个活跃ETF卡片和${allFundCards.length - activeFundCards.length}个已清仓ETF卡片，准备更新数据...`);
        
        // 为每个卡片更新数据
        allFundCards.forEach((card, index) => {
            try {
                // 获取ETF名称和代码
                const fundTitleElement = card.querySelector('.fund-title');
                const fundCodeElement = card.querySelector('.fund-code');
                
                if (!fundTitleElement || !fundCodeElement) {
                    console.warn('卡片缺少标题或代码元素，跳过更新');
                    return;
                }
                
                // 提取ETF名称和代码
                const fundTitle = fundTitleElement.textContent.trim();
                const fundCode = fundCodeElement.textContent.trim();
                
                // 检查是否是已清仓基金
                const isDisabled = card.classList.contains('disabled');
                
                console.log(`[${index + 1}/${allFundCards.length}] 更新基金卡片: ${fundTitle} (${fundCode})${isDisabled ? ' [已清仓]' : ''}`);
                
                // 从ETF数据中查找匹配的基金信息
                const fundInfo = findFundInfo(etfData, fundTitle, fundCode);
                if (!fundInfo) {
                    console.warn(`未找到基金信息: ${fundTitle} (${fundCode})`);
                    return;
                }
                
                // 从调整数据中查找最近的操作信息
                const operationInfo = findLatestOperation(adjustData, fundTitle, fundCode);
                
                // 即使在本地打开文件的情况下也能更新最后操作信息
                // 对于已清仓基金，强制设置操作类型为"卖出"
                if (isDisabled && operationInfo) {
                    operationInfo.tradeType = "卖出";
                }
                
                updateOperationInfo(card, operationInfo);
                
                // 将操作时间作为数据属性存储在卡片上，用于排序
                if (operationInfo && operationInfo.navDate) {
                    card.dataset.operationDate = operationInfo.navDate;
                }

                // 更新卡片的历史最低价格相关信息
                updateFundCard(card, {
                    nav: fundInfo.nav,
                    lowestPrice: findHistoricalLowestPrice(adjustData, fundCode)
                });
                
            } catch (error) {
                console.error(`更新卡片[${index}]时发生错误:`, error);
            }
        });
        
        console.log('所有ETF卡片数据更新完成，开始按照最后操作时间排序...');
        
        // 对卡片进行排序
        sortFundCardsByOperationDate();
        
        console.log('所有ETF卡片已按最后操作时间排序完成');
    } catch (error) {
        console.error('获取ETF数据失败:', error);
    }
}

/**
 * 查找基金的历史最低价格
 * @param {Array} adjustData - 调整数据
 * @param {string} fundCode - 基金代码
 * @returns {number|null} - 历史最低价格
 */
function findHistoricalLowestPrice(adjustData, fundCode) {
    // 输入验证
    if (!adjustData || !adjustData.length || !fundCode) {
        return null;
    }
    
    // 清理基金代码，确保它是字符串形式，不含前导零
    const cleanedFundCode = String(fundCode).replace(/^0+/, '');
    
    let lowestNav = null;
    
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
                
                // 如果有净值并且是新的最低值（或者是第一个值）
                if (currentNav && (lowestNav === null || currentNav < lowestNav)) {
                    lowestNav = currentNav;
                }
            }
        }
    }
    
    return lowestNav;
}

/**
 * 对同一大类资产下的ETF卡片按照最后操作时间从近到远排序
 * 并更新资产组标题栏中的最后操作时间
 */
function sortFundCardsByOperationDate() {
    // 获取所有资产组
    const assetGroups = document.querySelectorAll('.asset-group');
    
    assetGroups.forEach(group => {
        // 获取该资产组下的所有fund-cards容器
        const fundCardsContainer = group.querySelector('.fund-cards');
        if (!fundCardsContainer) return;
        
        // 获取该容器下的所有ETF卡片（活跃的和已清仓的分开处理）
        const activeFundCards = Array.from(fundCardsContainer.querySelectorAll('.fund-card:not(.disabled)'));
        const disabledFundCards = Array.from(fundCardsContainer.querySelectorAll('.fund-card.disabled'));
        
        const groupTitle = group.querySelector('.asset-group-header h4').textContent.trim();
        console.log(`开始排序 "${groupTitle}" 下的${activeFundCards.length}张活跃ETF卡片和${disabledFundCards.length}张已清仓ETF卡片`);
        
        // 如果没有卡片，无需排序
        if (activeFundCards.length + disabledFundCards.length === 0) return;
        
        // 按照操作日期排序活跃卡片（近到远）
        if (activeFundCards.length > 1) {
            activeFundCards.sort((a, b) => {
                const dateA = parseInt(a.dataset.operationDate || '0');
                const dateB = parseInt(b.dataset.operationDate || '0');
                
                // 操作日期从近到远（降序）
                return dateB - dateA;
            });
        }
        
        // 按照操作日期排序已清仓卡片（近到远）
        if (disabledFundCards.length > 1) {
            disabledFundCards.sort((a, b) => {
                const dateA = parseInt(a.dataset.operationDate || '0');
                const dateB = parseInt(b.dataset.operationDate || '0');
                
                // 操作日期从近到远（降序）
                return dateB - dateA;
            });
        }
        
        // 清空容器
        fundCardsContainer.innerHTML = '';
        
        // 先添加活跃卡片（按时间排序）
        activeFundCards.forEach(card => {
            fundCardsContainer.appendChild(card);
        });
        
        // 再添加已清仓卡片（按时间排序）
        disabledFundCards.forEach(card => {
            fundCardsContainer.appendChild(card);
        });
        
        // 更新资产组标题栏中的最后操作时间
        // 获取该大类资产下的第一张卡片（无论是活跃还是已清仓）
        const firstCard = activeFundCards.length > 0 ? activeFundCards[0] : (disabledFundCards.length > 0 ? disabledFundCards[0] : null);
        
        if (firstCard) {
            // 从第一张卡片获取最后操作时间
            const operationTimeElem = firstCard.querySelector('.fund-data-row:first-child .fund-value');
            if (operationTimeElem) {
                const operationTime = operationTimeElem.textContent.trim();
                // 如果是"数据加载中..."，则跳过
                if (operationTime !== '数据加载中...' && !operationTime.includes('加载中')) {
                    // 提取操作日期部分 - 通常格式为"买入 (2023-04-10)"或"卖出 (2023-04-10)"
                    const dateMatch = operationTime.match(/\(([0-9-]+)\)/);
                    if (dateMatch && dateMatch[1]) {
                        // 更新资产组标题栏中的日期
                        const dateElem = group.querySelector('.detail-date');
                        if (dateElem) {
                            dateElem.textContent = dateMatch[1];
                            console.log(`更新"${groupTitle}"的最后操作时间为: ${dateMatch[1]}`);
                        }
                    }
                }
            }
        }
        
        console.log(`"${groupTitle}" 下的ETF卡片已按最后操作时间排序完成，活跃卡片在前，已清仓卡片在后`);
    });
}

/**
 * 使用预处理数据更新ETF卡片
 * @param {Array} processedAssets - 预处理后的资产数据
 */
function updateEtfCardsWithProcessedData(processedAssets) {
    // 获取所有ETF卡片（包括活跃和已清仓的）
    const allFundCards = document.querySelectorAll('.fund-card');
    const activeFundCards = document.querySelectorAll('.fund-card:not(.disabled)');
    
    console.log(`找到${activeFundCards.length}个活跃ETF卡片和${allFundCards.length - activeFundCards.length}个已清仓ETF卡片，使用预处理数据更新...`);
    
    // 为每个卡片更新数据
    allFundCards.forEach((card, index) => {
        try {
            // 获取ETF名称和代码
            const fundTitleElement = card.querySelector('.fund-title');
            const fundCodeElement = card.querySelector('.fund-code');
            
            if (!fundTitleElement || !fundCodeElement) {
                console.warn('卡片缺少标题或代码元素，跳过更新');
                return;
            }
            
            // 提取ETF名称和代码
            const fundTitle = fundTitleElement.textContent.trim();
            const fundCode = fundCodeElement.textContent.trim();
            
            // 检查是否是已清仓基金
            const isDisabled = card.classList.contains('disabled');
            
            console.log(`[${index + 1}/${allFundCards.length}] 更新基金卡片: ${fundTitle} (${fundCode})${isDisabled ? ' [已清仓]' : ''}`);
            
            // 从预处理数据中查找匹配的基金
            let matchedFund = null;
            
            // 搜索所有资产类别
            for (const asset of processedAssets) {
                if (!asset.funds || !Array.isArray(asset.funds)) continue;
                
                // 搜索该资产类别下的所有基金
                for (const fund of asset.funds) {
                    // 跳过现金项
                    if (fund.isCash) continue;
                    
                    // 清理基金代码，忽略前导零
                    const cleanedFundCode = String(fund.fundCode).replace(/^0+/, '');
                    const cleanedCardCode = String(fundCode).replace(/^0+/, '');
                    
                    // 通过基金代码匹配
                    if (cleanedFundCode === cleanedCardCode) {
                        matchedFund = fund;
                        break;
                    }
                }
                
                if (matchedFund) break;
            }
            
            if (!matchedFund) {
                console.warn(`未在预处理数据中找到基金: ${fundTitle} (${fundCode})`);
                return;
            }
            
            // --- REMOVED old logic that manually updated the first row ---
            // const operationRow = card.querySelector('.fund-data-row:first-child');
            // if (operationRow) { ... }

            // --- ADDED call to updateOperationInfo --- 
            // Prepare operationInfo object expected by updateOperationInfo
            let operationInfoForUpdate = null;
            if (matchedFund.latestOperation) {
                // For disabled (cleared) funds, force type to '卖出'
                const type = isDisabled ? "卖出" : matchedFund.latestOperation.tradeType;
                operationInfoForUpdate = {
                    type: type,
                    shares: matchedFund.latestOperation.shares, // Ensure 'shares' field exists in processedData or adjust accordingly
                    date: matchedFund.latestOperation.navDate // Use the timestamp
                };
                 // Set data attribute for sorting
                card.dataset.operationDate = matchedFund.latestOperation.navDate;
            }

            // Call the refined function to update operation details
            // --- DEBUGGING: Log data before calling updateOperationInfo ---
            console.log(`[${fundCode}] Matched Fund Latest Op:`, matchedFund.latestOperation);
            console.log(`[${fundCode}] Prepared Op Info for Update:`, operationInfoForUpdate);
            // -------------------------------------------------------------
            updateOperationInfo(card, operationInfoForUpdate);
            // -------------------------------------------
            
            // 创建用于updateFundCard的基金信息对象
            const fundInfo = {
                nav: matchedFund.nav,
                lowestPrice: matchedFund.historicalLow ? parseFloat(matchedFund.historicalLow) : 0
            };
            
            // 使用updateFundCard更新基金卡片，包括处理历史最低价格相关行
            updateFundCard(card, fundInfo);
            
        } catch (error) {
            console.error(`更新卡片[${index}]时发生错误:`, error);
        }
    });
    
    console.log('所有ETF卡片数据从预处理数据更新完成');
}

/**
 * 更新卡片中的最后操作信息
 */
function updateOperationInfo(card, operationInfo) {
    // Find the element where the operation details should be displayed
    const detailsElement = card.querySelector('.operation-details'); 

    // --- DEBUGGING: Log inside updateOperationInfo ---
    const fundCodeForLog = card.dataset.fundCode || card.querySelector('.fund-code')?.textContent || 'Unknown';
    console.log(`[${fundCodeForLog}] updateOperationInfo called. Found detailsElement:`, !!detailsElement, "OpInfo received:", operationInfo);
    // -------------------------------------------------

    if (!detailsElement) {
        // Log an error if the target element is not found in the card structure
        console.warn(`Could not find .operation-details element in card for fund ${card.dataset.fundCode}`);
        return;
    }

    // Check if we have valid operation info and the date formatting utility is available
    if (operationInfo && operationInfo.date && typeof dateUtils !== 'undefined' && dateUtils.convertTimestampToDate) { // Correct function name
        // Construct the text string: "Type Shares份 (YYYY-MM-DD)"
        // Handle cases where type or shares might be missing gracefully
        const operationText = 
            `${operationInfo.type || ''} ${operationInfo.shares !== undefined ? operationInfo.shares + '份' : ''} (${dateUtils.convertTimestampToDate(operationInfo.date)})`; // Correct function call
        
        // Update the text content of the element, removing leading/trailing spaces
        detailsElement.textContent = operationText.trim();

        // Optional: Apply styling classes based on the operation type
        detailsElement.classList.remove('buy', 'sell'); // Clear existing classes first
        if (operationInfo.type === '买入') {
            detailsElement.classList.add('buy');
        } else if (operationInfo.type === '卖出') {
            detailsElement.classList.add('sell');
        }

    } else {
        // If data is missing or invalid, reset to the default placeholder
        detailsElement.textContent = '--'; 
        detailsElement.classList.remove('buy', 'sell'); // Clear styling classes
        
        // Log a warning if operationInfo exists but lacks a date or dateUtils is unavailable
        if (operationInfo) {
             console.warn(`Missing operation date or dateUtils.convertTimestampToDate unavailable for fund ${fundCodeForLog}`, operationInfo); // Update warning message
        }
    }
}

/**
 * 使用XMLHttpRequest加载数据，可以绕过某些CORS限制
 */
function loadDataWithXHR() {
    return new Promise((resolve, reject) => {
        let etfData = null;
        let adjustData = null;
        let loadCount = 0;
        
        // 加载ETF数据
        const etfXHR = new XMLHttpRequest();
        etfXHR.overrideMimeType("application/json");
        etfXHR.open('GET', 'etf.json', true);
        etfXHR.onreadystatechange = function() {
            if (etfXHR.readyState === 4) {
                if (etfXHR.status === 200) {
                    try {
                        etfData = JSON.parse(etfXHR.responseText);
                        loadCount++;
                        checkComplete();
                    } catch (error) {
                        reject(new Error('ETF数据解析失败: ' + error.message));
                    }
                } else {
                    reject(new Error('加载ETF数据失败: ' + etfXHR.status));
                }
            }
        };
        etfXHR.send(null);
        
        // 加载调整数据
        const adjustXHR = new XMLHttpRequest();
        adjustXHR.overrideMimeType("application/json");
        adjustXHR.open('GET', 'adjust.json', true);
        adjustXHR.onreadystatechange = function() {
            if (adjustXHR.readyState === 4) {
                if (adjustXHR.status === 200) {
                    try {
                        adjustData = JSON.parse(adjustXHR.responseText);
                        loadCount++;
                        checkComplete();
                    } catch (error) {
                        reject(new Error('调整数据解析失败: ' + error.message));
                    }
                } else {
                    reject(new Error('加载调整数据失败: ' + adjustXHR.status));
                }
            }
        };
        adjustXHR.send(null);
        
        // 检查是否全部加载完成
        function checkComplete() {
            if (loadCount === 2) {
                resolve({ etfData, adjustData });
            }
        }
    });
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
        // 检查是否有orders字段
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
                // 获取操作日期
                const operationDate = order.adjustTxnDate || adjustment.adjustTxnDate;
                
                if (!operationDate) {
                    console.warn(`基金[${cleanedFundCode}]找到匹配记录，但无法获取操作日期`);
                    continue;
                }
                
                // 确定交易类型
                let tradeType = "未知";
                if (order.tradeUnit > 0) {
                    tradeType = "买入";
                } else if (order.tradeUnit < 0) {
                    tradeType = "卖出";
                } else if (order.orderCode) {
                    tradeType = order.orderCode === "022" ? "买入" : "卖出";
                }
                
                // 转换日期格式
                const formattedDate = convertNavdataToDate(operationDate);
                
                const result = {
                    tradeType: tradeType,
                    operationDate: formattedDate,
                    navDate: operationDate
                };
                
                console.log(`找到基金[${cleanedFundCode}]的操作记录：${tradeType} (${formattedDate})`);
                
                // 返回第一个匹配的记录（即最后一次操作）
                return result;
            }
        }
    }
    
    console.log(`未找到基金[${cleanedFundCode}]的操作记录`);
    return null;
}

/**
 * 从ETF数据中查找匹配的基金信息
 * @param {Object} etfData - ETF数据对象
 * @param {string} fundTitle - 基金标题
 * @param {string} fundCode - 基金代码
 * @returns {Object|null} - 匹配的基金信息
 */
function findFundInfo(etfData, fundTitle, fundCode) {
    // 清理基金代码，确保它是字符串形式，不含前导零
    const cleanedFundCode = String(fundCode).replace(/^0+/, '');
    
    // 从基金标题中提取品种和基金名称（如果有格式为"品种-基金名称"）
    let fundVariety = '';
    let cleanedFundTitle = fundTitle;
    
    const titleParts = fundTitle.split('-');
    if (titleParts.length >= 2) {
        fundVariety = titleParts[0].trim();
        cleanedFundTitle = titleParts.slice(1).join('-').trim();
    }
    
    console.log(`尝试查找基金: ${cleanedFundTitle} (${cleanedFundCode}), 品种: ${fundVariety}`);
    
    // 遍历所有资产类别
    for (const assetClass of etfData.composition || []) {
        // 遍历该资产类别中的所有基金
        for (const fund of assetClass.compList || []) {
            if (!fund.fund) continue;
            
            // 清理基金数据中的代码
            const cleanedDataFundCode = String(fund.fund.fundCode).replace(/^0+/, '');
            
            // 匹配逻辑：
            // 1. 基金代码匹配（忽略前导零）
            // 2. 完整基金名称匹配
            // 3. 基金标题包含基金名称
            // 4. 基金品种匹配（如果有）
            if (cleanedDataFundCode === cleanedFundCode || 
                fund.fund.fundName === cleanedFundTitle ||
                cleanedFundTitle.includes(fund.fund.fundName) ||
                (fundVariety && fund.variety === fundVariety)) {
                
                console.log(`找到匹配基金: ${cleanedFundCode} - ${fund.fund.fundName}`);
                
                return {
                    planUnit: fund.planUnit,
                    percent: fund.percent,
                    accProfit: fund.accProfit,
                    unitValue: fund.unitValue,
                    nav: fund.nav,
                    fundInfo: fund
                };
            }
        }
    }
    
    console.log(`未找到匹配基金: ${fundTitle} (${fundCode})`);
    return null;
}

/**
 * 更新基金卡片数据
 * @param {Element} card - 基金卡片元素
 * @param {Object} fundInfo - 基金信息对象
 */
function updateFundCard(card, fundInfo) {
    if (!card || !fundInfo) return;
    
    // 检查卡片是否已禁用（清仓）
    const isDisabled = card.classList.contains('disabled');
    
    // 更新各个数据行
    const dataRows = card.querySelectorAll('.fund-data-row');
    
    // 历史低价相关行
    let historicalLowRow = null;
    let valueCompareToLowRow = null;
    
    dataRows.forEach(row => {
        const label = row.querySelector('.fund-label');
        const value = row.querySelector('.fund-value');
        
        if (!label || !value) return;
        
        const labelText = label.textContent.trim();
        
        // 找到历史最低单价行和现值对比历史最低单价行
        if (labelText.includes('E大历史最低单价')) {
            historicalLowRow = row;
        } else if (labelText.includes('现值对比历史最低单价')) {
            valueCompareToLowRow = row;
        }
        
        // 其他数据更新...
    });
    
    // 处理历史最低单价行
    if (historicalLowRow) {
        const value = historicalLowRow.querySelector('.fund-value');
        if (value) {
            // 如果历史最低价大于0，显示它；否则隐藏整行
            if (fundInfo.lowestPrice && fundInfo.lowestPrice > 0) {
                value.textContent = fundInfo.lowestPrice.toFixed(4);
                historicalLowRow.style.display = 'flex'; // 确保显示
            } else {
                historicalLowRow.style.display = 'none'; // 隐藏整行
            }
        }
    }
    
    // 处理现值对比历史最低单价行
    if (valueCompareToLowRow) {
        const value = valueCompareToLowRow.querySelector('.fund-value');
        if (value) {
            // 如果历史最低价大于0，计算并显示比较；否则隐藏整行
            if (fundInfo.lowestPrice && fundInfo.lowestPrice > 0 && fundInfo.nav) {
                const percentage = ((fundInfo.nav - fundInfo.lowestPrice) / fundInfo.lowestPrice * 100).toFixed(2);
                value.textContent = percentage >= 0 ? `+${percentage}%` : `${percentage}%`;
                value.className = 'fund-value ' + (percentage >= 0 ? 'positive' : 'negative');
                valueCompareToLowRow.style.display = 'flex'; // 确保显示
            } else {
                valueCompareToLowRow.style.display = 'none'; // 隐藏整行
            }
        }
    }
}

/**
 * 完全动态生成资产组HTML结构，移除对硬编码HTML的依赖
 * 
 * 重要说明：
 * 1. 此函数负责生成右侧"大类资产详情"区域的所有HTML内容
 * 2. 现金资产不会在右侧详情中显示，而是被跳过处理
 * 3. 境内债券使用'cn-bond'标识，与getAssetTypeFromClassName一致
 * 
 * @param {Object} etfData - ETF数据
 */
function generateAssetGroupsHTML(etfData) {
    console.log('开始动态生成资产组HTML结构');
    
    // 检查数据有效性
    if (!etfData || !etfData.composition || !Array.isArray(etfData.composition)) {
        console.error('ETF数据格式不正确，无法生成资产组HTML');
        return;
    }
    
    // 获取fund-cards-container容器
    const fundCardsContainer = document.querySelector('.fund-cards-container');
    if (!fundCardsContainer) {
        console.error('未找到fund-cards-container容器，无法生成资产组HTML');
        return;
    }
    
    // 清空容器内容
    fundCardsContainer.innerHTML = '';
    
    // 构建资产分类映射
    const assetGroups = {};
    
    // 遍历所有资产
    etfData.composition.forEach(assetClass => {
        // 确保有基金列表
        if (!assetClass.compList || !Array.isArray(assetClass.compList)) return;
        
        // 跳过现金资产 - 不在"大类资产详情"中显示现金
        if (assetClass.isCash || assetClass.className === '现金') {
            console.log('跳过现金资产 - 不在"大类资产详情"中显示现金');
            return;
        }
        
        // 创建资产组HTML
        const className = assetClass.className;
        const assetTypeCode = getAssetTypeFromClassName(className);
        const unit = assetClass.unit || 0;
        const percent = assetClass.percent || 0;
        
        // 获取累计收益率
        let accProfitRate = assetClass.accProfitRate;
        
        // 确保百分比格式一致 - 使用小数形式进行计算，显示时才转换为百分比
        // 这样可以保证与左侧资产排名一致
        
        // 创建资产组元素
        const assetGroupDiv = document.createElement('div');
        assetGroupDiv.className = 'asset-group';
        assetGroupDiv.innerHTML = `
            <div class="asset-group-header">
                <div class="title-section">
                    <span class="asset-icon ${assetTypeCode}"></span>
                    <h4>${className} <span class="detail-shares">${unit}份 (${(percent * 100).toFixed(2)}%)</span></h4>
                </div>
                <div class="detail-info">
                    <span class="detail-profit ${accProfitRate >= 0 ? 'positive' : 'negative'}" style="color: #e74c3c; font-weight: 500;">累计收益率 +${(accProfitRate * 100).toFixed(2)}%</span>
                    <span class="detail-date">加载中...</span>
                </div>
            </div>
            <div class="fund-cards"></div>
        `;
        
        // 将资产组添加到容器
        fundCardsContainer.appendChild(assetGroupDiv);
        
        // 获取刚刚创建的fund-cards容器
        const fundCardsDiv = assetGroupDiv.querySelector('.fund-cards');
        
        // 构建基金卡片
        assetClass.compList.forEach(fund => {
            // 跳过现金
            if (fund.isCash) return;
            
            // 创建基金卡片
            const fundCard = createFundCard(fund);
            if (fundCard) {
                fundCardsDiv.appendChild(fundCard);
            }
        });
    });
    
    console.log('资产组HTML结构生成完成');
}

/**
 * 创建单个基金卡片
 * @param {Object} fund - 基金数据
 * @returns {Element} - 基金卡片DOM元素
 */
function createFundCard(fund) {
    // 验证基金数据
    if (!fund || !fund.fund) return null;
    
    const fundInfo = fund.fund;
    const planUnit = fund.planUnit || 0;
    const isActive = planUnit > 0;
    
    // 创建基金卡片元素
    const cardDiv = document.createElement('div');
    cardDiv.className = `fund-card${!isActive ? ' disabled' : ''}`;
    
    // 确定卡片标题是否需要positive/negative类
    const navDiff = fund.nav && fund.unitValue ? ((fund.nav - fund.unitValue) / fund.unitValue) : 0;
    const headerClass = navDiff >= 0 ? 'positive' : 'negative';
    
    // 构建卡片内容HTML
    let innerHtml = `
        <div class="fund-header${isActive ? ' ' + headerClass : ''}">
            <div class="fund-title-group">
                <span class="fund-title">${fund.variety ? fund.variety + '-' : ''}${fundInfo.fundName}</span>
                <span class="fund-code">${fundInfo.fundCode}</span>
            </div>
        </div>
        <div class="fund-data">
            <div class="fund-data-row">
                <span class="fund-label">最后操作</span>
                <span class="fund-value operation-details">数据加载中...</span>
            </div>
    `;
    
    // 份数和占比行
    if (isActive) {
        innerHtml += `
            <div class="fund-data-row">
                <span class="fund-label">份数/占比</span>
                <span class="fund-value">${planUnit}份/${(fund.percent * 100).toFixed(2)}%</span>
            </div>
        `;
    } else {
        innerHtml += `
            <div class="fund-data-row">
                <span class="fund-label">份数/占比</span>
                <span class="fund-value">已清仓/0%</span>
            </div>
        `;
    }
    
    // 累计收益率行
    const accProfit = fund.accProfit || 0;
    const accProfitClass = accProfit >= 0 ? 'positive' : 'negative';
    innerHtml += `
        <div class="fund-data-row">
            <span class="fund-label">累计收益率</span>
            <span class="fund-value ${accProfitClass}">${accProfit >= 0 ? '+' : ''}${(accProfit * 100).toFixed(2)}%</span>
        </div>
    `;
    
    // 对于活跃基金，添加额外信息
    if (isActive) {
        innerHtml += `
            <div class="fund-data-row">
                <span class="fund-label">E大平均持有单价</span>
                <span class="fund-value">${fund.unitValue ? fund.unitValue.toFixed(4) : '无数据'}</span>
            </div>
        `;
        
        // 历史最低单价会在updateFundCard中动态添加或更新
        innerHtml += `
            <div class="fund-data-row" style="display: none;">
                <span class="fund-label">E大历史最低单价</span>
                <span class="fund-value">加载中...</span>
            </div>
        `;
    }
    
    // 最新净值行
    innerHtml += `
        <div class="fund-data-row">
            <span class="fund-label">最新净值</span>
            <span class="fund-value">${fund.nav ? fund.nav.toFixed(4) : '无数据'}</span>
        </div>
    `;
    
    // 对于活跃基金，添加对比信息
    if (isActive && fund.unitValue && fund.nav) {
        const percentDiff = ((fund.nav - fund.unitValue) / fund.unitValue * 100).toFixed(2);
        const diffClass = percentDiff >= 0 ? 'positive' : 'negative';
        
        innerHtml += `
            <div class="fund-data-row">
                <span class="fund-label">现值对比平均单价</span>
                <span class="fund-value ${diffClass}">${percentDiff >= 0 ? '+' : ''}${percentDiff}%</span>
            </div>
        `;
        
        // 历史最低单价对比会在updateFundCard中动态添加或更新
        innerHtml += `
            <div class="fund-data-row" style="display: none;">
                <span class="fund-label">现值对比历史最低单价</span>
                <span class="fund-value">加载中...</span>
            </div>
        `;
    }
    
    innerHtml += `</div>`;
    cardDiv.innerHTML = innerHtml;
    
    return cardDiv;
}

/**
 * 更新资金状况单行显示
 * 
 * 重要说明：
 * 1. 此函数负责计算并显示页面顶部的持仓和现金信息
 * 2. 计算逻辑：
 *    - 持仓份数 = 所有非现金资产份数之和
 *    - 现金份数 = 现金资产份数
 *    - 百分比 = 份数 / 150 * 100 (150是150计划的总份数)
 * 3. 依赖HTML中的四个元素ID: 
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
    
    // 获取显示元素
    const positionUnitsElem = document.getElementById('total-position-units');
    const positionPercentElem = document.getElementById('total-position-percent');
    const cashUnitsElem = document.getElementById('total-cash-units');
    const cashPercentElem = document.getElementById('total-cash-percent');
    
    if (!positionUnitsElem || !positionPercentElem || !cashUnitsElem || !cashPercentElem) {
        console.warn('未找到资金状况显示元素');
        return;
    }
    
    // 计算持仓总份数（除现金外的所有资产份数之和）
    let totalPositionUnits = 0;
    let cashUnits = 0;
    const totalUnits = 150; // 150计划总份数固定为150份
    
    // 获取所有资产数据
    const assetDistribution = data.summary.assetDistribution;
    
    // 遍历所有资产，计算持仓总份数和现金份数
    for (const className in assetDistribution) {
        const assetData = assetDistribution[className];
        if (className === '现金' || assetData.isCash) {
            cashUnits = assetData.unit;
        } else {
            totalPositionUnits += assetData.unit;
        }
    }
    
    // 计算百分比
    const positionPercent = (totalPositionUnits / totalUnits * 100).toFixed(2);
    const cashPercent = (cashUnits / totalUnits * 100).toFixed(2);
    
    // 更新显示
    positionUnitsElem.textContent = totalPositionUnits;
    positionPercentElem.textContent = positionPercent + '%';
    cashUnitsElem.textContent = cashUnits;
    cashPercentElem.textContent = cashPercent + '%';
    
    console.log(`更新资金状况: 持仓${totalPositionUnits}份(${positionPercent}%), 现金${cashUnits}份(${cashPercent}%)`);
} 
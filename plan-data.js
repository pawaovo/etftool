/**
 * 计划数据页面JavaScript
 * 用于处理ETF计划数据展示、交互和数据加载
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initPlanPage();
    
    // 设置基金卡片颜色
    setupFundCardColors();
});

/**
 * 页面初始化函数
 * 设置各种事件监听和加载初始数据
 */
function initPlanPage() {
    // 设置计划标签切换
    setupPlanTabs();
    
    // 设置排序控件
    setupSortControls();
    
    // 设置资产项点击
    setupAssetItems();
    
    // 加载初始数据
    loadPlanData();
}

/**
 * 设置计划标签切换
 * 切换150计划和S计划的数据展示
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
            } else if (planType === 'S') {
                window.location.href = 'splan.html';
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
 * 加载计划数据
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
        
        // 保存数据到全局变量，以便其他函数访问
        window.assetsData = fundData.assets;
        
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
                loadAssetDetails(selectedAssetType, fundData.assets);
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
            loadAssetDetails(asset.type, assets);
            
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
function loadAssetDetails(assetType, allAssets) {
    console.log('加载资产详情:', assetType);
    
    // 找到对应的资产对象
    const asset = allAssets.find(a => a.type === assetType);
    if (!asset) {
        console.error('未找到资产:', assetType);
        return;
    }
    
    // 清除当前详情内容
    const detailsContainer = document.getElementById('asset-details');
    detailsContainer.innerHTML = '';
    
    // 创建详情标题
    const header = document.createElement('div');
    header.className = 'asset-group-header';
    
    // 创建标题部分（左侧）
    const titleSection = document.createElement('div');
    titleSection.className = 'title-section';
    
    // 添加图标
    const icon = document.createElement('img');
    icon.src = `icons/${asset.icon || 'default-asset.png'}`;
    icon.className = 'asset-icon';
    titleSection.appendChild(icon);
    
    // 添加标题和占比
    const titleText = document.createElement('div');
    titleText.className = 'asset-title';
    titleText.textContent = `${asset.name} (占比 ${asset.share}%)`;
    titleSection.appendChild(titleText);
    
    header.appendChild(titleSection);
    
    // 创建详情信息部分（右下方）
    const detailInfo = document.createElement('div');
    detailInfo.className = 'detail-info';
    
    // 添加累计收益
    const profit = document.createElement('span');
    profit.className = 'detail-profit';
    profit.textContent = `累计收益率 ${asset.profit > 0 ? '+' : ''}${asset.profit}%`;
    detailInfo.appendChild(profit);
    
    // 添加日期
    const date = document.createElement('span');
    date.className = 'detail-date';
    date.textContent = asset.lastUpdate || '未知';
    detailInfo.appendChild(date);
    
    header.appendChild(detailInfo);
    detailsContainer.appendChild(header);
    
    // 创建基金卡片容器
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'fund-cards-container';
    
    // 获取并排序基金数据
    const funds = asset.funds || [];
    
    // 创建所有基金卡片
    funds.forEach(fund => {
        const card = document.createElement('div');
        card.className = 'fund-card';
        
        // 创建基金标题部分
        const fundHeader = document.createElement('div');
        fundHeader.className = `fund-header ${fund.estimatedPriceDiff > 0 ? 'positive' : fund.estimatedPriceDiff < 0 ? 'negative' : ''}`;
        
        // 创建基金标题和代码的容器
        const fundTitleGroup = document.createElement('div');
        fundTitleGroup.className = 'fund-title-group';
        
        // 确保基金代码始终显示为6位数字，使用padStart添加前导零
        // 首先确保将代码转为字符串，然后使用padStart添加前导零至6位数字
        const paddedFundCode = String(fund.code).padStart(6, '0');
        
        // 设置基金名称（去掉"A股-"前缀）
        const fundName = fund.name.replace(/^A股-/, '');
        const fundTitle = document.createElement('div');
        fundTitle.className = 'fund-title';
        fundTitle.textContent = `${fund.category}-${fundName}`;
        fundTitleGroup.appendChild(fundTitle);
        
        // 添加基金代码
        const fundCode = document.createElement('div');
        fundCode.className = 'fund-code';
        fundCode.textContent = paddedFundCode;
        fundTitleGroup.appendChild(fundCode);
        
        fundHeader.appendChild(fundTitleGroup);
        
        // 添加预估涨跌幅
        const fundEstimate = document.createElement('div');
        fundEstimate.className = 'fund-estimate';
        const sign = fund.estimatedPriceDiff > 0 ? '+' : '';
        fundEstimate.textContent = `${sign}${fund.estimatedPriceDiff}%`;
        fundHeader.appendChild(fundEstimate);
        
        card.appendChild(fundHeader);
        
        // 创建基金详情部分
        const fundDetails = document.createElement('div');
        fundDetails.className = 'fund-details';
        
        // 添加净值信息
        const navInfo = document.createElement('div');
        navInfo.className = 'fund-nav-info';
        
        const navValue = document.createElement('div');
        navValue.className = 'nav-value';
        navValue.textContent = fund.nav;
        navInfo.appendChild(navValue);
        
        const navDate = document.createElement('div');
        navDate.className = 'nav-date';
        navDate.textContent = fund.navDate;
        navInfo.appendChild(navDate);
        
        fundDetails.appendChild(navInfo);
        
        // 添加持仓信息
        const holdingInfo = document.createElement('div');
        holdingInfo.className = 'fund-holding-info';
        
        // 份额
        const shares = document.createElement('div');
        shares.className = 'holding-item';
        shares.innerHTML = `<span class="holding-label">持有份额</span><span class="holding-value">${fund.shares}</span>`;
        holdingInfo.appendChild(shares);
        
        // 成本
        const cost = document.createElement('div');
        cost.className = 'holding-item';
        cost.innerHTML = `<span class="holding-label">持仓成本</span><span class="holding-value">${fund.cost}</span>`;
        holdingInfo.appendChild(cost);
        
        // 现值
        const value = document.createElement('div');
        value.className = 'holding-item';
        value.innerHTML = `<span class="holding-label">估算现值</span><span class="holding-value">${fund.estimatedValue}</span>`;
        holdingInfo.appendChild(value);
        
        // 收益
        const profit = document.createElement('div');
        profit.className = 'holding-item';
        const profitValue = fund.estimatedProfit;
        const profitClass = profitValue >= 0 ? 'profit-positive' : 'profit-negative';
        profit.innerHTML = `<span class="holding-label">估算收益</span><span class="holding-value ${profitClass}">${profitValue}</span>`;
        holdingInfo.appendChild(profit);
        
        fundDetails.appendChild(holdingInfo);
        card.appendChild(fundDetails);
        
        cardsContainer.appendChild(card);
    });
    
    detailsContainer.appendChild(cardsContainer);
    
    // 显示详情区域
    detailsContainer.style.display = 'block';
    
    // 滚动到资产组
    scrollToAssetGroup(assetType);
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
}

/**
 * 显示资产详情
 */
function showAssetDetails(assetType) {
    console.log(`显示资产类型 ${assetType} 的详情`);
    
    // 加载该资产类型的详情
    loadAssetDetails(assetType, window.assetsData);
    
    // 滚动到相应的资产组
    scrollToAssetGroup(assetType);
}

/**
 * 滚动到指定资产组
 */
function scrollToAssetGroup(assetType) {
    // 所有资产组
    const assetGroups = document.querySelectorAll('.asset-group');
    
    // 根据资产类型找到相应的资产组
    let targetGroup = null;
    
    assetGroups.forEach(group => {
        const groupHeader = group.querySelector('.asset-group-header');
        const groupIcon = groupHeader.querySelector('.asset-icon');
        
        if (groupIcon && groupIcon.classList.contains(assetType)) {
            targetGroup = group;
        }
    });
    
    // 如果找到目标资产组，滚动到其位置
    if (targetGroup) {
        const fundCardsContainer = document.querySelector('.fund-cards-container');
        const groupTop = targetGroup.offsetTop;
        
        fundCardsContainer.scrollTo({
            top: groupTop - 20,
            behavior: 'smooth'
        });
    }
}

/**
 * 设置基金卡片颜色
 * 根据收益率设置卡片标题栏的颜色
 */
function setupFundCardColors() {
    console.log('设置基金卡片颜色');
    // 查找所有基金卡片
    const fundCards = document.querySelectorAll('.fund-card');
    
    fundCards.forEach(card => {
        // 查找卡片中的累计收益率元素
        const fundRows = card.querySelectorAll('.fund-row');
        let profitElement = null;
        
        // 查找包含"累计收益率"文本的标签元素
        for (let i = 0; i < fundRows.length; i++) {
            const label = fundRows[i].querySelector('.fund-label');
            if (label && label.textContent.includes('累计收益率')) {
                // 获取对应的值元素
                profitElement = fundRows[i].querySelector('.fund-value');
                break;
            }
        }
        
        // 如果找到了累计收益率元素
        if (profitElement) {
            // 获取卡片的标题元素
            const fundHeader = card.querySelector('.fund-header');
            
            // 根据收益率的正负值设置对应的类名
            if (profitElement.classList.contains('positive')) {
                fundHeader.classList.add('positive');
                fundHeader.classList.remove('negative');
            } else if (profitElement.classList.contains('negative')) {
                fundHeader.classList.add('negative');
                fundHeader.classList.remove('positive');
            }
        }
    });
} 
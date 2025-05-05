// 等待DOM完全加载
document.addEventListener('DOMContentLoaded', function() {
  // 初始化计划选项卡功能
  initPlanTabs();
  
  // 添加详情按钮点击事件
  initDetailButtons();
  
  // 添加卡片悬停效果
  initCardHoverEffects();
  
  // 初始化数据
  initializeGridStrategy();
});

/**
 * 初始化计划选项卡切换功能
 */
function initPlanTabs() {
  const planTabs = document.querySelectorAll('.plan-tab');
  
  planTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // 移除所有选项卡的活动状态
      planTabs.forEach(t => t.classList.remove('active'));
      
      // 添加当前选项卡的活动状态
      this.classList.add('active');
      
      // 获取选项卡值
      const planType = this.getAttribute('data-plan');
      
      // 处理计划切换
      handlePlanChange(planType);
    });
  });
}

/**
 * 处理计划类型切换
 * @param {string} planType - 计划类型（150、S或grid）
 */
function handlePlanChange(planType) {
  console.log('切换到计划：', planType);
  
  // 根据不同的计划类型加载不同的页面
  if (planType === '150') {
    // 跳转到150计划页面
    window.location.href = '../public/150plan.html';
  } else if (planType === 'grid') {
    // 跳转到网格策略页面
    window.location.href = '../gridplan.html';
  }
  // 当前已经在S计划页面，不需要跳转
}

/**
 * 初始化详情按钮点击事件
 */
function initDetailButtons() {
  const detailButtons = document.querySelectorAll('.detail-btn');
  
  detailButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      // 阻止事件冒泡，避免与卡片点击事件冲突
      e.stopPropagation();
      
      // 如果按钮被禁用，直接返回
      if (this.classList.contains('disabled')) {
        return;
      }
      
      // 获取基金代码
      const fundCard = this.closest('.fund-card');
      const fundCode = fundCard.getAttribute('data-code');
      
      // 调用查看详情函数
      if (fundCode) {
        showDetails(fundCode);
      }
    });
  });
}

/**
 * 初始化卡片悬停效果
 */
function initCardHoverEffects() {
  const fundCards = document.querySelectorAll('.fund-card');
  
  fundCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
}

/**
 * 获取ETF数据（模拟）
 * 在实际应用中，这个函数应该从API或数据文件中获取数据
 * @returns {Array} ETF数据数组
 */
function getETFData() {
  // 这里只是模拟数据，实际应用中应该从服务器或数据文件获取
  return [
    {
      code: '159920',
      name: '恒生ETF',
      executions: 20,
      profit: 20.76,
      currentLevel: 0.90,
      levelType: '小档',
      buyPrice: 0.927,
      steps: '5/15/30',
      nav: 1.1557,
      navChange: 2.11
    },
    {
      code: '159938',
      name: '医药',
      executions: 22,
      profit: 50.11,
      currentLevel: 0.95,
      levelType: '小档',
      buyPrice: 0.927,
      steps: '5/15/30',
      nav: 1.1900,
      navChange: 15.96
    },
    // 其他ETF数据...
  ];
}

/**
 * 加载ETF数据并渲染卡片（在实际应用中使用）
 */
function loadAndRenderETFData() {
  const etfData = getETFData();
  const container = document.querySelector('.fund-cards');
  
  if (container && etfData.length > 0) {
    // 清空容器
    container.innerHTML = '';
    
    // 渲染每个ETF卡片
    etfData.forEach(etf => {
      const cardHTML = createETFCardHTML(etf);
      container.innerHTML += cardHTML;
    });
    
    // 初始化详情按钮点击事件
    initDetailButtons();
    
    // 初始化卡片悬停效果
    initCardHoverEffects();
  }
}

/**
 * 创建ETF卡片HTML（在实际应用中使用）
 * @param {Object} etf - ETF数据对象
 * @returns {string} 卡片HTML字符串
 */
function createETFCardHTML(etf) {
  // 根据收益率变化确定卡片颜色
  const statusClass = etf.navChange >= 0 ? 'positive' : 'negative';
  
  return `
    <div class="fund-card">
      <div class="fund-card-header ${statusClass}">
        <div class="fund-title">${etf.code}（${etf.name}）</div>
      </div>
      <div class="fund-card-content">
        <div class="fund-data-row">
          <span class="data-label">执行次数</span>
          <span class="data-value">${etf.executions}次</span>
        </div>
        <div class="fund-data-row">
          <span class="data-label">累计收益率</span>
          <span class="data-value profit positive">+${etf.profit}%</span>
        </div>
        <div class="fund-data-row">
          <span class="data-label">当前档位</span>
          <span class="data-value">
            ${etf.currentLevel} <span class="level-type">(${etf.levelType})</span>
          </span>
        </div>
        <div class="fund-data-row">
          <span class="data-label">买入价</span>
          <span class="data-value">${etf.buyPrice}</span>
        </div>
        <div class="fund-data-row">
          <span class="data-label">步长</span>
          <span class="data-value">${etf.steps}</span>
        </div>
        <div class="fund-data-row">
          <span class="data-label">最新净值</span>
          <span class="data-value nav">${etf.nav}</span>
        </div>
        <div class="fund-data-row">
          <span class="data-label">净值对比买入价变化</span>
          <span class="data-value nav-change ${statusClass}">${etf.navChange >= 0 ? '+' : ''}${etf.navChange}%</span>
        </div>
      </div>
      <div class="fund-card-footer ${statusClass}">
        <button class="detail-btn">查看详情</button>
      </div>
    </div>
  `;
}

// 初始化网格策略
function initializeGridStrategy() {
    // 检测数据
    if (!window.gridData || !Array.isArray(window.gridData.funds)) {
        console.error('网格策略数据不存在或格式不正确');
        return;
    }
    
    // 渲染基金卡片
    renderFundCards(window.gridData.funds);
    
    // 设置排序按钮事件
    setupSortButtons();
}

// 渲染基金卡片
function renderFundCards(funds) {
    const container = document.querySelector('.fund-cards');
    if (!container) return;
    
    // 清空容器
    container.innerHTML = '';
    
    // 遍历基金数据创建卡片
    funds.forEach(fund => {
        const card = createFundCard(fund);
        container.appendChild(card);
    });
    
    // 初始化详情按钮点击事件
    initDetailButtons();
    
    // 初始化卡片悬停效果
    initCardHoverEffects();
}

// 创建单个基金卡片
function createFundCard(fund) {
    const card = document.createElement('div');
    card.className = 'fund-card';
    card.setAttribute('data-code', fund.code);
    
    // 如果暂停交易，添加暂停样式
    if (fund.isPaused) {
        card.classList.add('paused-card');
    }
    
    // 如果执行次数为0，添加执行次数为零的样式
    const isZeroExecution = fund.executionCount === 0;
    if (isZeroExecution) {
        card.classList.add('zero-execution-card');
    }
    
    // 设置卡片头部样式 - 根据净值变化而非收益率决定颜色
    const headerClass = fund.netValueChange > 0 ? 'positive' : 'negative';
    
    // 创建卡片HTML内容
    card.innerHTML = `
        <div class="fund-card-header ${headerClass}">
            <div class="fund-title">${fund.name} (${fund.code})</div>
            <div class="fund-code">${formatLevelType(fund.levelType)}</div>
        </div>
        <div class="fund-card-content">
            <div class="fund-data-row">
                <span class="data-label">执行次数</span>
                <span class="data-value execution-count ${isZeroExecution ? 'zero' : ''}">${fund.executionCount}次</span>
            </div>
            <div class="fund-data-row">
                <span class="data-label">累计收益率</span>
                <span class="data-value ${fund.cumulativeYieldRate > 0 ? 'positive' : 'negative'}">
                    ${formatPercentage(fund.cumulativeYieldRate)}
                </span>
            </div>
            <div class="fund-data-row">
                <span class="data-label">最新净值</span>
                <span class="data-value nav">${fund.nav}</span>
            </div>
            <div class="fund-data-row">
                <span class="data-label">净值变化</span>
                <span class="data-value nav-change ${fund.netValueChange > 0 ? 'positive' : 'negative'}">
                    ${formatPercentage(fund.netValueChange)}
                </span>
            </div>
            <div class="fund-data-row">
                <span class="data-label">当前网格位置</span>
                <span class="data-value">${fund.currentPosition}</span>
            </div>
            <div class="fund-data-row">
                <span class="data-label">最后操作</span>
                <span class="data-value">${formatDate(fund.lastOperationTime)}</span>
            </div>
        </div>
        <div class="fund-card-footer ${headerClass}">
            <button class="detail-btn ${isZeroExecution ? 'disabled' : ''}">查看详情</button>
        </div>
    `;
    
    // 添加卡片点击事件 - 整个卡片可点击查看详情，但执行次数为0的卡片不可点击
    if (!isZeroExecution) {
        card.addEventListener('click', function() {
            showDetails(fund.code);
        });
    }
    
    return card;
}

// 设置排序按钮事件
function setupSortButtons() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    
    sortButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            sortButtons.forEach(btn => btn.classList.remove('active'));
            
            // 给当前按钮添加active类
            this.classList.add('active');
            
            // 获取排序类型
            const sortBy = this.getAttribute('data-sort-by');
            
            // 排序并重新渲染
            sortAndRenderFunds(sortBy);
        });
    });
}

// 排序并重新渲染基金
function sortAndRenderFunds(sortBy) {
    if (!window.gridData || !Array.isArray(window.gridData.funds)) return;
    
    const funds = [...window.gridData.funds];
    
    // 根据不同的排序类型进行排序
    switch(sortBy) {
        case 'netValueChangeRate':
            funds.sort((a, b) => b.netValueChange - a.netValueChange);
            break;
        case 'cumulativeYieldRate':
            funds.sort((a, b) => b.cumulativeYieldRate - a.cumulativeYieldRate);
            break;
        case 'executionCount':
            funds.sort((a, b) => b.executionCount - a.executionCount);
            break;
        case 'lastOperationTime':
            funds.sort((a, b) => new Date(b.lastOperationTime) - new Date(a.lastOperationTime));
            break;
        default:
            break;
    }
    
    // 重新渲染基金卡片
    renderFundCards(funds);
}

// 辅助函数：格式化百分比
function formatPercentage(value) {
    if (value === undefined || value === null) return '--';
    
    const num = parseFloat(value);
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
}

// 辅助函数：格式化日期
function formatDate(dateString) {
    if (!dateString) return '--';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()}`;
}

// 辅助函数：格式化网格类型
function formatLevelType(levelType) {
    switch(levelType) {
        case 'standard':
            return '标准网格';
        case 'aggressive':
            return '激进网格';
        case 'conservative':
            return '保守网格';
        default:
            return levelType || '未知类型';
    }
}

// 显示详情
function showDetails(code) {
    // 跳转到详情页面
    window.location.href = `grid-detail.html?code=${code}`;
}

// 示例数据 - 如果没有加载外部数据，使用这个默认数据
if (!window.gridData) {
    window.gridData = {
        funds: [
            {
                code: '159920',
                name: '恒生ETF',
                levelType: 'standard',
                executionCount: 20,
                cumulativeYieldRate: 20.76,
                nav: 1.1557,
                netValueChange: 2.11,
                currentPosition: '0.90(小档)/0.927',
                lastOperationTime: '2023-05-20 13:45:00',
                isPaused: false
            },
            {
                code: '159938',
                name: '医药ETF',
                levelType: 'aggressive',
                executionCount: 22,
                cumulativeYieldRate: 50.11,
                nav: 1.1900,
                netValueChange: 15.96,
                currentPosition: '0.95(小档)/0.927',
                lastOperationTime: '2023-05-15 10:30:00',
                isPaused: false
            },
            {
                code: '512880',
                name: '证券ETF',
                levelType: 'conservative',
                executionCount: 15,
                cumulativeYieldRate: 12.32,
                nav: 0.9890,
                netValueChange: -3.22,
                currentPosition: '1.05(中档)/1.150',
                lastOperationTime: '2023-05-18 14:20:00',
                isPaused: false
            }
        ]
    };
} 
// 等待DOM完全加载
document.addEventListener('DOMContentLoaded', function() {
  // 初始化计划选项卡功能
  initPlanTabs();
  
  // 添加详情按钮点击事件
  initDetailButtons();
  
  // 添加卡片悬停效果
  initCardHoverEffects();
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
    window.location.href = '../150plan.html';
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
    button.addEventListener('click', function() {
      // 获取基金名称
      const fundCard = this.closest('.fund-card');
      const fundName = fundCard.querySelector('.fund-title').textContent;
      
      // 显示基金详情（这里仅显示提示，实际应用中可以显示详细信息）
      alert(`您点击了查看"${fundName}"的详情`);
      
      // 在实际应用中，可以跳转到详情页面或打开详情弹窗
      // window.location.href = `fund-detail.html?fund=${encodeURIComponent(fundName)}`;
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
          <span class="data-value execution-count">${etf.executions}次</span>
        </div>
        <div class="fund-data-row">
          <span class="data-label">累计收益率</span>
          <span class="data-value profit positive">+${etf.profit}%</span>
        </div>
        <div class="fund-data-row">
          <span class="data-label">当前档位/买入价</span>
          <span class="data-value">
            ${etf.currentLevel} <span class="level-type">(${etf.levelType})</span> /${etf.buyPrice}
          </span>
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
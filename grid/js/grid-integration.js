// 与ETF工具主页面集成的函数
document.addEventListener('DOMContentLoaded', function() {
  // 如果页面中存在计划选择器的话，添加网格计划选项卡的支持
  const planTabs = document.querySelectorAll('.plan-tab');
  if (planTabs.length > 0) {
    // 监听网格策略选项卡点击
    const gridPlanTab = document.querySelector('.plan-tab[data-plan="grid"]');
    if (gridPlanTab) {
      gridPlanTab.addEventListener('click', function() {
        // 设置其他选项卡为非激活状态
        planTabs.forEach(tab => tab.classList.remove('active'));
        this.classList.add('active');
        
        // 加载网格交易计算器
        loadGridCalculator();
      });
    }
  }
  
  // 添加直接从其他页面导航到网格计算器的支持
  const gridLinks = document.querySelectorAll('a[href*="grid"], a[data-target="grid"]');
  gridLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      loadGridCalculator();
    });
  });
  
  /**
   * 加载网格交易计算器
   */
  function loadGridCalculator() {
    // 获取主内容区域
    const mainContent = document.querySelector('.plan-data-container');
    if (!mainContent) return;
    
    // 清空当前内容
    mainContent.innerHTML = '';
    
    // 创建iframe加载网格交易计算器
    const iframe = document.createElement('iframe');
    iframe.src = 'grid-trading-calculator.html';
    iframe.style.width = '100%';
    iframe.style.height = '1200px';  // 调整适当高度
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    
    // 添加iframe加载完成事件
    iframe.onload = function() {
      // 可以在这里添加额外的集成代码，如数据传递等
      console.log('网格交易计算器加载完成');
      
      // 设置iframe高度自适应
      autoResizeIframe(iframe);
    };
    
    // 将iframe添加到主内容区域
    mainContent.appendChild(iframe);
    
    // 更新页面标题
    document.title = '网格交易计算器 - ETF工具';
    
    // 更新URL（可选，使用HTML5 History API）
    if (window.history && window.history.pushState) {
      window.history.pushState({page: 'grid'}, '网格交易计算器', '?plan=grid');
    }
  }
  
  /**
   * 自动调整iframe高度以适应内容
   */
  function autoResizeIframe(iframe) {
    try {
      // 尝试获取iframe内部文档高度
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          // 设置iframe高度为内容高度加上一些额外空间
          const height = entry.contentRect.height;
          iframe.style.height = (height + 50) + 'px';
        }
      });
      
      // 观察iframe内部body元素大小变化
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc && iframeDoc.body) {
        resizeObserver.observe(iframeDoc.body);
      }
    } catch (e) {
      console.warn('无法自动调整iframe高度', e);
      // 兜底方案：使用固定高度
      iframe.style.height = '1500px';
    }
  }
  
  // 检查URL参数，如果是网格计划则直接加载
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('plan') === 'grid') {
    // 激活网格选项卡
    planTabs.forEach(tab => tab.classList.remove('active'));
    const gridTab = document.querySelector('.plan-tab[data-plan="grid"]');
    if (gridTab) {
      gridTab.classList.add('active');
    }
    
    // 加载网格计算器
    loadGridCalculator();
  }
}); 
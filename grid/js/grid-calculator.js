// 在DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 初始化Lucide图标
  lucide.createIcons();
  
  // 选项卡切换逻辑
  const tabTriggers = document.querySelectorAll('.tab-trigger');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      // 移除所有选项卡的active类
      tabTriggers.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // 添加当前选项卡的active类
      trigger.classList.add('active');
      const tabId = trigger.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
      
      // 如果切换到网格策略表格，自动生成网格数据
      if (tabId === 'grid') {
        try {
          // 尝试获取表单参数并计算网格
          const params = getFormParams();
          const result = calculateGrid(params);
          
          // 更新表格
          updateGridTable(result.gridData);
          
          // 更新汇总信息
          updateSummaryInfo(result.summary);
          
          console.log('切换选项卡时自动生成网格数据:', result);
        } catch (error) {
          console.error('自动生成网格数据失败:', error);
        }
      }
    });
  });
  
  // 确保最低价初始值设置 - 修改为只在页面首次加载时设置，不修改用户输入的值
  const basePriceElement = document.getElementById('basePrice');
  const minPriceElement = document.getElementById('minPrice');
  const minQuoteUnitElement = document.getElementById('minQuoteUnit');
  
  if (basePriceElement && minPriceElement && minQuoteUnitElement) {
    const basePrice = parseFloat(basePriceElement.value);
    const minQuoteUnit = parseFloat(minQuoteUnitElement.value);
    // 只有当最低价输入框为空时才设置默认值
    if (!isNaN(basePrice) && !isNaN(minQuoteUnit) && (!minPriceElement.value || minPriceElement.value === '')) {
      const decimalPlaces = String(minQuoteUnit).split('.')[1]?.length || 2;
      minPriceElement.value = (basePrice / 2).toFixed(decimalPlaces);
    }
  }
  
  // 交易记录数据
  const transactions = [
    {
      id: 1,
      date: "2023-01-15",
      type: "sell",
      amount: 11400,
      price: 1.0,
      shares: 11400,
      profit: 1200,
      profitRate: 10.5,
      level: 0.85,
      time: "2023-01-15",
      matchBuyTime: "2023-01-05"
    },
    {
      id: 2,
      date: "2023-01-05",
      type: "buy",
      amount: 11475,
      price: 0.85,
      shares: 13500,
      profit: 0,
      profitRate: 0,
      level: 0.85,
      time: "2023-01-05"
    },
    {
      id: 3,
      date: "2023-02-10",
      type: "sell",
      amount: 12180,
      price: 0.84,
      shares: 14500,
      profit: 980,
      profitRate: 8.0,
      level: 0.77,
      time: "2023-02-10",
      matchBuyTime: "2023-01-25"
    },
    {
      id: 4,
      date: "2023-01-25",
      type: "buy",
      amount: 12243,
      price: 0.77,
      shares: 15900,
      profit: 0,
      profitRate: 0,
      level: 0.77,
      time: "2023-01-25"
    },
    {
      id: 5,
      date: "2023-03-05",
      type: "sell",
      amount: 12900,
      price: 1.0,
      shares: 12900,
      profit: 1850,
      profitRate: 14.3,
      level: 0.7,
      time: "2023-03-05",
      matchBuyTime: "2023-02-20"
    },
    {
      id: 6,
      date: "2023-02-20",
      type: "buy",
      amount: 12950,
      price: 0.7,
      shares: 18500,
      profit: 0,
      profitRate: 0,
      level: 0.7,
      time: "2023-02-20"
    },
    {
      id: 7,
      date: "2023-04-01",
      type: "sell",
      amount: 13175,
      price: 0.85,
      shares: 15500,
      profit: 1650,
      profitRate: 12.5,
      level: 0.68,
      time: "2023-04-01",
      matchBuyTime: "2023-03-15"
    },
    {
      id: 8,
      date: "2023-03-15",
      type: "buy",
      amount: 13192,
      price: 0.68,
      shares: 19400,
      profit: 0,
      profitRate: 0,
      level: 0.68,
      time: "2023-03-15"
    },
    {
      id: 9,
      date: "2023-04-20",
      type: "sell",
      amount: 13013,
      price: 0.77,
      shares: 16900,
      profit: 1520,
      profitRate: 11.7,
      level: 0.69,
      time: "2023-04-20",
      matchBuyTime: "2023-04-10"
    },
    {
      id: 10,
      date: "2023-04-10",
      type: "buy",
      amount: 13041,
      price: 0.69,
      shares: 18900,
      profit: 0,
      profitRate: 0,
      level: 0.69,
      time: "2023-04-10"
    },
  ];
  
  // 交易表格排序状态
  let sortField = 'date';
  let sortDirection = 'desc';
  
  // 处理表格排序
  function handleSort(field) {
    if (field === sortField) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'desc';
    }
    
    renderTransactionTable();
  }
  
  // 获取排序图标
  function getSortIcon(field) {
    if (field === sortField) {
      return sortDirection === 'asc' 
        ? '<i data-lucide="arrow-up" class="ml-1 h-4 w-4"></i>'
        : '<i data-lucide="arrow-down" class="ml-1 h-4 w-4"></i>';
    }
    return '<i data-lucide="arrow-up-down" class="ml-1 h-4 w-4"></i>';
  }
  
  // 计算表格统计数据
  function calculateTotals() {
    const sellTransactions = transactions.filter(t => t.type === 'sell');
    const totalProfit = sellTransactions.reduce((sum, t) => sum + t.profit, 0);
    const totalAmount = sellTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalProfitRate = (totalProfit / totalAmount) * 100;
    
    return {
      totalProfit,
      totalAmount,
      totalProfitRate
    };
  }
  
  // 渲染交易表格
  function renderTransactionTable() {
    const transactionTable = document.querySelector('#transactionTable');
    if (!transactionTable) return;
    
    // 创建表头
    const tableHead = document.createElement('thead');
    tableHead.innerHTML = `
      <tr class="bg-slate-100">
        <th class="py-3 px-4 text-left text-sm font-medium text-slate-700">序号</th>
        <th class="py-3 px-4 text-left text-sm font-medium text-slate-700 cursor-pointer" data-sort="date">
          <div class="flex items-center">
            交易日期
            ${getSortIcon('date')}
          </div>
        </th>
        <th class="py-3 px-4 text-left text-sm font-medium text-slate-700">交易类型</th>
        <th class="py-3 px-4 text-left text-sm font-medium text-slate-700 cursor-pointer" data-sort="amount">
          <div class="flex items-center">
            交易金额
            ${getSortIcon('amount')}
          </div>
        </th>
        <th class="py-3 px-4 text-left text-sm font-medium text-slate-700 cursor-pointer" data-sort="price">
          <div class="flex items-center">
            交易价格
            ${getSortIcon('price')}
          </div>
        </th>
        <th class="py-3 px-4 text-left text-sm font-medium text-slate-700 cursor-pointer" data-sort="shares">
          <div class="flex items-center">
            交易股数
            ${getSortIcon('shares')}
          </div>
        </th>
        <th class="py-3 px-4 text-left text-sm font-medium text-slate-700 cursor-pointer" data-sort="profit">
          <div class="flex items-center">
            收益
            ${getSortIcon('profit')}
          </div>
        </th>
        <th class="py-3 px-4 text-left text-sm font-medium text-slate-700 cursor-pointer" data-sort="profitRate">
          <div class="flex items-center">
            收益率
            ${getSortIcon('profitRate')}
          </div>
        </th>
        <th class="py-3 px-4 text-left text-sm font-medium text-slate-700">档位</th>
      </tr>
    `;
    
    // 添加表头点击排序事件
    setTimeout(() => {
      const sortHeaders = tableHead.querySelectorAll('[data-sort]');
      sortHeaders.forEach(header => {
        header.addEventListener('click', () => {
          const field = header.getAttribute('data-sort');
          handleSort(field);
        });
      });
      
      // 重新初始化图标
      lucide.createIcons();
    }, 0);
    
    // 排序交易数据
    const sortedTransactions = [...transactions].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a[sortField]).getTime();
        const dateB = new Date(b[sortField]).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      const valueA = a[sortField];
      const valueB = b[sortField];
      
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      return 0;
    });
    
    // 创建表格主体
    const tableBody = document.createElement('tbody');
    sortedTransactions.forEach((transaction, index) => {
      const tr = document.createElement('tr');
      tr.className = `border-t border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`;
      
      const badgeClass = transaction.type === 'buy'
        ? 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200';
      
      tr.innerHTML = `
        <td class="py-3 px-4 text-sm text-slate-700">${index + 1}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${transaction.date}</td>
        <td class="py-3 px-4 text-sm">
          <span class="${badgeClass}">
            ${transaction.type === 'buy' ? '买入' : '卖出'}
          </span>
        </td>
        <td class="py-3 px-4 text-sm text-slate-700">¥${transaction.amount.toLocaleString()}</td>
        <td class="py-3 px-4 text-sm text-slate-700">¥${transaction.price.toFixed(3)}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${transaction.shares.toLocaleString()}</td>
        <td class="py-3 px-4 text-sm">
          ${transaction.type === 'sell' 
            ? `<span class="text-emerald-600 font-medium">¥${transaction.profit.toLocaleString()}</span>`
            : '<span class="text-slate-400">-</span>'
          }
        </td>
        <td class="py-3 px-4 text-sm">
          ${transaction.type === 'sell'
            ? `<span class="text-emerald-600 font-medium">${transaction.profitRate.toFixed(2)}%</span>`
            : '<span class="text-slate-400">-</span>'
          }
        </td>
        <td class="py-3 px-4 text-sm text-slate-700">${transaction.level.toFixed(2)}</td>
      `;
      
      tableBody.appendChild(tr);
    });
    
    // 计算统计数据
    const { totalProfit, totalProfitRate } = calculateTotals();
    
    // 创建表足
    const tableFoot = document.createElement('tfoot');
    tableFoot.innerHTML = `
      <tr class="bg-slate-100 font-medium">
        <td colspan="6" class="py-3 px-4 text-sm text-right text-slate-700">
          累计收益/收益率:
        </td>
        <td class="py-3 px-4 text-sm text-emerald-600 font-semibold">¥${totalProfit.toLocaleString()}</td>
        <td class="py-3 px-4 text-sm text-emerald-600 font-semibold">${totalProfitRate.toFixed(2)}%</td>
        <td class="py-3 px-4"></td>
      </tr>
    `;
    
    // 清空并重建表格
    transactionTable.innerHTML = '';
    transactionTable.appendChild(tableHead);
    transactionTable.appendChild(tableBody);
    transactionTable.appendChild(tableFoot);
  }
  
  // 初始化交易表格
  renderTransactionTable();
  
  // 获取ETF基本信息
  const etfInfo = {
    code: "510300",
    name: "沪深300ETF",
    executionCount: 28,
    cumulativeReturn: 17.03,
    currentLevel: 0.85,
    currentBuyPrice: 0.85,
    stepSize: 5.0,
    latestNetValue: 0.882,
    priceChange: "+3.76%",
    priceDirection: "up", // or "down"
  };
  
  // 初始化趋势图
  const initTrendChart = () => {
    if (typeof TrendChart === 'undefined') {
      console.error('TrendChart class not found');
      return;
    }
    
    // 转换交易数据
    const chartTransactions = transactions.map(t => ({
      type: t.type,
      time: t.date,
      price: t.price,
      amount: t.amount,
      shares: t.shares,
      level: t.level,
      profit: t.profit,
      profitRate: t.profitRate,
      matchBuyTime: t.matchBuyTime
    }));
    
    // 创建趋势图实例
    const trendChart = new TrendChart('trendChart', chartTransactions, etfInfo.currentLevel);
  };
  
  // 初始化趋势图
  initTrendChart();
  
  // 根据标的类型自动设置默认值
  const targetTypeSelect = document.getElementById('targetType');
  if (targetTypeSelect) {
    targetTypeSelect.addEventListener('change', function() {
      const targetType = this.value;
      let minQuoteUnit, minTradeUnit, basePrice;
      
      switch (targetType) {
        case '中国股票':
          minQuoteUnit = 0.01;
          minTradeUnit = 100;
          basePrice = 1.00;
          break;
        case '中国场内基金':
          minQuoteUnit = 0.001;
          minTradeUnit = 100;
          basePrice = 1.000;
          break;
        case '美国股票':
        case '国外股票':
          minQuoteUnit = 0.01;
          minTradeUnit = 1;
          basePrice = 1.00;
          break;
        case '加密货币':
          minQuoteUnit = 0.0001;
          minTradeUnit = 0.01;
          basePrice = 1.0000;
          break;
        default:
          minQuoteUnit = 0.01;
          minTradeUnit = 100;
          basePrice = 1.00;
      }
      
      // 更新相应字段
      document.getElementById('minQuoteUnit').value = minQuoteUnit;
      document.getElementById('minTradeUnit').value = minTradeUnit;
      document.getElementById('basePrice').value = basePrice;
      
      // 更新最低价默认值 - 修改为只在最低价为空时设置
      const minPriceElement = document.getElementById('minPrice');
      if (minPriceElement && (!minPriceElement.value || minPriceElement.value === '')) {
        minPriceElement.value = (basePrice / 2).toFixed(String(minQuoteUnit).split('.')[1]?.length || 2);
      }
    });
  }
  
  // 为数字输入字段添加验证
  const numberInputs = document.querySelectorAll('input[type="text"]');
  numberInputs.forEach(input => {
    input.addEventListener('input', function() {
      const value = this.value.trim();
      
      // 如果不是空值，则验证是否为有效数字
      if (value !== '' && isNaN(parseFloat(value))) {
        this.classList.add('border-red-500');
        this.classList.remove('border-gray-300');
      } else {
        this.classList.remove('border-red-500');
        this.classList.add('border-gray-300');
      }
      
      // 特殊验证：最低价不应高于基准价
      if (this.id === 'minPrice' || this.id === 'basePrice') {
        const minPrice = parseFloat(document.getElementById('minPrice').value);
        const basePrice = parseFloat(document.getElementById('basePrice').value);
        
        if (!isNaN(minPrice) && !isNaN(basePrice) && minPrice >= basePrice) {
          document.getElementById('minPrice').classList.add('border-red-500');
          document.getElementById('minPrice').classList.remove('border-gray-300');
        }
      }
    });
  });
  
  // 获取表单参数并进行验证
  function getFormParams() {
    const formParams = {
      targetType: document.getElementById('targetType').value,
      minQuoteUnit: parseFloat(document.getElementById('minQuoteUnit').value),
      minTradeUnit: parseInt(document.getElementById('minTradeUnit').value, 10),
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
    
    // 设置最低价 - 只在用户未输入有效值时设置默认值
    if (isNaN(formParams.minPrice) || formParams.minPrice <= 0) {
      formParams.minPrice = parseFloat((formParams.basePrice / 2).toFixed(3));
      document.getElementById('minPrice').value = formParams.minPrice;
    }
    
    // 进行表单验证
    if (isNaN(formParams.basePrice) || formParams.basePrice <= 0) {
      throw new Error('基准价必须是大于0的数值');
    }
    
    if (isNaN(formParams.minTradeUnit) || formParams.minTradeUnit <= 0) {
      throw new Error('最小交易单位必须是大于0的整数');
    }
    
    if (isNaN(formParams.unitAmount) || formParams.unitAmount <= 0) {
      throw new Error('每份金额必须是大于0的数值');
    }
    
    if (isNaN(formParams.minPrice) || formParams.minPrice <= 0) {
      throw new Error('最低价必须是大于0的数值');
    }
    
    if (formParams.minPrice > formParams.basePrice) {
      throw new Error('最低价必须小于基准价');
    }
    
    // 检查网格步长
    if (isNaN(formParams.smallGridStep) || formParams.smallGridStep <= 0) {
      throw new Error('小网步长必须是大于0的数值');
    }
    
    if (isNaN(formParams.mediumGridStep) || formParams.mediumGridStep <= 0) {
      throw new Error('中网步长必须是大于0的数值');
    }
    
    if (isNaN(formParams.largeGridStep) || formParams.largeGridStep <= 0) {
      throw new Error('大网步长必须是大于0的数值');
    }
    
    // 检查系数
    if (isNaN(formParams.levelCoeff) || formParams.levelCoeff < 0) {
      throw new Error('档位加码系数不能为负数');
    }
    
    if (isNaN(formParams.amountCoeff) || formParams.amountCoeff < 0) {
      throw new Error('金额加码系数不能为负数');
    }
    
    if (isNaN(formParams.profitCoeff) || formParams.profitCoeff < 0) {
      throw new Error('保留利润系数不能为负数');
    }
    
    // 设置初始加码档位参数 - 可以后续添加UI输入
    // 小网从第4档开始加码，中网和大网从第2档开始
    formParams.startLevel = 3;
    
    console.log('获取表单参数:', formParams);
    
    return formParams;
  }
  
  // 生成网格按钮点击事件
  const generateGridBtn = document.getElementById('generateGridBtn');
  if (generateGridBtn) {
    generateGridBtn.addEventListener('click', function() {
      try {
        // 显示加载状态
        this.disabled = true;
        this.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 mr-1.5 animate-spin"></i> 计算中...';
        lucide.createIcons(); // 重新初始化图标
        
        // 获取表单参数
        const params = getFormParams();
        
        // 计算网格
        const result = calculateGrid(params);
        
        // 更新表格
        updateGridTable(result.gridData);
        
        // 更新汇总信息
        updateSummaryInfo(result.summary);
        
        // 恢复按钮状态
        this.disabled = false;
        this.innerHTML = '<i data-lucide="calculator" class="h-4 w-4 mr-1.5"></i> 生成网格';
        lucide.createIcons(); // 重新初始化图标
        
        console.log('网格数据生成成功:', result);
      } catch (error) {
        // 恢复按钮状态
        this.disabled = false;
        this.innerHTML = '<i data-lucide="calculator" class="h-4 w-4 mr-1.5"></i> 生成网格';
        lucide.createIcons(); // 重新初始化图标
        
        // 显示错误信息
        alert(`生成网格失败: ${error.message}`);
        console.error('生成网格失败:', error);
      }
    });
  }
  
  // 更新网格表格
  function updateGridTable(gridData) {
    const gridTableBody = document.querySelector('#gridTable tbody');
    if (!gridTableBody) return;
    
    // 清空表格
    gridTableBody.innerHTML = '';
    
    // 如果没有数据
    if (!gridData || gridData.length === 0) {
      const tr = document.createElement('tr');
      tr.className = 'border-t border-slate-200 bg-white';
      tr.innerHTML = '<td colspan="12" class="py-4 px-4 text-center text-sm text-slate-500">暂无网格数据</td>';
      gridTableBody.appendChild(tr);
      return;
    }
    
    // 填充数据
    gridData.forEach((row, index) => {
      const tr = document.createElement('tr');
      tr.className = `border-t border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`;
      
      tr.innerHTML = `
        <td class="py-3 px-4 text-sm text-slate-700">${row.type}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.level.toFixed(2)}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.buyTriggerPrice.toFixed(3)}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.buyPrice.toFixed(3)}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.buyAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.buyQuantity.toLocaleString()}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.sellTriggerPrice.toFixed(3)}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.sellPrice.toFixed(3)}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.sellQuantity.toLocaleString()}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.sellAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
        <td class="py-3 px-4 text-sm ${row.profit >= 0 ? 'text-emerald-600' : 'text-red-600'} font-medium">¥${row.profit.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
        <td class="py-3 px-4 text-sm ${row.profitRate >= 0 ? 'text-emerald-600' : 'text-red-600'} font-medium">${row.profitRate.toFixed(2)}%</td>
      `;
      
      gridTableBody.appendChild(tr);
    });
  }
  
  // 更新汇总信息
  function updateSummaryInfo(summary) {
    if (!summary) return;
    
    // 更新买入金额
    const totalBuyAmountElement = document.getElementById('totalBuyAmount');
    if (totalBuyAmountElement) {
      totalBuyAmountElement.textContent = `¥ ${summary.totalBuyAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    }
    
    // 更新买入股数
    const totalBuyQuantityElement = document.getElementById('totalBuyQuantity');
    if (totalBuyQuantityElement) {
      totalBuyQuantityElement.textContent = summary.totalBuyQuantity.toLocaleString();
    }
    
    // 更新卖出金额
    const totalSellAmountElement = document.getElementById('totalSellAmount');
    if (totalSellAmountElement) {
      totalSellAmountElement.textContent = `¥ ${summary.totalSellAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    }
    
    // 更新卖出股数
    const totalSellQuantityElement = document.getElementById('totalSellQuantity');
    if (totalSellQuantityElement) {
      totalSellQuantityElement.textContent = summary.totalSellQuantity.toLocaleString();
    }
    
    // 更新剩余股数
    const totalSharesElement = document.getElementById('totalShares');
    if (totalSharesElement) {
      totalSharesElement.textContent = summary.totalShares.toLocaleString();
    }
    
    // 更新利润
    const profitElement = document.getElementById('profit');
    if (profitElement) {
      profitElement.textContent = `¥ ${summary.profit.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
      // 根据利润正负添加不同的颜色
      if (summary.profit >= 0) {
        profitElement.classList.remove('text-red-600');
        profitElement.classList.add('text-emerald-600');
      } else {
        profitElement.classList.remove('text-emerald-600');
        profitElement.classList.add('text-red-600');
      }
    }
    
    // 更新利润率
    const profitRateElement = document.getElementById('profitRate');
    if (profitRateElement) {
      profitRateElement.textContent = `${summary.profitRate.toFixed(2)}%`;
      // 根据利润率正负添加不同的图标和颜色
      if (summary.profitRate >= 0) {
        profitRateElement.innerHTML = `${summary.profitRate.toFixed(2)}% <i data-lucide="trending-up" class="h-3 w-3 ml-1 text-emerald-500"></i>`;
        profitRateElement.classList.remove('text-red-600');
        profitRateElement.classList.add('text-emerald-600');
      } else {
        profitRateElement.innerHTML = `${summary.profitRate.toFixed(2)}% <i data-lucide="trending-down" class="h-3 w-3 ml-1 text-red-500"></i>`;
        profitRateElement.classList.remove('text-emerald-600');
        profitRateElement.classList.add('text-red-600');
      }
      // 重新初始化图标
      lucide.createIcons();
    }
  }
  
  // 保存网格按钮点击事件
  const saveGridBtn = document.getElementById('saveGridBtn');
  if (saveGridBtn) {
    saveGridBtn.addEventListener('click', () => {
      alert('网格保存功能尚未实现，将在未来版本中添加');
    });
  }
  
  // 详情按钮点击事件
  const infoButton = document.getElementById('infoButton');
  if (infoButton) {
    infoButton.addEventListener('click', () => {
      alert('ETF详情功能尚未实现，将在未来版本中添加');
    });
  }
  
  // 添加全局测试方法，便于从控制台调用
  window.testGridCalculator = testGridCalculator;
  window.testGridLevelsCalculation = testGridLevelsCalculation;
  
  // 在控制台显示使用提示
  console.log('提示: 可以通过控制台调用 testGridCalculator() 来测试网格计算引擎');
  console.log('提示: 可以通过控制台调用 testGridLevelsCalculation() 来测试档位加码计算');
  
  // 自动计算并显示初始网格数据
  try {
    // 尝试获取表单参数并计算网格
    const params = getFormParams();
    const result = calculateGrid(params);
    
    // 检查当前是否在网格选项卡下
    const gridTab = document.querySelector('.tab-trigger[data-tab="grid"]');
    if (gridTab && gridTab.classList.contains('active')) {
      // 更新表格
      updateGridTable(result.gridData);
      
      // 更新汇总信息
      updateSummaryInfo(result.summary);
    }
    
    // 更新按钮状态为正常
    const generateGridBtn = document.getElementById('generateGridBtn');
    if (generateGridBtn) {
      generateGridBtn.disabled = false;
      generateGridBtn.innerHTML = '<i data-lucide="calculator" class="h-4 w-4 mr-1.5"></i> 生成网格';
      lucide.createIcons(); // 重新初始化图标
    }
    
    console.log('初始网格数据生成成功:', result);
  } catch (error) {
    console.error('初始网格数据生成失败:', error);
  }
});

/**
 * 网格计算引擎
 * 实现基于E大网格策略的计算逻辑
 */

/**
 * 将数值舍入到指定小数位数
 * @param {number} value - 要舍入的数值
 * @param {number} decimals - 小数位数
 * @returns {number} 舍入后的数值
 */
function roundToDecimalPlaces(value, decimals) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * 根据最小报价单位确定舍入的小数位数
 * @param {number} value - 要舍入的数值
 * @param {number} minQuoteUnit - 最小报价单位(如0.01或0.001)
 * @returns {number} 舍入后的数值
 */
function roundToMinQuoteUnit(value, minQuoteUnit) {
  // 计算小数位数
  const decimals = minQuoteUnit.toString().split('.')[1]?.length || 0;
  return roundToDecimalPlaces(value, decimals);
}

/**
 * 将数值四舍五入到最近的单位倍数
 * @param {number} value - 要舍入的数值
 * @param {number} unit - 单位值
 * @returns {number} 舍入后的数值
 */
function roundToUnit(value, unit) {
  if (unit <= 0) return value;
  return Math.round(value / unit) * unit;
}

/**
 * 将数值向下取整到最近的单位倍数
 * @param {number} value - 要向下取整的数值
 * @param {number} unit - 单位值
 * @returns {number} 向下取整后的数值
 */
function floorToUnit(value, unit) {
  if (unit <= 0) return value;
  return Math.floor(value / unit) * unit;
}

/**
 * 计算网格档位值
 * @param {Object} params - 参数对象
 * @param {number} params.basePrice - 基准价
 * @param {number} params.smallGridStep - 小网步长(%)
 * @param {number} params.mediumGridStep - 中网步长(%)
 * @param {number} params.largeGridStep - 大网步长(%)
 * @param {number} params.levelCoeff - 档位加码系数
 * @param {number} params.startLevel - 初始加码档位
 * @param {number} params.minPrice - 最低价
 * @param {number} params.minQuoteUnit - 最小报价单位
 * @returns {Object} 包含小中大网格档位的对象
 */
function calculateLevels(params) {
  const {
    basePrice,
    smallGridStep,
    mediumGridStep,
    largeGridStep,
    levelCoeff,
    startLevel,
    minPrice,
    minQuoteUnit
  } = params;
  
  // 步长已经是小数形式 (从getFormParams传入)
  const smallStep = smallGridStep;
  const mediumStep = mediumGridStep;
  const largeStep = largeGridStep;
  
  // 计算最低档位值（以档位值表示）
  const minLevel = minPrice / basePrice;
  
  // 转换加码系数为小数
  const extraProfitRatio = levelCoeff / 100;
  
  // 1. 计算小网档位
  const smallLevels = [];
  
  // 第1档：固定为1.0
  smallLevels.push({
    type: "小网",
    index: 1,
    value: 1.0
  });
  
  // 计算后续小网档位
  let currentLevel = 1.0;
  let levelIndex = 2; // 从第2档开始
  
  while (true) {
    // 正常步长递减
    let nextLevelValue = currentLevel - smallStep;
    
    // 从第startLevel档的下一档开始应用加码
    if (levelIndex > startLevel) {
      // 累加加码系数，注意加码系数根据档位计算，每档递增
      const levelAdjustment = extraProfitRatio * (levelIndex - startLevel);
      nextLevelValue -= levelAdjustment;
    }
    
    // 舍入到最小报价单位
    nextLevelValue = roundToMinQuoteUnit(nextLevelValue, minQuoteUnit);
    
    // 如果低于最低价，则不再添加此档位
    if (nextLevelValue * basePrice < minPrice) break;
    
    smallLevels.push({
      type: "小网",
      index: levelIndex,
      value: nextLevelValue
    });
    
    currentLevel = nextLevelValue;
    levelIndex++;
  }
  
  // 2. 计算中网档位
  const mediumLevels = [];
  
  // 中网第一档直接设置为0.85
  let mediumFirstLevel = roundToMinQuoteUnit(0.85, minQuoteUnit); // 直接设置为0.85
  
  if (mediumFirstLevel * basePrice >= minPrice) {
    mediumLevels.push({
      type: "中网",
      index: 1,
      value: mediumFirstLevel
    });
    
    // 中网后续档位
    currentLevel = mediumFirstLevel;
    levelIndex = 2; // 从第2档开始
    
    while (true) {
      // 正常步长递减
      let nextLevelValue = currentLevel - mediumStep;
      
      // 中网第2档起应用加码，加码系数为小网的2倍
      if (levelIndex >= 2) {
        // 加码系数是小网的2倍，每档递增
        const levelAdjustment = extraProfitRatio * 2 * (levelIndex - 1);
        nextLevelValue -= levelAdjustment;
      }
      
      // 舍入到最小报价单位
      nextLevelValue = roundToMinQuoteUnit(nextLevelValue, minQuoteUnit);
      
      // 如果低于最低价，则不再添加此档位
      if (nextLevelValue * basePrice < minPrice) break;
      
      mediumLevels.push({
        type: "中网",
        index: levelIndex,
        value: nextLevelValue
      });
      
      currentLevel = nextLevelValue;
      levelIndex++;
    }
  }
  
  // 3. 计算大网档位
  const largeLevels = [];
  
  // 大网第一档直接设置为0.70
  let largeFirstLevel = roundToMinQuoteUnit(0.70, minQuoteUnit); // 直接设置为0.70
  
  if (largeFirstLevel * basePrice >= minPrice) {
    largeLevels.push({
      type: "大网",
      index: 1,
      value: largeFirstLevel
    });
    
    // 大网后续档位
    currentLevel = largeFirstLevel;
    levelIndex = 2; // 从第2档开始
    
    while (true) {
      // 正常步长递减
      let nextLevelValue = currentLevel - largeStep;
      
      // 大网第2档起应用加码，加码系数为小网的3倍
      if (levelIndex >= 2) {
        // 加码系数是小网的3倍，每档递增
        const levelAdjustment = extraProfitRatio * 3 * (levelIndex - 1);
        nextLevelValue -= levelAdjustment;
      }
      
      // 舍入到最小报价单位
      nextLevelValue = roundToMinQuoteUnit(nextLevelValue, minQuoteUnit);
      
      // 如果低于最低价，则不再添加此档位
      if (nextLevelValue * basePrice < minPrice) break;
      
      largeLevels.push({
        type: "大网",
        index: levelIndex,
        value: nextLevelValue
      });
      
      currentLevel = nextLevelValue;
      levelIndex++;
    }
  }
  
  console.log('计算的档位数量:', {
    '小网': smallLevels.length,
    '中网': mediumLevels.length,
    '大网': largeLevels.length
  });
  
  return { small: smallLevels, medium: mediumLevels, large: largeLevels };
}

/**
 * 计算单个档位的详细信息
 * @param {Object} levelData - 档位数据
 * @param {number} targetSellPrice - 当前档位对应的目标卖出价（通常是上一档买入价）
 * @param {Object} params - 参数对象
 * @returns {Object} 档位详细信息
 */
function calculateSingleLevelDetails(levelData, targetSellPrice, params) {
  const {
    basePrice,
    unitAmount,
    amountCoeff,
    profitCoeff,
    minTradeUnit,
    minQuoteUnit,
    smallGridStep
  } = params;
  
  const { type, index, value } = levelData;
  
  // 1. 买入价和触发价计算
  const buyPrice = roundToMinQuoteUnit(basePrice * value, minQuoteUnit);
  const buyTriggerPrice = roundToMinQuoteUnit(buyPrice + 0.005, minQuoteUnit);
  
  // 2. 金额和股数计算
  // 买入金额计算 = 每份金额 + 每份金额 × 金额加码系数 × (1 - 档位值)
  const buyAmountCalculated = unitAmount + unitAmount * amountCoeff * (1 - value);
  
  // 买入股数 = 买入金额 ÷ 买入价，向下取整到最小交易单位
  const buySharesCalculated = buyAmountCalculated / buyPrice;
  const actualBuyShares = floorToUnit(buySharesCalculated, minTradeUnit);
  
  // 实际买入金额
  const actualBuyAmount = roundToDecimalPlaces(actualBuyShares * buyPrice, 2);
  
  // 3. 卖出价和触发价计算
  let sellPrice, sellTriggerPrice;
  
  // 小网第一档特殊处理
  if (type === "小网" && index === 1) {
    // 卖出价 = 买入价 * (1 + 小网步长)
    sellPrice = roundToMinQuoteUnit(buyPrice * (1 + params.smallGridStep), minQuoteUnit);
    sellTriggerPrice = roundToMinQuoteUnit(sellPrice - 0.005, minQuoteUnit); // 触发价略低于卖出价
  } else {
    // 其他档位：卖出价 = 传入的目标卖出价
    sellPrice = targetSellPrice;
    // 如果传入的目标价无效（例如大网第一档），提供一个回退值或进行错误处理
    if (isNaN(sellPrice) || sellPrice === null || sellPrice <= buyPrice) {
        console.warn(`无效的 targetSellPrice ${targetSellPrice} for level ${type} ${index} (value ${value}). 使用 buyPrice + smallStep 作为估算.`);
        // 尝试基于买入价和步长估算一个卖出价，但这可能不完全符合策略
        sellPrice = roundToMinQuoteUnit(buyPrice * (1 + smallGridStep), minQuoteUnit); 
    }
    sellTriggerPrice = roundToMinQuoteUnit(sellPrice - 0.005, minQuoteUnit);
  }
  
  // 确保 sellPrice > buyPrice
  if (sellPrice <= buyPrice) {
      console.warn(`计算得到的卖出价 (${sellPrice}) 不高于买入价 (${buyPrice}) for level ${type} ${index}. 调整卖出价。`);
      // 至少增加一个最小报价单位
      sellPrice = roundToMinQuoteUnit(buyPrice + minQuoteUnit, minQuoteUnit);
      sellTriggerPrice = roundToMinQuoteUnit(sellPrice - 0.005, minQuoteUnit);
  }
  
  // 4. 计算利润
  const profit = (sellPrice - buyPrice) * actualBuyShares;
  
  // 5. 计算保留股数 = 利润 × 保留系数 ÷ 卖出价
  let reservedShares = 0;
  if (profit > 0) {
    reservedShares = profit * profitCoeff / sellPrice;
    // 四舍五入到最小交易单位
    reservedShares = roundToUnit(reservedShares, minTradeUnit);
  }
  
  // 6. 计算卖出股数 = 买入股数 - 保留股数
  const actualSellShares = actualBuyShares - reservedShares;
  
  // 7. 计算卖出金额
  const actualSellAmount = roundToDecimalPlaces(actualSellShares * sellPrice, 2);
  
  // 8. 计算利润率 = 利润 ÷ 买入金额 × 100
  const profitRate = actualBuyAmount > 0 ? (profit / actualBuyAmount) * 100 : 0;
  
  return {
    type,
    level: value,
    buyTriggerPrice,
    buyPrice,
    buyAmount: actualBuyAmount,
    buyQuantity: actualBuyShares,
    sellTriggerPrice,
    sellPrice,
    sellQuantity: actualSellShares,
    sellAmount: actualSellAmount,
    reservedShares,
    profit: roundToDecimalPlaces(profit, 2),
    profitRate: roundToDecimalPlaces(profitRate, 2)
  };
}

/**
 * 计算网格数据
 * @param {Object} params - 参数对象
 * @returns {Object} 计算结果，包含网格数据和汇总信息
 */
function calculateGrid(params) {
  const levels = calculateLevels(params);
    
  // 2. 按 小网 -> 中网 -> 大网 的顺序计算详细数据
  const gridData = [];
  let lastCalculatedBuyPrice = null; // 用于传递给下一组的第一个档位

  // 辅助函数：计算买入价
  const calculateBuyPrice = (levelValue) => roundToMinQuoteUnit(params.basePrice * levelValue, params.minQuoteUnit);

  // 辅助函数：处理一个网格组
  const processLevelsGroup = (groupLevels) => {
    const groupResults = [];
    let groupLastBuyPrice = null;
    for (let i = 0; i < groupLevels.length; i++) {
      const levelData = groupLevels[i];
      let targetSellPrice;

      if (levelData.type === "小网" && levelData.index === 1) {
        // 小网第一档，使用固定的卖出价目标 (1.05 * basePrice)
        targetSellPrice = roundToMinQuoteUnit(params.basePrice * 1.05, params.minQuoteUnit);
      } else if (i > 0) {
        // 同组内的非第一档，使用上一档的买入价作为卖出目标
        targetSellPrice = calculateBuyPrice(groupLevels[i - 1].value);
      } else {
        // 组内第一档（非小网第一档），使用上一组最后一个档位的买入价
        targetSellPrice = lastCalculatedBuyPrice;
      }

      // 如果 targetSellPrice 无效（例如上一组为空），设置一个回退值
      if (targetSellPrice === null || isNaN(targetSellPrice)) {
          console.warn(`无法确定 ${levelData.type} 组第一档的 targetSellPrice，使用基准价作为回退。`);
          targetSellPrice = params.basePrice; // 或者其他更合适的逻辑
      }
      
      const levelDetails = calculateSingleLevelDetails(levelData, targetSellPrice, params);
      groupResults.push(levelDetails);
      groupLastBuyPrice = levelDetails.buyPrice; // 记录当前档位的买入价
    }
    lastCalculatedBuyPrice = groupLastBuyPrice; // 更新上一组的最后买入价
    return groupResults;
  };

  // 处理小网
  gridData.push(...processLevelsGroup(levels.small));

  // 处理中网
  gridData.push(...processLevelsGroup(levels.medium));

  // 处理大网
  gridData.push(...processLevelsGroup(levels.large));

  // 3. 计算汇总信息 (现在基于最终排序的 gridData)
  const summary = calculateSummary(gridData, params);
  
  return {
    gridData,
    summary
  };
}

/**
 * 计算网格汇总信息
 * @param {Array} gridData - 网格数据
 * @param {Object} params - 参数对象
 * @returns {Object} 汇总信息
 */
function calculateSummary(gridData, params) {
  // 初始化汇总数据
  let totalBuyAmount = 0;
  let totalBuyQuantity = 0;
  let totalSellAmount = 0;
  let totalSellQuantity = 0;
  
  // 累加每个档位的数据
  for (const row of gridData) {
    totalBuyAmount += row.buyAmount;
    totalBuyQuantity += row.buyQuantity;
    totalSellAmount += row.sellAmount;
    totalSellQuantity += row.sellQuantity;
  }
  
  // 确保数值准确性，避免浮点数累加误差
  totalBuyAmount = roundToDecimalPlaces(totalBuyAmount, 2);
  totalSellAmount = roundToDecimalPlaces(totalSellAmount, 2);
  
  // 计算剩余股数、利润和利润率
  const totalShares = totalBuyQuantity - totalSellQuantity;
  
  // 按照公式计算总利润: 总卖出金额 - 总买入金额 + 总剩余股数 * 基准价
  const profit = roundToDecimalPlaces(totalSellAmount - totalBuyAmount + totalShares * params.basePrice, 2);
  
  // 按照公式计算总利润率: 总利润 / 总买入金额 * 100
  let profitRate = 0;
  if (totalBuyAmount > 0) {
    profitRate = roundToDecimalPlaces((profit / totalBuyAmount) * 100, 2);
  } else if (profit > 0) {
    // 极端情况：买入金额为0但有利润
    profitRate = 100; // 设置为100%作为上限
  }
  
  return {
    totalBuyAmount,
    totalBuyQuantity,
    totalSellAmount,
    totalSellQuantity,
    totalShares,
    profit,
    profitRate
  };
}

// 测试函数，用于验证网格计算引擎
function testGridCalculator() {
  // 创建一组测试参数
  const testParams = {
    basePrice: 1.000,                // 基准价
    unitAmount: 10000,               // 每份金额
    minPrice: 0.500,                 // 最低价
    smallGridStep: 0.05,             // 小网步长(5%)
    mediumGridStep: 0.15,            // 中网步长(15%)
    largeGridStep: 0.30,             // 大网步长(30%)
    levelCoeff: 1.0,                 // 档位加码系数
    startLevel: 4,                   // 初始加码档位（小网从第4档开始）
    amountCoeff: 1.0,                // 金额加码系数
    profitCoeff: 1.0,                // 保留利润系数
    minTradeUnit: 100,               // 最小交易单位
    minQuoteUnit: 0.001              // 最小报价单位
  };
  
  // 计算网格
  const result = calculateGrid(testParams);
  
  // 输出结果到控制台，便于验证
  console.log('===== 网格计算引擎测试 =====');
  console.log('参数：', testParams);
  console.log('生成的档位数量：', result.gridData.length);
  console.log('小网档位数量：', result.gridData.filter(d => d.type === '小网').length);
  console.log('中网档位数量：', result.gridData.filter(d => d.type === '中网').length);
  console.log('大网档位数量：', result.gridData.filter(d => d.type === '大网').length);
  console.log('第一档详情：', result.gridData[0]);
  console.log('第四档详情（应受档位加码影响）：', result.gridData[3]);
  console.log('汇总信息：', result.summary);
  console.log('===== 测试结束 =====');
  
  // 自动更新UI
  updateGridTable(result.gridData);
  updateSummaryInfo(result.summary);
  
  return result;
}

// 测试网格档位加码计算逻辑
function testGridLevelsCalculation() {
  console.log('===== 开始测试网格档位加码计算 =====');
  
  // 测试参数
  const testParams = {
    basePrice: 1.000,
    smallGridStep: 0.05,
    mediumGridStep: 0.15,
    largeGridStep: 0.30,
    levelCoeff: 1.0, // 1% 加码
    startLevel: 3, // 小网从第3档开始加码
    minPrice: 0.100,
    minQuoteUnit: 0.001
  };
  
  // 计算档位
  const levels = calculateLevels(testParams);
  
  // 输出小网档位
  console.log('小网档位:');
  levels.small.forEach(level => {
    console.log(`档位 ${level.index}: ${level.value.toFixed(4)}`);
  });
  
  // 验证小网加码：从第3档开始，应该比正常计算值低
  if (levels.small.length >= 4) {
    const level3 = levels.small.find(l => l.index === 3);
    const level4 = levels.small.find(l => l.index === 4);
    const expectedLevel4WithoutBonus = level3.value * (1 - testParams.smallGridStep/100);
    console.log(`小网第4档: 实际值=${level4.value.toFixed(4)}, 不加码计算值=${expectedLevel4WithoutBonus.toFixed(4)}`);
    console.log(`小网第4档加码效果: ${(expectedLevel4WithoutBonus - level4.value).toFixed(4)}`);
  }
  
  // 输出中网档位
  console.log('中网档位:');
  levels.medium.forEach(level => {
    console.log(`档位 ${level.index}: ${level.value.toFixed(4)}`);
  });
  
  // 验证中网加码：从第2档开始，应该比正常计算值低
  if (levels.medium.length >= 2) {
    const level1 = levels.medium.find(l => l.index === 1);
    const level2 = levels.medium.find(l => l.index === 2);
    const expectedLevel2WithoutBonus = level1.value * (1 - testParams.mediumGridStep/100);
    console.log(`中网第2档: 实际值=${level2.value.toFixed(4)}, 不加码计算值=${expectedLevel2WithoutBonus.toFixed(4)}`);
    console.log(`中网第2档加码效果: ${(expectedLevel2WithoutBonus - level2.value).toFixed(4)}`);
  }
  
  // 输出大网档位
  console.log('大网档位:');
  levels.large.forEach(level => {
    console.log(`档位 ${level.index}: ${level.value.toFixed(4)}`);
  });
  
  // 验证大网加码：从第2档开始，应该比正常计算值低
  if (levels.large.length >= 2) {
    const level1 = levels.large.find(l => l.index === 1);
    const level2 = levels.large.find(l => l.index === 2);
    const expectedLevel2WithoutBonus = level1.value * (1 - testParams.largeGridStep/100);
    console.log(`大网第2档: 实际值=${level2.value.toFixed(4)}, 不加码计算值=${expectedLevel2WithoutBonus.toFixed(4)}`);
    console.log(`大网第2档加码效果: ${(expectedLevel2WithoutBonus - level2.value).toFixed(4)}`);
  }
  
  console.log('===== 网格档位加码计算测试结束 =====');
  return levels;
} 
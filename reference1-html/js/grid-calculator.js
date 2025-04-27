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
    });
  });
  
  // 网格数据
  const gridData = [
    {
      type: "小网",
      level: 1.0,
      buyTouchPrice: 1.005,
      buyPrice: 1.0,
      buyAmount: 10000,
      buyQuantity: 10000,
      sellTouchPrice: 1.045,
      sellPrice: 1.05,
      sellQuantity: 9500,
      sellAmount: 9975,
    },
    {
      type: "小网",
      level: 0.95,
      buyTouchPrice: 0.955,
      buyPrice: 0.95,
      buyAmount: 10450,
      buyQuantity: 11000,
      sellTouchPrice: 0.995,
      sellPrice: 1.0,
      sellQuantity: 10400,
      sellAmount: 10400,
    },
    {
      type: "小网",
      level: 0.9,
      buyTouchPrice: 0.905,
      buyPrice: 0.9,
      buyAmount: 10980,
      buyQuantity: 12200,
      sellTouchPrice: 0.945,
      sellPrice: 0.95,
      sellQuantity: 11500,
      sellAmount: 10925,
    },
    {
      type: "小网",
      level: 0.84,
      buyTouchPrice: 0.845,
      buyPrice: 0.84,
      buyAmount: 11592,
      buyQuantity: 13800,
      sellTouchPrice: 0.895,
      sellPrice: 0.9,
      sellQuantity: 12800,
      sellAmount: 11520,
    },
    {
      type: "小网",
      level: 0.77,
      buyTouchPrice: 0.775,
      buyPrice: 0.77,
      buyAmount: 12243,
      buyQuantity: 15900,
      sellTouchPrice: 0.835,
      sellPrice: 0.84,
      sellQuantity: 14500,
      sellAmount: 12180,
    },
    {
      type: "小网",
      level: 0.69,
      buyTouchPrice: 0.695,
      buyPrice: 0.69,
      buyAmount: 13041,
      buyQuantity: 18900,
      sellTouchPrice: 0.765,
      sellPrice: 0.77,
      sellQuantity: 16900,
      sellAmount: 13013,
    },
    {
      type: "小网",
      level: 0.6,
      buyTouchPrice: 0.605,
      buyPrice: 0.6,
      buyAmount: 13980,
      buyQuantity: 23300,
      sellTouchPrice: 0.685,
      sellPrice: 0.69,
      sellQuantity: 20200,
      sellAmount: 13938,
    },
    {
      type: "中网",
      level: 0.85,
      buyTouchPrice: 0.855,
      buyPrice: 0.85,
      buyAmount: 11475,
      buyQuantity: 13500,
      sellTouchPrice: 0.995,
      sellPrice: 1.0,
      sellQuantity: 11400,
      sellAmount: 11400,
    },
    {
      type: "中网",
      level: 0.68,
      buyTouchPrice: 0.685,
      buyPrice: 0.68,
      buyAmount: 13192,
      buyQuantity: 19400,
      sellTouchPrice: 0.845,
      sellPrice: 0.85,
      sellQuantity: 15500,
      sellAmount: 13175,
    },
    {
      type: "大网",
      level: 0.7,
      buyTouchPrice: 0.705,
      buyPrice: 0.7,
      buyAmount: 12950,
      buyQuantity: 18500,
      sellTouchPrice: 0.995,
      sellPrice: 1.0,
      sellQuantity: 12900,
      sellAmount: 12900,
    },
  ];
  
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
    
    // 添加表格下方的信息
    const tableInfo = document.createElement('div');
    tableInfo.className = 'text-xs text-slate-500 mt-4 text-right';
    
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds} ${year}-${month}-${day}`;
    
    tableInfo.textContent = `共 ${transactions.length} 条交易记录 | 更新时间: ${timeString}`;
    
    const transactionTabContent = document.getElementById('transactions-tab');
    if (transactionTabContent) {
      // 检查是否已经有信息元素
      const existingInfo = transactionTabContent.querySelector('.text-xs.text-slate-500.mt-4');
      if (existingInfo) {
        existingInfo.replaceWith(tableInfo);
      } else {
        transactionTabContent.appendChild(tableInfo);
      }
    }
  }
  
  // 填充网格表格数据
  const gridTableBody = document.querySelector('#gridTable tbody');
  if (gridTableBody) {
    gridTableBody.innerHTML = '';
    gridData.forEach((row, index) => {
      const tr = document.createElement('tr');
      tr.className = `border-t border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`;
      
      tr.innerHTML = `
        <td class="py-3 px-4 text-sm text-slate-700">${row.type}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.level.toFixed(2)}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.buyTouchPrice.toFixed(3)}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.buyPrice.toFixed(3)}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.buyAmount}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.buyQuantity}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.sellTouchPrice.toFixed(3)}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.sellPrice.toFixed(3)}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.sellQuantity}</td>
        <td class="py-3 px-4 text-sm text-slate-700">${row.sellAmount}</td>
      `;
      
      gridTableBody.appendChild(tr);
    });
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
  
  // 生成网格按钮点击事件
  const generateGridBtn = document.getElementById('generateGridBtn');
  if (generateGridBtn) {
    generateGridBtn.addEventListener('click', () => {
      // 在实际应用中，这里会根据输入的参数计算新的网格数据
      alert('网格生成功能尚未实现，将在未来版本中添加');
    });
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
  
  // 更新时间
  const updateTime = document.getElementById('updateTime');
  if (updateTime) {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    updateTime.textContent = `更新时间: ${hours}:${minutes}:${seconds} ${year}-${month}-${day}`;
  }
}); 
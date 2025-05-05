/**
 * ETF趋势图类
 * 用于绘制ETF价格趋势和交易点位
 */
class TrendChart {
  /**
   * 构造函数
   * @param {string} canvasId - Canvas元素ID
   * @param {Array} transactions - 交易数据数组
   * @param {number} currentLevel - 当前档位
   */
  constructor(canvasId, transactions, currentLevel) {
    this.canvasId = canvasId;
    this.transactions = transactions || [];
    this.currentLevel = currentLevel;
    this.chartInstance = null;
    
    this.sortTransactions();
    this.initChart();
  }
  
  /**
   * 排序交易数据
   */
  sortTransactions() {
    if (!this.transactions || this.transactions.length === 0) return;
    this.transactions.sort((a, b) => {
      return new Date(a.time).getTime() - new Date(b.time).getTime();
    });
  }
  
  /**
   * 初始化图表
   */
  initChart() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) {
      console.error(`Canvas with id ${this.canvasId} not found`);
      return;
    }
    
    // 准备图表数据
    const chartData = this.prepareChartData();
    
    // 创建Chart.js图表
    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: chartData,
      options: this.getChartOptions()
    });
  }

  /**
   * 准备图表数据
   * @returns {Object} Chart.js数据对象
   */
  prepareChartData() {
    if (!this.transactions || this.transactions.length === 0) {
      // 返回空数据结构，避免错误
      return { labels: [], datasets: [] };
    }
    // 提取日期和价格数据
    const dates = this.transactions.map(t => t.time);
    
    // 创建一个包含所有价格的数组，用于计算价格范围
    const allPrices = this.transactions.map(t => t.price);
    
    // 获取所有价格的最小值和最大值
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    
    // 创建价格线数据
    const priceLineData = this.createPriceLineData();
    
    // 获取交易点位数据
    const buyPoints = this.transactions
      .filter(t => t.type === 'buy')
      .map(t => ({ x: t.time, y: t.price }));
    
    const sellPoints = this.transactions
      .filter(t => t.type === 'sell')
      .map(t => ({ x: t.time, y: t.price }));
    
    // 添加档位线
    const levelLines = this.createLevelLines();
    
    // 将所有数据集合并
    const datasets = [
      priceLineData,
      {
        label: '买入',
        data: buyPoints,
        backgroundColor: 'rgba(16, 185, 129, 1)', // emerald-500
        borderColor: 'rgba(16, 185, 129, 1)',
        pointRadius: 6,
        pointHoverRadius: 10, // 鼠标悬停时放大
        showLine: false,
        pointStyle: 'circle', // 改回圆形
        order: 1
      },
      {
        label: '卖出',
        data: sellPoints,
        backgroundColor: 'rgb(239, 68, 68)', // red-500 (保持红色)
        borderColor: 'rgb(239, 68, 68)',
        pointRadius: 6,
        pointHoverRadius: 10, // 鼠标悬停时放大
        showLine: false,
        pointStyle: 'circle', // 改回圆形
        order: 1
      },
      ...levelLines
    ];
    
    return {
      labels: dates,
      datasets: datasets
    };
  }
  
  /**
   * 创建价格线数据
   * @returns {Object} 价格线数据集
   */
  createPriceLineData() {
    if (!this.transactions || this.transactions.length === 0) return { data: [] };
    // 提取所有唯一的日期并排序
    const allDates = [...new Set(this.transactions.map(t => t.time))].sort((a, b) => new Date(a) - new Date(b));
    
    // 对于每个日期，找到该日期中的最高价格作为当天的价格
    const priceData = [];
    
    allDates.forEach((date, index) => {
      const txsOnDate = this.transactions.filter(t => t.time === date);
      if (txsOnDate.length > 0) {
        // 找到该日期的最高价格
        const maxPrice = Math.max(...txsOnDate.map(t => t.price));
        priceData.push({ x: date, y: maxPrice });
      }
    });
    
    return {
      label: 'ETF净值',
      data: priceData,
      borderColor: 'rgba(99, 102, 241, 0.8)', // indigo-500
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
      fill: true,
      order: 2 // 保证价格线在背景
    };
  }
  
  /**
   * 创建档位线数据
   * @returns {Array} 档位线数据集数组
   */
  createLevelLines() {
    if (!this.transactions || this.transactions.length === 0) return [];
    // 提取所有唯一的交易档位
    const levels = [...new Set(this.transactions.map(t => t.level))];
    
    // 对于每个档位，创建一条水平虚线
    return levels.map(level => {
      const isCurrentLevel = Math.abs(level - this.currentLevel) < 0.001;
      
      return {
        label: `档位 ${level.toFixed(2)}${isCurrentLevel ? ' (当前)' : ''}`,
        data: this.transactions.map(t => ({ x: t.time, y: level })),
        borderColor: isCurrentLevel ? 'rgba(245, 158, 11, 0.7)' : 'rgba(156, 163, 175, 0.5)', // 当前档位用amber-500，其他用gray-400
        borderWidth: isCurrentLevel ? 2 : 1,
        borderDash: isCurrentLevel ? [] : [5, 5],
        pointRadius: 0,
        pointHitRadius: 0, // 禁止点击档位线上的点
        tension: 0,
        fill: false,
        hidden: !isCurrentLevel, // 只显示当前档位线
      };
    });
  }
  
  /**
   * 获取图表配置选项
   * @returns {Object} Chart.js配置选项
   */
  getChartOptions() {
    const self = this;
    
    return {
      responsive: true,
      maintainAspectRatio: false, // 设置为 false 以更好地适应容器
      aspectRatio: 2.5,
      plugins: {
        tooltip: {
          mode: 'nearest',
          intersect: false, // 改为 false 以便更容易触发
          callbacks: {
            title: (tooltipItems) => {
              if (tooltipItems.length > 0) {
                const item = tooltipItems[0];
                const datasetLabel = item.dataset.label || '';
                const date = item.raw.x;
                
                // 对于档位线，显示特殊标题
                if (datasetLabel.startsWith('档位')) {
                  return `${datasetLabel}`;
                }
                
                // 标准格式化日期
                return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
              }
              return '';
            },
            label: (context) => {
              const datasetLabel = context.dataset.label || '';
              const value = context.parsed.y;
              
              if (value === null || typeof value === 'undefined') return null; // 不显示空数据点的tooltip

              // 对于档位线，显示更多信息
              if (datasetLabel.startsWith('档位')) {
                return `价格: ${value.toFixed(3)}`;
              }
              
              // 基本标签
              let label = `${datasetLabel}: ${value.toFixed(3)}`;
              
              // 获取对应的交易数据
              const date = context.raw.x;
              const pointData = this.transactions.find(t => 
                  t.time === date && 
                  Math.abs(t.price - value) < 0.0001 && 
                  ((datasetLabel === '买入' && t.type === 'buy') || (datasetLabel === '卖出' && t.type === 'sell'))
              );

              // 对于买卖点，添加更多信息
              if (pointData) {
                if (pointData.type === 'buy') {
                  label += ` | 金额: ¥${pointData.amount} | 股数: ${pointData.shares}`;
                } else if (pointData.type === 'sell') {
                  label += ` | 利润: ¥${pointData.profit} | 收益率: ${pointData.profitRate.toFixed(2)}%`;
                }
              }
              
              return label;
            }
          }
        },
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true, // 使用点样式图例
            padding: 15,
            font: {
              family: "'Noto Sans SC', sans-serif"
            },
            filter: (legendItem) => {
              // 只显示 ETF净值、买入、卖出 和 当前档位 的图例
              return ['ETF净值', '买入', '卖出'].includes(legendItem.text) || legendItem.text.includes('(当前)');
            }
          }
        },
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'yyyy-MM-dd', // Tooltip 显示完整日期
            displayFormats: {
              day: 'MM/dd' // X轴刻度显示 月/日
            }
          },
          title: {
            display: false, // 移除X轴标题
          },
          ticks: {
            font: {
              family: "'Noto Sans SC', sans-serif",
              size: 11
            }
          }
        },
        y: {
          title: {
            display: false, // 移除Y轴标题
          },
          ticks: {
            font: {
              family: "'Noto Sans SC', sans-serif",
              size: 11
            },
            callback: (value) => {
              return value.toFixed(3);
            }
          }
        }
      },
      hover: {
        mode: 'nearest',
        intersect: false, // 改为 false
        animationDuration: 0 // 禁用悬停动画
      },
      interaction: {
        mode: 'nearest', // 改回 nearest 以便tooltip显示
        intersect: false,
        axis: 'x' // 限制为X轴交互
      },
      elements: {
        line: {
          borderWidth: 1.5, // 统一线条宽度
          tension: 0.4 // 平滑曲线
        },
        point: {
          radius: function(context) {
            // 只在买卖点显示点
            const label = context.dataset.label;
            return (label === '买入' || label === '卖出') ? 4 : 0;
          },
          hoverRadius: function(context) {
            const label = context.dataset.label;
            return (label === '买入' || label === '卖出') ? 6 : 0;
          },
          hitRadius: 10 // 增加点的命中半径，便于选中
        }
      },
      animations: false // 禁用所有动画以提高性能和一致性
    };
  }
  
  /**
   * 更新图表数据
   * @param {Array} newTransactions - 新的交易数据
   */
  updateData(newTransactions) {
    if (!this.chartInstance) return;
    
    this.transactions = newTransactions || [];
    this.sortTransactions();
    
    const newData = this.prepareChartData();
    
    // 更新主图表
    this.chartInstance.data = newData;
    this.chartInstance.update('none');
  }
  
  /**
   * 显示或隐藏特定数据集
   * @param {string} datasetLabel - 数据集标签
   * @param {boolean} visible - 是否可见
   */
  toggleDataset(datasetLabel, visible) {
    if (!this.chartInstance) return;
    const datasetIndex = this.chartInstance.data.datasets.findIndex(ds => ds.label === datasetLabel);
    if (datasetIndex !== -1) {
      this.chartInstance.setDatasetVisibility(datasetIndex, visible);
      this.chartInstance.update();
    }
  }
  
  /**
   * 显示全部档位线
   * @param {boolean} visible - 是否可见
   */
  showAllLevels(visible) {
    if (!this.chartInstance) return;
    this.chartInstance.data.datasets.forEach((dataset, index) => {
      if (dataset.label && dataset.label.startsWith('档位')) {
        // 如果是当前档位，则始终可见
        const isCurrent = dataset.label.includes('(当前)');
        this.chartInstance.setDatasetVisibility(index, visible || isCurrent);
      }
    });
    this.chartInstance.update();
  }
  
  /**
   * 销毁图表实例
   */
  destroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}

// 确保Chart.js已加载
if (typeof Chart === 'undefined') {
  console.error('Chart.js库未加载，趋势图将无法显示');
}

// 导出TrendChart类
window.TrendChart = TrendChart;

// 导出初始化函数
window.initTrendChart = function(transactions, currentLevel) {
  // 销毁之前的实例（如果存在）
  if (window.trendChartInstance) {
    window.trendChartInstance.destroy();
  }
  
  // 创建新实例
  window.trendChartInstance = new TrendChart('trendChart', transactions, currentLevel);
  
  return window.trendChartInstance.chartInstance;
}; 
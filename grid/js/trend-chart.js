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
    this.transactions = transactions;
    this.currentLevel = currentLevel;
    this.chartInstance = null;
    
    this.sortTransactions();
    this.initChart();
  }
  
  /**
   * 排序交易数据
   */
  sortTransactions() {
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
        pointHoverRadius: 8,
        showLine: false,
        pointStyle: 'triangle',
        rotation: 180,
        order: 1
      },
      {
        label: '卖出',
        data: sellPoints,
        backgroundColor: 'rgba(59, 130, 246, 1)', // blue-500
        borderColor: 'rgba(59, 130, 246, 1)',
        pointRadius: 6,
        pointHoverRadius: 8,
        showLine: false,
        pointStyle: 'triangle',
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
        tension: 0,
        fill: false,
        hidden: !isCurrentLevel // 只显示当前档位线
      };
    });
  }
  
  /**
   * 获取图表配置选项
   * @returns {Object} Chart.js配置选项
   */
  getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              const datasetLabel = context.dataset.label || '';
              const value = context.parsed.y;
              let label = `${datasetLabel}: ${value.toFixed(3)}`;
              
              // 对于买卖点，添加更多信息
              const dataPointIndex = context.dataIndex;
              if (datasetLabel === '买入' && dataPointIndex >= 0) {
                const txs = this.transactions.filter(t => t.type === 'buy');
                if (txs[dataPointIndex]) {
                  const tx = txs[dataPointIndex];
                  label += ` | 金额: ¥${tx.amount} | 股数: ${tx.shares}`;
                }
              } else if (datasetLabel === '卖出' && dataPointIndex >= 0) {
                const txs = this.transactions.filter(t => t.type === 'sell');
                if (txs[dataPointIndex]) {
                  const tx = txs[dataPointIndex];
                  label += ` | 利润: ¥${tx.profit} | 收益率: ${tx.profitRate.toFixed(2)}%`;
                }
              }
              
              return label;
            }
          }
        },
        legend: {
          position: 'top',
          labels: {
            font: {
              family: "'Noto Sans SC', sans-serif"
            },
            filter: (legendItem) => {
              // 过滤掉除当前档位外的所有档位线
              if (legendItem.text.startsWith('档位') && !legendItem.text.includes('(当前)')) {
                return false;
              }
              return true;
            }
          }
        },
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'yyyy-MM-dd'
            }
          },
          title: {
            display: true,
            text: '日期'
          }
        },
        y: {
          title: {
            display: true,
            text: '价格'
          },
          // 自动计算适当的y轴范围
          ticks: {
            callback: (value) => {
              return value.toFixed(3);
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      animations: {
        tension: {
          duration: 1000,
          easing: 'linear'
        }
      }
    };
  }
  
  /**
   * 更新图表数据
   * @param {Array} newTransactions - 新的交易数据
   */
  updateData(newTransactions) {
    if (!this.chartInstance) return;
    
    this.transactions = newTransactions;
    this.sortTransactions();
    
    const newData = this.prepareChartData();
    this.chartInstance.data = newData;
    this.chartInstance.update();
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
        this.chartInstance.setDatasetVisibility(index, visible);
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
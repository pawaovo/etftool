/**
 * 资产分布趋势图JavaScript
 * 用于加载和展示垂直资产占比趋势图
 * 直接使用从class-distribution.json加载的数据
 */

// 全局变量：图表边距
const margin = { top: 60, right: 50, bottom: 100, left: 50 }; // 增加顶部边距，确保y轴百分比信息正常显示；增加右侧边距，确保右侧时间轴标签不被截断；保持足够的底部空间给时间轴；保持左侧边距给y轴标签

// 颜色映射 - 确保与页面上的图例颜色一致
const colorMapping = {
    'CHINA_STOCK': '#e74c3c',         // A股
    'CHINA_BOND': '#f1c40f',          // 境内债券
    'OVERSEA_STOCK_EMERGING': '#3498db', // 海外新兴市场股票
    'OVERSEA_STOCK_MATURE': '#2ecc71', // 海外成熟市场股票
    'CASH': '#9b59b6',                // 现金
    'GOLD': '#f39c12',                // 黄金
    'OIL': '#e67e22',                 // 原油
    'OVERSEA_BOND': '#1abc9c'         // 海外债券
};

// 资产类型代码到中文名称的映射
const assetCodeToNameMap = { // Renamed from assetTypeMap
    'CHINA_STOCK': 'A股',
    'CHINA_BOND': '境内债券',
    'OVERSEA_STOCK_EMERGING': '海外新兴市场股票',
    'OVERSEA_STOCK_MATURE': '海外成熟市场股票',
    'CASH': '现金',
    'GOLD': '黄金',
    'OIL': '原油',
    'OVERSEA_BOND': '海外债券'
};

/**
 * 将毫秒级时间戳转换为标准日期格式（YYYY-MM-DD）
 * @param {number} timestamp - 毫秒级时间戳
 * @returns {string} 格式化的日期字符串
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 将毫秒级时间戳转换为年月格式（YYYY-MM）
 * @param {number} timestamp - 毫秒级时间戳
 * @returns {string} 格式化的年月字符串
 */
function formatMonthYear(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * 页面加载完成后初始化趋势图
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM已加载，准备初始化资产分布图表');
    
    // 添加调试信息
    console.log('页面标题元素检查:');
    console.log('.card-header-title:', document.querySelector('.card-header-title'));
    console.log('.card-content h3:', document.querySelector('.card-content h3'));
    console.log('#vertical-trend-chart 父元素:', document.getElementById('vertical-trend-chart')?.parentElement);
    console.log('#vertical-trend-chart 父元素中的h3:', document.getElementById('vertical-trend-chart')?.parentElement?.querySelector('h3'));
    
    // 显示加载状态
    const chartContainer = document.getElementById('vertical-trend-chart');
    if (chartContainer) {
        console.log('找到图表容器，尺寸:', chartContainer.clientWidth, 'x', chartContainer.clientHeight);
        console.log('图表容器父元素:', chartContainer.parentElement);
        
        const loadingElement = document.createElement('div');
        loadingElement.className = 'chart-loading';
        loadingElement.style.textAlign = 'center';
        loadingElement.style.padding = '40px';
        loadingElement.style.color = '#666';
        loadingElement.innerHTML = '正在加载数据...<br><small>请稍候</small>';
        chartContainer.innerHTML = '';
        chartContainer.appendChild(loadingElement);
    } else {
        console.error('未找到图表容器 #vertical-trend-chart');
    }
    
    // 添加放大查看按钮 - 改为直接创建并插入到图表容器前
    setTimeout(function() {
        console.log('延迟执行添加按钮...');
        addExpandButton();
        
        // 再次检查按钮是否成功添加
        setTimeout(function() {
            // 检查是否有包含"放大查看"文本的按钮
            let buttonExists = false;
            const buttons = document.querySelectorAll('button');
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].textContent.includes('放大查看')) {
                    buttonExists = true;
                    break;
                }
            }
            
            console.log('按钮添加检查:', buttonExists ? '成功' : '失败', '找到按钮数量:', buttons.length);
            
            if (!buttonExists) {
                console.log('尝试强制添加按钮到页面...');
                forceAddExpandButton();
            }
        }, 1000);
    }, 500);
    
    // 设置超时检查 - 8秒
    let dataReadyTimeout = setTimeout(() => {
        console.warn('数据加载超时，尝试直接检查数据');
        if (typeof assetDistributionData !== 'undefined' && Array.isArray(assetDistributionData) && assetDistributionData.length > 0) {
            console.log('找到数据，继续初始化图表');
            initAssetDistributionChart();
        } else {
            console.error('数据加载失败，未能找到有效数据');
            showErrorMessage('数据加载超时<br><small>请通过Web服务器访问页面。右键点击run-local.bat并运行。</small>');
        }
    }, 8000); // 8秒超时
    
    // 监听数据准备完成事件
    document.addEventListener('assetDataReady', function() {
        console.log('收到数据准备完成事件');
        clearTimeout(dataReadyTimeout);
        
        // 检查数据是否有效
        if (typeof assetDistributionData !== 'undefined' && 
            Array.isArray(assetDistributionData) && 
            assetDistributionData.length > 0) {
            
            console.log(`找到资产分布数据：${assetDistributionData.length}条记录`);
            initAssetDistributionChart();
        } else {
            console.error('虽然数据加载完成，但数据无效');
            showErrorMessage('数据无效，请检查控制台日志或刷新页面重试');
        }
    });
    
    // 监听数据加载错误事件
    document.addEventListener('assetDataError', function(event) {
        clearTimeout(dataReadyTimeout);
        console.error('数据加载出错:', event.detail);
        
        showErrorMessage(`数据加载失败<br><small>${event.detail}</small><br>请通过Web服务器访问页面。`);
    });
});

/**
 * 强制添加放大查看按钮
 */
function forceAddExpandButton() {
    // 获取图表容器
    const chartContainer = document.getElementById('vertical-trend-chart');
    if (!chartContainer) return;
    
    // 创建按钮
    const expandButton = document.createElement('button');
    expandButton.textContent = '放大查看';
    expandButton.style.position = 'absolute';
    expandButton.style.top = '10px';
    expandButton.style.right = '10px';
    expandButton.style.zIndex = '100';
    expandButton.style.fontSize = '12px';
    expandButton.style.padding = '3px 8px';
    expandButton.style.border = '1px solid #ddd';
    expandButton.style.borderRadius = '3px';
    expandButton.style.backgroundColor = '#f5f5f5';
    expandButton.style.color = '#666';
    expandButton.style.cursor = 'pointer';
    expandButton.title = '在大窗口中查看趋势图';
    
    // 悬停效果
    expandButton.onmouseover = function() {
        this.style.backgroundColor = '#e8e8e8';
    };
    expandButton.onmouseout = function() {
        this.style.backgroundColor = '#f5f5f5';
    };
    
    // 点击事件
    expandButton.onclick = function() {
        showExpandedChartModal();
    };
    
    // 设置图表容器为相对定位
    chartContainer.style.position = 'relative';
    
    // 添加按钮
    chartContainer.appendChild(expandButton);
    console.log('已强制添加放大查看按钮到图表容器');
}

/**
 * 添加放大查看按钮
 */
function addExpandButton() {
    // 查找标题元素，尝试多种可能的选择器
    const titleContainer = document.querySelector('.card-header-title') || 
                           document.querySelector('.card-content h3') || 
                           document.querySelector('#vertical-trend-chart').parentElement.querySelector('h3') ||
                           document.querySelector('div:has(>#vertical-trend-chart) > h3');
    
    if (!titleContainer) {
        console.error('未找到标题元素，尝试直接添加到图表容器上方');
        
        // 如果找不到标题，直接添加到图表容器上方
        const chartContainer = document.getElementById('vertical-trend-chart');
        if (chartContainer && chartContainer.parentElement) {
            // 创建一个新的标题容器
            const newTitleContainer = document.createElement('div');
            newTitleContainer.style.display = 'flex';
            newTitleContainer.style.justifyContent = 'space-between';
            newTitleContainer.style.alignItems = 'center';
            newTitleContainer.style.marginBottom = '10px';
            
            // 添加标题文本
            const titleText = document.createElement('h3');
            titleText.textContent = '大类资产占比';
            titleText.style.margin = '0';
            titleText.style.fontSize = '16px';
            titleText.style.fontWeight = 'bold';
            
            newTitleContainer.appendChild(titleText);
            
            // 创建放大查看按钮
            const expandButton = createExpandButton();
            newTitleContainer.appendChild(expandButton);
            
            // 插入到图表容器前面
            chartContainer.parentElement.insertBefore(newTitleContainer, chartContainer);
            
            console.log('已创建新标题容器并添加放大查看按钮');
            return;
        }
        
        console.error('也无法找到图表容器，无法添加放大查看按钮');
        return;
    }
    
    console.log('找到标题元素，准备添加放大查看按钮');
    
    // 设置标题容器为相对定位，以便按钮定位
    titleContainer.style.position = 'relative';
    titleContainer.style.display = 'flex';
    titleContainer.style.justifyContent = 'space-between';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.width = '100%';
    
    // 创建并添加放大查看按钮
    const expandButton = createExpandButton();
    
    // 添加按钮到标题元素
    titleContainer.appendChild(expandButton);
    console.log('已将放大查看按钮添加到标题元素');
}

/**
 * 创建放大查看按钮元素
 */
function createExpandButton() {
    const expandButton = document.createElement('button');
    expandButton.textContent = '放大查看';
    expandButton.style.fontSize = '12px';
    expandButton.style.padding = '3px 8px';
    expandButton.style.border = '1px solid #ddd';
    expandButton.style.borderRadius = '3px';
    expandButton.style.backgroundColor = '#f5f5f5';
    expandButton.style.color = '#666';
    expandButton.style.cursor = 'pointer';
    expandButton.style.marginLeft = 'auto'; // 右对齐
    expandButton.title = '在大窗口中查看趋势图';
    
    // 悬停效果
    expandButton.onmouseover = function() {
        this.style.backgroundColor = '#e8e8e8';
    };
    expandButton.onmouseout = function() {
        this.style.backgroundColor = '#f5f5f5';
    };
    
    // 点击事件
    expandButton.onclick = function() {
        showExpandedChartModal();
    };
    
    return expandButton;
}

/**
 * 显示大弹窗趋势图
 */
function showExpandedChartModal() {
    console.log('显示大弹窗趋势图');
    
    // 检查数据是否可用
    if (!assetDistributionData || assetDistributionData.length === 0) {
        console.error('没有资产分布数据可用，无法显示大弹窗');
        alert('数据不可用，无法显示趋势图。');
        return;
    }
    
    // 获取已有的弹窗元素
    const modalElement = document.getElementById('chartModal');
    if (!modalElement) {
        console.error('未找到弹窗元素 #chartModal');
        return;
    }
    
    // 显示弹窗
    modalElement.style.display = 'flex';
    
    // 获取横向图表容器
    const horizontalChartContainer = document.getElementById('horizontal-trend-chart');
    if (!horizontalChartContainer) {
        console.error('未找到横向图表容器 #horizontal-trend-chart');
        return;
    }
    
    // 检查横向图表容器尺寸
    console.log(`横向图表容器尺寸: ${horizontalChartContainer.clientWidth} x ${horizontalChartContainer.clientHeight}`);
    
    // 彻底移除所有旧的tooltip元素，确保不存在旧元素干扰
    const oldTooltips = document.querySelectorAll('.chart-modal-content .modal-tooltip, .chart-modal-content .chart-tooltip');
    oldTooltips.forEach(tooltip => {
        console.log('移除旧的tooltip元素');
        tooltip.parentNode.removeChild(tooltip);
    });
    
    // 创建全新的tooltip元素 - 确保样式与竖向图表的tooltip一致
    const modalTooltip = document.createElement('div');
    modalTooltip.className = 'chart-tooltip modal-tooltip';
    modalTooltip.style.position = 'absolute';
    modalTooltip.style.backgroundColor = 'white';
    modalTooltip.style.border = '1px solid #ddd';
    modalTooltip.style.borderRadius = '4px';
    modalTooltip.style.padding = '8px';
    modalTooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    modalTooltip.style.zIndex = '1001';
    modalTooltip.style.display = 'none';
    modalTooltip.style.minWidth = '180px';
    modalTooltip.style.pointerEvents = 'none'; // 防止工具提示阻止鼠标事件
    modalTooltip.innerHTML = `
        <div class="tooltip-date" style="font-weight:bold;margin-bottom:5px;"></div>
        <div class="tooltip-content"></div>
    `;
    
    // 获取图例容器
    let legendContainer = document.querySelector('.chart-modal-content .modal-legend');
    
    // 确保横向图表容器有固定高度
    horizontalChartContainer.style.height = '550px';
    horizontalChartContainer.style.position = 'relative';
    horizontalChartContainer.style.overflow = 'hidden'; // 防止内容溢出
    
    // 确保图例容器存在并且样式与竖向图表的图例一致
    if (!legendContainer) {
        console.error('未找到弹窗中的图例容器，创建新容器');
        legendContainer = document.createElement('div');
        legendContainer.className = 'modal-legend';
        legendContainer.style.marginTop = '10px';
        legendContainer.style.display = 'flex';
        legendContainer.style.flexWrap = 'wrap';
        legendContainer.style.justifyContent = 'center';
        legendContainer.style.padding = '8px 12px';
        legendContainer.style.borderTop = '1px solid #f0f0f0';
    } else {
        // 更新已存在的图例容器样式
        legendContainer.style.marginTop = '10px';
        legendContainer.style.display = 'flex';
        legendContainer.style.flexWrap = 'wrap';
        legendContainer.style.justifyContent = 'center';
        legendContainer.style.padding = '8px 12px';
        legendContainer.style.borderTop = '1px solid #f0f0f0';
    }
    
    // 添加到弹窗内容区域 - 确保容器元素存在
    const modalContent = document.querySelector('.chart-modal-content');
    if (!modalContent) {
        console.error('未找到弹窗内容区域 .chart-modal-content');
        return;
    }
    
    // 先清空图表容器
    horizontalChartContainer.innerHTML = '';
    
    // 添加tooltip到弹窗内容区域
    modalContent.appendChild(modalTooltip);
    
    // 确保图例容器被添加到弹窗内容区域
    if (!legendContainer.parentNode) {
        modalContent.appendChild(legendContainer);
    }
    
    console.log('准备初始化横向图表，容器和工具提示已准备好');
    
    // 立即初始化图表，不使用延迟
    try {
        // 初始化横向图表
        initHorizontalChart(horizontalChartContainer, modalTooltip, legendContainer);
        console.log('横向图表初始化完成');
    } catch (error) {
        console.error('横向图表初始化失败:', error);
        horizontalChartContainer.innerHTML = `<div style="color:red;text-align:center;padding:20px;">图表初始化失败: ${error.message}</div>`;
    }
}

/**
 * 初始化横向趋势图
 */
function initHorizontalChart(chartContainer, tooltipElement, legendContainer) {
    // 在函数开始处添加tooltip初始化代码
    if (!tooltipElement) {
        console.warn('未提供工具提示元素，创建新的工具提示元素');
        tooltipElement = document.createElement('div');
        tooltipElement.className = 'chart-tooltip';
        tooltipElement.style.position = 'absolute';
        tooltipElement.style.backgroundColor = 'white';
        tooltipElement.style.border = '1px solid #ddd';
        tooltipElement.style.borderRadius = '4px';
        tooltipElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        tooltipElement.style.padding = '8px';
        tooltipElement.style.fontSize = '12px';
        tooltipElement.style.zIndex = '1000';
        tooltipElement.style.display = 'none'; // 默认隐藏
        tooltipElement.style.pointerEvents = 'none'; // 防止工具提示阻止鼠标事件
        tooltipElement.innerHTML = `
            <div class="tooltip-date" style="font-weight:bold;margin-bottom:5px;"></div>
            <div class="tooltip-content"></div>
        `;
        
        // 添加到DOM
        const modalContent = document.querySelector('.chart-modal-content');
        if (modalContent) {
            modalContent.appendChild(tooltipElement);
        }
    }
    
    if (!chartContainer) {
        console.error('未找到横向趋势图容器');
        return;
    }
    
    // 清空容器
    chartContainer.innerHTML = '';
    
    try {
        // 获取容器尺寸
        const containerWidth = chartContainer.clientWidth || 1000;
        const containerHeight = chartContainer.clientHeight || 550;
        
        console.log(`横向图表尺寸: ${containerWidth}x${containerHeight}`);
        
        // 创建SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${containerWidth} ${containerHeight}`);
        svg.style.display = 'block';
        svg.style.fontFamily = 'Noto Sans SC, Arial, sans-serif'; // 添加字体样式，与竖向图表保持一致
        
        // 添加滚动轴的高度
        const scrollbarHeight = 15;
        const scrollbarMarginTop = 8;
        
        // 横向图表边距 - 考虑滚动条
        const hMargin = { 
            top: 20, 
            right: 20, 
            bottom: 50 + scrollbarHeight + scrollbarMarginTop, 
            left: 40 
        };
        
        // 创建图表组
        const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        chartGroup.setAttribute('transform', `translate(${hMargin.left}, ${hMargin.top})`);
        
        const width = containerWidth - hMargin.left - hMargin.right;
        const height = containerHeight - hMargin.top - hMargin.bottom;
        
        // 创建滚动轴组
        const scrollbarGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        scrollbarGroup.setAttribute('transform', `translate(${hMargin.left}, ${hMargin.top + height + scrollbarMarginTop})`);
        scrollbarGroup.setAttribute('class', 'scrollbar-group');
        svg.appendChild(scrollbarGroup);
        
        // 绘制滚动轴
        drawTimeScrollbar(scrollbarGroup, width, scrollbarHeight);
        
        // 绘制横向趋势图 - 使用完整日期范围
        const fullMinDate = assetDistributionData[0].compDate;
        const fullMaxDate = assetDistributionData[assetDistributionData.length - 1].compDate;
        drawHorizontalTrendChart(chartGroup, width, height, fullMinDate, fullMaxDate);
        
        // 将SVG添加到容器
        svg.appendChild(chartGroup);
        chartContainer.appendChild(svg);
        
        // 添加图表交互功能
        setupHorizontalChartInteractions(svg, chartGroup, width, height, tooltipElement, scrollbarGroup, scrollbarHeight);
        
        // 添加图表交互式图例
        addHorizontalLegend(legendContainer);
        
        console.log('横向资产分布趋势图初始化完成');
    } catch (error) {
        console.error('绘制横向图表时发生错误:', error);
        chartContainer.innerHTML = `<div style="color:red;text-align:center;padding:20px;">图表渲染错误: ${error.message}</div>`;
    }
}

/**
 * 绘制横向趋势图
 */
function drawHorizontalTrendChart(chartGroup, width, height, minDate, maxDate) {
    const numPoints = assetDistributionData.length;
    console.log(`绘制横向趋势图，数据点数量: ${numPoints}`);
    
    if (numPoints === 0) return;
    
    // 资产类型列表
    const assetTypes = Object.keys(assetCodeToNameMap);
    
    // 计算时间比例尺（时间在X轴）- 使用传入的日期范围或默认范围
    const effectiveMinDate = minDate || assetDistributionData[0].compDate;
    const effectiveMaxDate = maxDate || assetDistributionData[numPoints - 1].compDate;
    
    const xScale = (timestamp) => {
        return width * (timestamp - effectiveMinDate) / (effectiveMaxDate - effectiveMinDate);
    };
    
    // 计算比例尺，将百分比转换为Y轴位置
    const yScale = (percent) => height * (1 - percent);
    
    // 绘制网格线和坐标轴
    drawHorizontalGridAndAxes(chartGroup, width, height);
    
    // 绘制重叠区域，传递日期范围参数
    drawHorizontalOverlaidAreas(chartGroup, assetTypes, xScale, yScale, height, effectiveMinDate, effectiveMaxDate);
    
    // 绘制时间轴标记 - 传递当前显示的日期范围
    const currentDateRange = {
        minDate: effectiveMinDate,
        maxDate: effectiveMaxDate
    };
    drawHorizontalTimeAxisMarkers(chartGroup, xScale, width, height, currentDateRange);
}

/**
 * 绘制横向图表的网格线和坐标轴
 */
function drawHorizontalGridAndAxes(chartGroup, width, height) {
    // X轴（时间轴）- 放在底部
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', 0);
    xAxis.setAttribute('y1', height);
    xAxis.setAttribute('x2', width);
    xAxis.setAttribute('y2', height);
    xAxis.setAttribute('stroke', '#ccc');
    xAxis.setAttribute('stroke-width', 1);
    xAxis.setAttribute('pointer-events', 'none');
    chartGroup.appendChild(xAxis);
    
    // Y轴（百分比）- 放在左侧
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', 0);
    yAxis.setAttribute('y1', 0);
    yAxis.setAttribute('x2', 0);
    yAxis.setAttribute('y2', height);
    yAxis.setAttribute('stroke', '#ccc');
    yAxis.setAttribute('stroke-width', 1);
    yAxis.setAttribute('pointer-events', 'none');
    chartGroup.appendChild(yAxis);
    
    // Y轴网格线和标签
    const percentGridLines = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    
    percentGridLines.forEach(percent => {
        const y = height * (1 - percent);
        
        // 水平网格线
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', 0);
        gridLine.setAttribute('y1', y);
        gridLine.setAttribute('x2', width);
        gridLine.setAttribute('y2', y);
        gridLine.setAttribute('stroke', '#eee');
        gridLine.setAttribute('stroke-width', 1);
        gridLine.setAttribute('stroke-dasharray', '3,3');
        gridLine.setAttribute('pointer-events', 'none');
        chartGroup.appendChild(gridLine);
        
        // 百分比标签 (放在左侧)
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', -5);
        label.setAttribute('y', y + 4);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('font-size', '11');
        label.setAttribute('fill', '#666');
        label.setAttribute('pointer-events', 'none');
        label.textContent = `${(percent * 100).toFixed(0)}%`;
        chartGroup.appendChild(label);
    });
}

/**
 * 绘制横向重叠区域 (不是堆叠的)
 */
function drawHorizontalOverlaidAreas(chartGroup, assetTypes, xScale, yScale, height, minDate, maxDate) {
    try {
        console.log('开始绘制横向重叠区域');
        
        // 检查参数
        if (!chartGroup || !assetTypes || !xScale || !yScale) {
            console.error('绘制横向重叠区域缺少必要参数');
                    return;
                }
    
    if (!assetDistributionData || assetDistributionData.length === 0) {
        console.error('没有资产分布数据可用');
        return;
    }

        // 日期范围处理，不传则使用全部数据
    const effectiveMinDate = minDate || assetDistributionData[0].compDate;
    const effectiveMaxDate = maxDate || assetDistributionData[assetDistributionData.length - 1].compDate;
    
        // 过滤出在当前日期范围内的数据点
        const filteredData = assetDistributionData.filter(point => 
        point.compDate >= effectiveMinDate && point.compDate <= effectiveMaxDate
    );
    
        // 如果没有数据在当前范围内，使用全部数据
        const dataToUse = filteredData.length > 0 ? filteredData : assetDistributionData;
    
    // 计算所有时间点每种资产的平均占比
    const avgDistributions = {};
    assetTypes.forEach(type => {
        let sum = 0;
        let count = 0;
        
            dataToUse.forEach(dataPoint => {
                if (dataPoint.distribution && dataPoint.distribution[type] !== undefined) {
                sum += dataPoint.distribution[type];
                count++;
            }
        });
        
        avgDistributions[type] = count > 0 ? sum / count : 0;
    });
    
    // 按平均占比从小到大排序资产类型（先绘制占比大的，后绘制占比小的）
    const sortedTypes = [...assetTypes].sort((a, b) => {
        return avgDistributions[b] - avgDistributions[a];
    });
            
        console.log(`绘制 ${sortedTypes.length} 种资产类型区域`);
    
    // 绘制每种资产类型的区域
    sortedTypes.forEach(assetType => {
            try {
        // 创建路径
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // 构建路径数据点
        let pathData = '';
        
        // 从底部开始
                dataToUse.forEach((dataPoint, index) => {
                    if (!dataPoint.compDate) {
                        console.error('数据点缺少compDate属性:', dataPoint);
                        return;
                    }
                    
                    const value = dataPoint.distribution ? (dataPoint.distribution[assetType] || 0) : 0;
                    const x = xScale(dataPoint.compDate);
                    const y = yScale(value);
            
            if (index === 0) {
                pathData = `M${x},${y}`;
            } else {
                pathData += ` L${x},${y}`;
            }
        });
        
                // 关闭路径 - 返回到底部
                const lastX = xScale(dataToUse[dataToUse.length - 1].compDate);
                pathData += ` L${lastX},${height}`;
                pathData += ` L${xScale(dataToUse[0].compDate)},${height}`;
        pathData += ' Z'; // 闭合路径
        
        // 设置路径样式
        path.setAttribute('d', pathData);
                path.setAttribute('fill', colorMapping[assetType] || '#ccc');
        path.setAttribute('fill-opacity', '0.7');
                path.setAttribute('stroke', colorMapping[assetType] || '#ccc');
        path.setAttribute('stroke-width', '1');
        path.setAttribute('data-asset-type', assetType);
                path.setAttribute('pointer-events', 'all'); // 确保路径可以接收鼠标事件
                path.setAttribute('class', 'asset-path');
                
                // 添加悬停效果
                path.addEventListener('mouseenter', function() {
                    this.setAttribute('fill-opacity', '0.9');
                    this.setAttribute('stroke-width', '2');
                });
                
                path.addEventListener('mouseleave', function() {
                    this.setAttribute('fill-opacity', '0.7');
                    this.setAttribute('stroke-width', '1');
                });
        
        // 添加到图表
        chartGroup.appendChild(path);
            } catch (error) {
                console.error(`绘制资产类型 ${assetType} 区域时发生错误:`, error);
            }
    });
    } catch (error) {
        console.error('绘制横向重叠区域时发生错误:', error);
    }
}

/**
 * 绘制横向时间轴标记和垂直网格线
 * @param {SVGGElement} chartGroup - SVG图表组元素
 * @param {Function} xScale - X轴比例尺函数
 * @param {number} width - 图表宽度
 * @param {number} height - 图表高度
 * @param {Object} dateRange - 日期范围对象，包含minDate和maxDate属性
 */
function drawHorizontalTimeAxisMarkers(chartGroup, xScale, width, height, dateRange) {
    try {
        console.log('开始绘制水平时间轴标记');
        
        // 使用传入的日期范围，而非全局数据范围
        // 这样在缩放时可以显示对应区域的时间标签
        const minDate = dateRange && dateRange.minDate ? dateRange.minDate : assetDistributionData[0].compDate;
        const maxDate = dateRange && dateRange.maxDate ? dateRange.maxDate : assetDistributionData[assetDistributionData.length - 1].compDate;
        const totalTimespan = maxDate - minDate;
        
        console.log(`水平时间轴日期范围: ${formatDate(minDate)} - ${formatDate(maxDate)}`);
        
        // 根据时间跨度自动确定时间间隔
        const determineInterval = () => {
            // 根据总时间跨度确定合适的间隔
            const days = totalTimespan / (24 * 60 * 60 * 1000);
            
            if (days <= 14) return 'day'; // 小于2周，按天显示
            if (days <= 60) return 'week'; // 小于2个月，按周显示
            if (days <= 180) return 'month'; // 小于6个月，按月显示
            if (days <= 730) return 'quarter'; // 小于2年，按季度显示
            return 'year'; // 大于2年，按年显示
        };
        
        const interval = determineInterval();
        console.log(`横向时间轴使用间隔: ${interval}, 总跨度: ${totalTimespan / (24 * 60 * 60 * 1000)}天`);
        
        // 根据间隔生成标记点
        const timeMarkers = [];
        let currentDate = new Date(minDate);
        
        // 调整到合适的时间参考点
        if (interval === 'day') {
            currentDate.setHours(0, 0, 0, 0);
        } else if (interval === 'week') {
            const dayOfWeek = currentDate.getDay();
            currentDate.setDate(currentDate.getDate() - dayOfWeek);
            currentDate.setHours(0, 0, 0, 0);
        } else if (interval === 'month' || interval === 'quarter') {
            currentDate.setDate(1);
            currentDate.setHours(0, 0, 0, 0);
        } else if (interval === 'year') {
            currentDate.setMonth(0, 1);
            currentDate.setHours(0, 0, 0, 0);
        }
        
        // 根据间隔递增日期
        while (currentDate.getTime() <= maxDate) {
            const timestamp = currentDate.getTime();
            
            if (timestamp >= minDate) {
                timeMarkers.push({
                    timestamp: timestamp,
                    label: formatTimeLabel(timestamp, interval)
                });
            }
            
            // 递增到下一个时间点
            if (interval === 'day') {
                currentDate.setDate(currentDate.getDate() + 1);
            } else if (interval === 'week') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (interval === 'month') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else if (interval === 'quarter') {
                currentDate.setMonth(currentDate.getMonth() + 3);
    } else {
                currentDate.setFullYear(currentDate.getFullYear() + 1);
            }
        }
        
        // 如果标记点太多，筛选一部分
        let filteredMarkers = timeMarkers;
        if (timeMarkers.length > 10) {
            const skip = Math.ceil(timeMarkers.length / 10);
            filteredMarkers = timeMarkers.filter((_, index) => index % skip === 0);
            
            // 确保包含最后一个标记点
            if (timeMarkers.length > 0 && 
                filteredMarkers[filteredMarkers.length - 1] !== timeMarkers[timeMarkers.length - 1]) {
                filteredMarkers.push(timeMarkers[timeMarkers.length - 1]);
            }
        }
        
        console.log(`生成了 ${filteredMarkers.length} 个时间轴标记点`);
    
    // 绘制标记和标签
        filteredMarkers.forEach(marker => {
            try {
                const x = xScale(marker.timestamp);
        
                // 绘制垂直标记线
        const markerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                markerLine.setAttribute('x1', x);
                markerLine.setAttribute('y1', height);
                markerLine.setAttribute('x2', x);
                markerLine.setAttribute('y2', height + 5);
        markerLine.setAttribute('stroke', '#999');
        markerLine.setAttribute('stroke-width', 1);
        markerLine.setAttribute('pointer-events', 'none');
        chartGroup.appendChild(markerLine);
        
                // 添加日期标签
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', x);
                label.setAttribute('y', height + 16);
                label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '11');
        label.setAttribute('fill', '#666');
        label.setAttribute('pointer-events', 'none');
        label.textContent = marker.label;
        chartGroup.appendChild(label);
        
                // 添加垂直网格线
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                gridLine.setAttribute('x1', x);
                gridLine.setAttribute('y1', 0);
                gridLine.setAttribute('x2', x);
                gridLine.setAttribute('y2', height);
        gridLine.setAttribute('stroke', '#eee');
        gridLine.setAttribute('stroke-width', 1);
        gridLine.setAttribute('stroke-dasharray', '3,3');
        gridLine.setAttribute('pointer-events', 'none');
        chartGroup.appendChild(gridLine);
            } catch (error) {
                console.error('绘制时间轴标记点时出错:', error);
            }
        });
        
        console.log('水平时间轴标记绘制完成');
    } catch (error) {
        console.error('绘制水平时间轴标记时发生错误:', error);
    }
}

/**
 * 设置横向图表交互功能
 */
function setupHorizontalChartInteractions(svg, chartGroup, width, height, tooltipElement, scrollbarGroup, scrollbarHeight, options = {}) {
    try {
        // 保存到全局变量，供其他函数使用
        window.chartGroup = chartGroup;
        
        if (!tooltipElement) {
            console.error('未找到提示框元素 .chart-tooltip，请检查HTML结构');
            showErrorMessage('图表工具提示初始化失败：未找到.chart-tooltip元素');
            return;
        }
        
        // 创建鼠标跟踪线
        const hoverLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hoverLine.setAttribute('stroke', '#999');
        hoverLine.setAttribute('stroke-width', 1);
        hoverLine.setAttribute('stroke-dasharray', '3,3');
        hoverLine.style.display = 'none';
        hoverLine.setAttribute('pointer-events', 'none');
        chartGroup.appendChild(hoverLine);
        
        // 创建缩放信息元素
        const zoomInfoText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        zoomInfoText.setAttribute('fill', '#333');
        zoomInfoText.setAttribute('font-size', '12');
        zoomInfoText.setAttribute('text-anchor', 'middle');
        zoomInfoText.setAttribute('font-family', 'Noto Sans SC, sans-serif');
        zoomInfoText.style.display = 'none';
        zoomInfoText.setAttribute('pointer-events', 'none');
        chartGroup.appendChild(zoomInfoText);
        
        // 缩放状态变量
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const timeRangeState = {
            originalMinDate: assetDistributionData[0].compDate,
            originalMaxDate: assetDistributionData[assetDistributionData.length - 1].compDate,
            minDate: assetDistributionData[0].compDate,
            maxDate: assetDistributionData[assetDistributionData.length - 1].compDate,
            zoomLevel: 1,
            isAnimating: false,
            isDraggingScrollbar: false,
            dragStartX: 0,
            dragType: null // 'slider', 'left-handle', 'right-handle'
        };
        
        // 保存到全局变量，供其他函数使用
        window.timeRangeState = timeRangeState;
        
        // 初始化滚动轴状态
        if (scrollbarGroup) {
        updateScrollbar(
            scrollbarGroup, 
            width, 
                scrollbarHeight || 15, 
            timeRangeState.minDate, 
            timeRangeState.maxDate,
            timeRangeState.originalMinDate, 
            timeRangeState.originalMaxDate
        );
        }
        
        // 创建交互区域 - 稍微扩大以覆盖边缘
        const interactionArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        // 扩展交互区域的高度和宽度，确保完全覆盖图表边缘
        const interactionPadding = 10; // 交互区域的额外边距
        interactionArea.setAttribute('x', -interactionPadding);
        interactionArea.setAttribute('y', -interactionPadding);
        interactionArea.setAttribute('width', width + interactionPadding * 2);
        interactionArea.setAttribute('height', height + interactionPadding * 2);
        interactionArea.setAttribute('fill', 'transparent');
        interactionArea.style.cursor = 'crosshair';
        interactionArea.setAttribute('pointer-events', 'all'); // 确保捕获所有鼠标事件
        // 重要：将交互区域插入到chartGroup的第一个子元素位置，确保它在最底层
        // 这样即使鼠标在其他图表元素上方，也能接收滚轮事件
        chartGroup.insertBefore(interactionArea, chartGroup.firstChild);
        
        // 使用防抖函数减少鼠标移动事件触发频率
        let debounceTimeout;
        const debounce = (func, delay) => {
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => func.apply(context, args), delay);
            };
        };
        
        // 跟踪上一次找到的最近点，避免频繁更新
        let lastClosestIndex = -1;
        
        // 鼠标移动处理
        interactionArea.addEventListener('mousemove', (event) => {
            const svgRect = svg.getBoundingClientRect();
            const mouseY = event.clientY - svgRect.top - margin.top;
            
            // 扩展边界检测，添加边缘容差
            // 允许鼠标稍微超出图表边界时仍然显示最近的数据点信息
            const edgeTolerance = 5; // 边缘容差值，单位为像素
            
            if (mouseY < -edgeTolerance || mouseY > height + edgeTolerance) {
                hoverLine.style.display = 'none';
                tooltipElement.style.display = 'none';
                return;
            }
            
            // 确保鼠标线位置在图表范围内
            const boundedMouseY = Math.max(0, Math.min(height, mouseY));
            
            // 设置水平线位置
            hoverLine.setAttribute('x1', 0);
            hoverLine.setAttribute('y1', boundedMouseY);
            hoverLine.setAttribute('x2', width);
            hoverLine.setAttribute('y2', boundedMouseY);
            hoverLine.style.display = 'block';
            
            // 找到最接近的数据点
            // 计算当前缩放状态下的时间范围
            const approximateDate = timeRangeState.minDate + (1 - boundedMouseY / height) * (timeRangeState.maxDate - timeRangeState.minDate);
            
            let closestIndex = 0;
            let minDistance = Infinity;
            
            assetDistributionData.forEach((point, index) => {
                const distance = Math.abs(point.compDate - approximateDate);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = index;
                }
            });
            
            // 减少内容更新频率，但始终更新位置
            if (closestIndex !== lastClosestIndex) {
                lastClosestIndex = closestIndex;
                const closestPoint = assetDistributionData[closestIndex];
                // 更新工具提示
                updateTooltip(tooltipElement, closestPoint, event.pageX, event.pageY);
            } else {
                // 数据点相同但鼠标移动了，只更新位置
                updateTooltipPosition(tooltipElement, event.pageX, event.pageY);
            }
        });
        
        // 鼠标滚轮事件处理
        interactionArea.addEventListener('wheel', (event) => {
            event.preventDefault(); // 防止页面滚动
            
            if (timeRangeState.isAnimating) return; // 防止动画过程中处理滚轮事件
            
            // 获取鼠标在SVG中的位置
            const svgRect = svg.getBoundingClientRect();
            const mouseY = event.clientY - svgRect.top - margin.top;
            
            // 计算缩放中心点的时间戳
            const centerTimestamp = timeRangeState.minDate + (1 - mouseY / height) * (timeRangeState.maxDate - timeRangeState.minDate);
            
            // 当前时间范围
            const currentRange = timeRangeState.maxDate - timeRangeState.minDate;
            
            // 缩放系数 - 滚轮向上(负delta)为放大，向下(正delta)为缩小
            const zoomFactor = event.deltaY < 0 ? 0.8 : 1.25;
            
            // 计算新的时间范围
            let newRange = currentRange * zoomFactor;
            
            // 检查是否达到最小缩放范围（7天）
            if (newRange < SEVEN_DAYS_MS) {
                newRange = SEVEN_DAYS_MS;
                console.log('已达到最小缩放范围: 7天');
            }
            
            // 检查是否应该重置到原始范围
            if (newRange >= timeRangeState.originalMaxDate - timeRangeState.originalMinDate) {
                // 重置到完整范围
                timeRangeState.minDate = timeRangeState.originalMinDate;
                timeRangeState.maxDate = timeRangeState.originalMaxDate;
                timeRangeState.zoomLevel = 1;
                
                // 显示缩放反馈
                showZoomFeedback("已重置为完整时间范围");
                
                // 更新滚动轴
                if (scrollbarGroup) {
                updateScrollbar(
                    scrollbarGroup, 
                    width, 
                        scrollbarHeight || 15, 
                    timeRangeState.minDate, 
                    timeRangeState.maxDate,
                    timeRangeState.originalMinDate, 
                    timeRangeState.originalMaxDate
                );
                }
                
                // 重绘图表 - 使用水平图表重绘函数
                redrawHorizontalChart();
                
                // 重绘横向图表的时间轴标记
                redrawHorizontalTimeAxisMarkers();
                return;
            }
            
            // 计算新的日期范围，保持鼠标位置对应的时间点不变
            const ratio = (centerTimestamp - timeRangeState.minDate) / currentRange;
            let newMinDate = centerTimestamp - ratio * newRange;
            let newMaxDate = centerTimestamp + (1 - ratio) * newRange;
            
            // 确保不超出数据范围
            if (newMinDate < timeRangeState.originalMinDate) {
                newMinDate = timeRangeState.originalMinDate;
                newMaxDate = newMinDate + newRange;
            }
            
            if (newMaxDate > timeRangeState.originalMaxDate) {
                newMaxDate = timeRangeState.originalMaxDate;
                newMinDate = newMaxDate - newRange;
                
                // 再次检查最小日期边界
                if (newMinDate < timeRangeState.originalMinDate) {
                    newMinDate = timeRangeState.originalMinDate;
                }
            }
            
            // 更新时间范围状态
            timeRangeState.minDate = newMinDate;
            timeRangeState.maxDate = newMaxDate;
            timeRangeState.zoomLevel = (timeRangeState.originalMaxDate - timeRangeState.originalMinDate) / (newMaxDate - newMinDate);
            
            // 显示缩放信息
            showZoomFeedback(`${formatDate(newMinDate)} 至 ${formatDate(newMaxDate)}`);
            
            // 更新滚动轴
            if (scrollbarGroup) {
            updateScrollbar(
                scrollbarGroup, 
                width, 
                    scrollbarHeight || 15, 
                timeRangeState.minDate, 
                timeRangeState.maxDate,
                timeRangeState.originalMinDate, 
                timeRangeState.originalMaxDate
            );
            }
            
            // 重绘图表 - 使用水平图表重绘函数
            redrawHorizontalChart();
            
            // 重绘横向图表的时间轴标记
            redrawHorizontalTimeAxisMarkers();
        });
        
        // 滚动轴滑块拖动相关功能
        if (scrollbarGroup) {
            // 获取滚动轴滑块
        const scrollbarSlider = scrollbarGroup.querySelector('.scrollbar-slider');
        
            if (scrollbarSlider) {
        // 检测点击位置是左侧手柄、右侧手柄还是滑块中间部分
        function getScrollbarDragType(event, sliderX, sliderWidth) {
                    const svgRect = svg.getBoundingClientRect();
                    const mouseX = event.clientX - svgRect.left - margin.left;
            const handleWidth = 10; // 手柄的有效宽度
            
            if (mouseX >= sliderX && mouseX <= sliderX + handleWidth) {
                return 'left-handle';
            } else if (mouseX >= sliderX + sliderWidth - handleWidth && mouseX <= sliderX + sliderWidth) {
                return 'right-handle';
            } else if (mouseX >= sliderX && mouseX <= sliderX + sliderWidth) {
                return 'slider';
            }
            return null;
        }
        
        // 滚动轴滑块鼠标按下事件
        scrollbarSlider.addEventListener('mousedown', (event) => {
            event.preventDefault();
            
            const svgRect = svg.getBoundingClientRect();
            const sliderX = parseFloat(scrollbarSlider.getAttribute('x'));
            const sliderWidth = parseFloat(scrollbarSlider.getAttribute('width'));
            
            timeRangeState.isDraggingScrollbar = true;
            timeRangeState.dragStartX = event.clientX - svgRect.left - margin.left - sliderX;
            timeRangeState.dragType = getScrollbarDragType(event, sliderX, sliderWidth);
            
            // 改变鼠标样式
            if (timeRangeState.dragType === 'left-handle' || timeRangeState.dragType === 'right-handle') {
                scrollbarSlider.style.cursor = 'ew-resize';
            } else {
                scrollbarSlider.style.cursor = 'grabbing';
            }
            
            // 添加全局鼠标事件监听
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        });
        
        // 滚动轴背景点击事件 - 直接跳转到点击位置
        const scrollbarBackground = scrollbarGroup.querySelector('.scrollbar-background');
                if (scrollbarBackground) {
        scrollbarBackground.addEventListener('click', (event) => {
            if (timeRangeState.isDraggingScrollbar) return; // 如果正在拖动，忽略点击
            
            const svgRect = svg.getBoundingClientRect();
            const mouseX = event.clientX - svgRect.left - margin.left;
            const fullRange = timeRangeState.originalMaxDate - timeRangeState.originalMinDate;
            const visibleRange = timeRangeState.maxDate - timeRangeState.minDate;
            
            // 计算点击位置对应的时间戳
            const clickedTime = timeRangeState.originalMinDate + (mouseX / width) * fullRange;
            
            // 将可视区域中心移动到点击位置
            let newMinDate = clickedTime - visibleRange / 2;
            let newMaxDate = clickedTime + visibleRange / 2;
            
            // 边界处理
            if (newMinDate < timeRangeState.originalMinDate) {
                newMinDate = timeRangeState.originalMinDate;
                newMaxDate = newMinDate + visibleRange;
            }
            
            if (newMaxDate > timeRangeState.originalMaxDate) {
                newMaxDate = timeRangeState.originalMaxDate;
                newMinDate = newMaxDate - visibleRange;
                
                if (newMinDate < timeRangeState.originalMinDate) {
                    newMinDate = timeRangeState.originalMinDate;
                }
            }
            
            // 更新状态
            timeRangeState.minDate = newMinDate;
            timeRangeState.maxDate = newMaxDate;
            
            // 显示信息
            showZoomFeedback(`${formatDate(newMinDate)} 至 ${formatDate(newMaxDate)}`);
            
            // 更新滚动轴
            updateScrollbar(
                scrollbarGroup, 
                width, 
                            scrollbarHeight || 15, 
                timeRangeState.minDate, 
                timeRangeState.maxDate,
                timeRangeState.originalMinDate, 
                timeRangeState.originalMaxDate
            );
            
                        // 重绘竖向图表
            redrawVerticalChart();
        });
                }
        
        // 全局鼠标移动事件处理 - 用于拖拽
        function handleGlobalMouseMove(event) {
            if (!timeRangeState.isDraggingScrollbar) return;
            
            const svgRect = svg.getBoundingClientRect();
            const mouseX = event.clientX - svgRect.left - margin.left;
            const fullRange = timeRangeState.originalMaxDate - timeRangeState.originalMinDate;
            const currentVisibleRange = timeRangeState.maxDate - timeRangeState.minDate;
            
            // 根据拖动类型进行不同的处理
            if (timeRangeState.dragType === 'slider') {
                // 拖动整个滑块 - 移动可视区域
                const sliderPosition = mouseX - timeRangeState.dragStartX;
                
                // 确保滑块不超出滚动轴范围
                        const scrollbarSlider = scrollbarGroup.querySelector('.scrollbar-slider'); // 确保获取到slider
                        const sliderWidth = scrollbarSlider ? parseFloat(scrollbarSlider.getAttribute('width')) : 0;
                        const boundedSliderPosition = Math.max(0, Math.min(width - sliderWidth, sliderPosition));


                // 计算新的时间范围
                let newMinDate = timeRangeState.originalMinDate + (boundedSliderPosition / width) * fullRange;
                let newMaxDate = newMinDate + currentVisibleRange;

                // 边界处理 (确保 newMinDate 不小于 originalMinDate)
                if (newMaxDate > timeRangeState.originalMaxDate) {
                    newMaxDate = timeRangeState.originalMaxDate;
                    newMinDate = Math.max(timeRangeState.originalMinDate, newMaxDate - currentVisibleRange);
                } else if (newMinDate < timeRangeState.originalMinDate) { // 添加这个检查
                    newMinDate = timeRangeState.originalMinDate;
                    newMaxDate = Math.min(timeRangeState.originalMaxDate, newMinDate + currentVisibleRange);
                }

                timeRangeState.minDate = newMinDate;
                timeRangeState.maxDate = newMaxDate;

            }
            else if (timeRangeState.dragType === 'left-handle') {
                // 拖动左侧手柄 - 调整起始时间
                let newMinDate = timeRangeState.originalMinDate + (mouseX / width) * fullRange;

                // 边界和最小范围检查
                newMinDate = Math.max(timeRangeState.originalMinDate, newMinDate); // 不小于原始最小
                newMinDate = Math.min(newMinDate, timeRangeState.maxDate - SEVEN_DAYS_MS); // 不大于最大减去最小范围

                timeRangeState.minDate = newMinDate;
            }
            else if (timeRangeState.dragType === 'right-handle') {
                // 拖动右侧手柄 - 调整结束时间
                let newMaxDate = timeRangeState.originalMinDate + (mouseX / width) * fullRange;

                // 边界和最小范围检查
                newMaxDate = Math.min(timeRangeState.originalMaxDate, newMaxDate); // 不大于原始最大
                newMaxDate = Math.max(newMaxDate, timeRangeState.minDate + SEVEN_DAYS_MS); // 不小于最小加上最小范围

                timeRangeState.maxDate = newMaxDate;
            }

             // 重新计算缩放级别
            timeRangeState.zoomLevel = (timeRangeState.originalMaxDate - timeRangeState.originalMinDate) / (timeRangeState.maxDate - timeRangeState.minDate);


            // 更新滚动轴
            updateScrollbar(
                scrollbarGroup,
                width,
                        scrollbarHeight || 15,
                timeRangeState.minDate,
                timeRangeState.maxDate,
                timeRangeState.originalMinDate,
                timeRangeState.originalMaxDate
            );

            // 重绘横向图表 (修正)
            redrawHorizontalChart();
            // 重绘横向时间轴标记 (添加)
            redrawHorizontalTimeAxisMarkers();
        }
        
        // 全局鼠标抬起事件处理
        function handleGlobalMouseUp() {
            if (timeRangeState.isDraggingScrollbar) {
                timeRangeState.isDraggingScrollbar = false;
                scrollbarSlider.style.cursor = 'grab';
                
                // 移除全局事件监听
                document.removeEventListener('mousemove', handleGlobalMouseMove);
                document.removeEventListener('mouseup', handleGlobalMouseUp);
                
                // 显示当前时间范围信息
                showZoomFeedback(`${formatDate(timeRangeState.minDate)} 至 ${formatDate(timeRangeState.maxDate)}`);
                    }
                }
            }
        }
        
        // 显示缩放反馈信息
        function showZoomFeedback(message) {
            zoomInfoText.textContent = message;
            zoomInfoText.setAttribute('x', width / 2);
            zoomInfoText.setAttribute('y', 20);
            zoomInfoText.style.display = 'block';
            
            // 设置淡出动画
            setTimeout(() => {
                zoomInfoText.style.opacity = '1';
                zoomInfoText.style.transition = 'opacity 0.5s ease-in-out';
                
                setTimeout(() => {
                    zoomInfoText.style.opacity = '0';
                    
                    setTimeout(() => {
                        zoomInfoText.style.display = 'none';
                        zoomInfoText.style.transition = '';
                        zoomInfoText.style.opacity = '1';
                    }, 500);
                }, 1500);
            }, 10);
        }
        
        // 重绘垂直图表函数
        function redrawVerticalChart() {
            // 清空图表组，但保留特定元素
            const elementsToKeep = [interactionArea, hoverLine, zoomInfoText];
            
            Array.from(chartGroup.children).forEach(child => {
                if (!elementsToKeep.includes(child)) {
                    chartGroup.removeChild(child);
                }
            });
            
            // 重新绘制竖向图表
            drawVerticalTrendChart(chartGroup, width, height, timeRangeState.minDate, timeRangeState.maxDate);
            
            // 确保交互元素在顶层
            elementsToKeep.forEach(el => {
                chartGroup.appendChild(el);
            });
        }
        
        // 添加重绘水平图表函数
        function redrawHorizontalChart() {
            // 清空图表组，但保留特定元素
            const elementsToKeep = [interactionArea, hoverLine, zoomInfoText];
            
            Array.from(chartGroup.children).forEach(child => {
                if (!elementsToKeep.includes(child)) {
                    chartGroup.removeChild(child);
                }
            });
            
            // 重新绘制水平图表 - 传递当前的时间范围
            drawHorizontalTrendChart(chartGroup, width, height, timeRangeState.minDate, timeRangeState.maxDate);
            
            // 确保交互元素在顶层
            elementsToKeep.forEach(el => {
                chartGroup.appendChild(el);
            });
        }
        
        // 鼠标离开处理
        interactionArea.addEventListener('mouseleave', () => {
            hoverLine.style.display = 'none';
            tooltipElement.style.display = 'none';
            lastClosestIndex = -1; // 重置
        });
        
        // 双击重置缩放
        interactionArea.addEventListener('dblclick', () => {
            timeRangeState.minDate = timeRangeState.originalMinDate;
            timeRangeState.maxDate = timeRangeState.originalMaxDate;
            timeRangeState.zoomLevel = 1;
            
            // 显示缩放反馈
            showZoomFeedback("已重置为完整时间范围");
            
            // 更新滚动轴
            if (scrollbarGroup) {
            updateScrollbar(
                scrollbarGroup, 
                width, 
                    scrollbarHeight || 15, 
                timeRangeState.minDate, 
                timeRangeState.maxDate,
                timeRangeState.originalMinDate, 
                timeRangeState.originalMaxDate
            );
            }
            
            // 重绘图表 - 使用水平图表重绘函数
            redrawHorizontalChart();
            
            // 重绘横向图表的时间轴标记
            redrawHorizontalTimeAxisMarkers();
        });
    } catch (error) {
        console.error('设置图表交互功能时发生错误:', error);
        showErrorMessage('图表交互功能设置失败: ' + error.message);
    }
}

/**
 * 更新工具提示内容
 */
function updateTooltip(tooltipElement, dataPoint, mouseX, mouseY) {
    try {
        // 更新日期
        const dateElement = tooltipElement.querySelector('.tooltip-date');
        if (dateElement) {
            dateElement.textContent = formatDate(dataPoint.compDate);
        }
        
        // 更新各资产占比
        const assetTypes = Object.keys(assetCodeToNameMap);
        
        // 按占比从大到小排序资产类型
        const sortedAssetTypes = [...assetTypes].sort((a, b) => {
            return (dataPoint.distribution[b] || 0) - (dataPoint.distribution[a] || 0);
        });
        
        // 获取工具提示内容区域
        const tooltipContent = tooltipElement.querySelector('.tooltip-content');
        if (tooltipContent) {
            // 清空现有内容
            tooltipContent.innerHTML = '';
            
            // 添加排序后的资产类型
            let totalValue = 0;
            
            sortedAssetTypes.forEach(type => {
                const value = dataPoint.distribution[type] || 0;
                totalValue += value;
                
                // 只显示数值大于0的资产类型
                if (value > 0.0001) {  // 使用0.0001作为阈值，避免舍入误差
                    const percent = (value * 100).toFixed(2);
                    const assetName = assetCodeToNameMap[type] || type;
                    const color = colorMapping[type] || '#999';
                    
                    const itemElement = document.createElement('div');
                    itemElement.className = 'tooltip-item';
                    itemElement.innerHTML = `
                        <div class="tooltip-label"><span class="tooltip-color" style="background-color: ${color};display:inline-block;width:10px;height:10px;margin-right:5px;"></span>${assetName}</div>
                        <div class="tooltip-value">${percent}%</div>
                    `;
                    itemElement.style.display = 'flex';
                    itemElement.style.justifyContent = 'space-between';
                    itemElement.style.margin = '3px 0';
                    
                    tooltipContent.appendChild(itemElement);
                }
            });
            
            // 添加总计，如果总和与100%有明显差异
            const totalPercent = (totalValue * 100).toFixed(2);
            
            if (Math.abs(totalValue - 1) > 0.01) {
                // 如果总和与100%相差超过1%，显示警告
                const totalElement = document.createElement('div');
                totalElement.className = 'tooltip-total';
                totalElement.style.marginTop = '5px';
                totalElement.style.paddingTop = '5px';
                totalElement.style.borderTop = '1px dashed #ccc';
                totalElement.innerHTML = `
                    <div class="tooltip-label" style="font-weight: bold;">总计</div>
                    <div class="tooltip-value" style="color: ${Math.abs(totalValue - 1) > 0.01 ? 'red' : 'inherit'}">${totalPercent}%</div>
                `;
                
                tooltipContent.appendChild(totalElement);
            }
        } else {
            console.warn('未找到tooltip-content元素');
        }
        
        // 确保tooltipElement已附加到DOM
        if (!tooltipElement.parentNode) {
            document.body.appendChild(tooltipElement);
        }
        
        // 定位工具提示
        const tooltipWidth = tooltipElement.offsetWidth || 180; // 提供默认宽度，避免首次计算问题
        const tooltipHeight = tooltipElement.offsetHeight || 150; // 提供默认高度
        
        // 获取视口大小
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 默认位置：鼠标右下方，但避免太靠近鼠标
        let left = mouseX + 15; // 增加与鼠标的距离
        let top = mouseY + 15;
        
        // 检查并调整水平位置，确保不超出视口右边界
        if (left + tooltipWidth > viewportWidth - 10) {
            left = mouseX - tooltipWidth - 15; // 切换到鼠标左侧
        }
        
        // 检查并调整垂直位置，确保不超出视口底部
        if (top + tooltipHeight > viewportHeight - 10) {
            top = mouseY - tooltipHeight - 15; // 切换到鼠标上方
        }
        
        // 边界保护 - 确保工具提示始终在视口内
        left = Math.max(10, Math.min(viewportWidth - tooltipWidth - 10, left));
        top = Math.max(10, Math.min(viewportHeight - tooltipHeight - 10, top));
        
        // 设置位置并添加平滑过渡效果
        tooltipElement.style.left = `${left}px`;
        tooltipElement.style.top = `${top}px`;
        tooltipElement.style.transition = 'left 0.15s ease-out, top 0.15s ease-out';
        tooltipElement.style.display = 'block';
        tooltipElement.style.pointerEvents = 'none'; // 防止工具提示阻止鼠标事件
        tooltipElement.style.zIndex = '1000'; // 确保在其他元素之上
    } catch (error) {
        console.error('更新工具提示时发生错误:', error);
        // 尝试隐藏工具提示以避免更多错误
        if (tooltipElement) {
            tooltipElement.style.display = 'none';
        }
    }
}

/**
 * 添加图表交互式图例
 */
function addInteractiveLegend() {
    // 创建外部HTML图例，而不是在SVG内部添加
    // 获取图表容器
    const chartContainer = document.getElementById('vertical-trend-chart');
    if (!chartContainer) {
        console.error('未找到图表容器');
        return;
    }
    
    // 检查是否已存在图例容器，如果不存在则创建一个
    let legendContainer = document.querySelector('.chart-legend');
    if (!legendContainer) {
        // 在图表容器后创建图例容器
        legendContainer = document.createElement('div');
        legendContainer.className = 'chart-legend';
        // 将图例容器添加到图表容器的父元素中，紧跟图表容器
        chartContainer.parentNode.appendChild(legendContainer);
    }
    
    // 清空现有图例
    legendContainer.innerHTML = '';
    
    // 设置图例容器样式 - 提升位置，减少与趋势图之间的空白，使布局更协调
    legendContainer.style.display = 'flex';
    legendContainer.style.flexWrap = 'wrap';
    legendContainer.style.justifyContent = 'center';
    legendContainer.style.padding = '8px 12px'; 
    legendContainer.style.backgroundColor = '#fff'; 
    legendContainer.style.position = 'relative';
    legendContainer.style.zIndex = '2';
    legendContainer.style.border = '1px solid #eee';
    legendContainer.style.borderRadius = '4px';
    legendContainer.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
    legendContainer.style.width = '95%';
    
    // 这里使用margin-top而不是marginTop，因为我们要覆盖CSS样式
    legendContainer.style.margin = '-70px auto 15px'; // 进一步上移图例，减少空白区域
    
    // 修改图例容器的布局
    legendContainer.style.alignItems = 'center'; // 垂直居中对齐
    legendContainer.style.maxWidth = '900px'; // 限制最大宽度
    
    // 记录图例隐藏状态
    const hiddenAssets = {};
    
    // 资产类型列表
    const assetTypes = Object.keys(assetCodeToNameMap);
    
    // 为每种资产类型创建图例项
    Object.entries(assetCodeToNameMap).forEach(([type, name]) => {
        // 创建图例项
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.dataset.assetType = type;
        legendItem.style.cursor = 'pointer';
        legendItem.style.padding = '5px 8px';
        legendItem.style.margin = '3px 4px';
        legendItem.style.borderRadius = '4px';
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.fontSize = '13px'; // 略微增大字体
        legendItem.style.border = '1px solid #f0f0f0';
        legendItem.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        
        // 颜色指示器
        const colorIndicator = document.createElement('span');
        colorIndicator.style.backgroundColor = colorMapping[type];
        colorIndicator.style.display = 'inline-block';
        colorIndicator.style.width = '14px';
        colorIndicator.style.height = '14px';
        colorIndicator.style.marginRight = '6px';
        colorIndicator.style.borderRadius = '2px';
        
        // 资产名称
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        nameSpan.style.fontWeight = '500';
        
        // 添加到图例项
        legendItem.appendChild(colorIndicator);
        legendItem.appendChild(nameSpan);
        
        // 初始化隐藏状态
        hiddenAssets[type] = false;
        
        // 添加点击事件 - 切换资产可见性
        legendItem.addEventListener('click', function() {
            // 切换该图例项的激活状态
            this.classList.toggle('hidden');
            
            // 更新隐藏状态
            const assetType = this.dataset.assetType;
            hiddenAssets[assetType] = !hiddenAssets[assetType];
            
            // 更新颜色指示器和文本的样式
            if (this.classList.contains('hidden')) {
                colorIndicator.style.opacity = '0.3';
                nameSpan.style.opacity = '0.5';
                this.style.backgroundColor = '#f5f5f5';
            } else {
                colorIndicator.style.opacity = '1';
                nameSpan.style.opacity = '1';
                this.style.backgroundColor = 'transparent';
            }
            
            // 更新图表 - 隐藏/显示相应的资产
            updateVerticalAssetVisibility();
        });
        
        // 添加悬停效果
        legendItem.addEventListener('mouseenter', function() {
            if (!this.classList.contains('hidden')) {
                this.style.backgroundColor = 'rgba(0,0,0,0.05)';
            }
        });
        
        legendItem.addEventListener('mouseleave', function() {
            if (!this.classList.contains('hidden')) {
                this.style.backgroundColor = 'transparent';
            }
        });
        
        // 添加到图例容器
        legendContainer.appendChild(legendItem);
    });
    
    // 更新图表中的资产可见性
    function updateVerticalAssetVisibility() {
        // 获取所有图例项
        const legendItems = document.querySelectorAll('.chart-legend .legend-item');
        
        // 获取垂直趋势图容器
        const verticalChart = document.getElementById('vertical-trend-chart');
        if (!verticalChart) return;
        
        // 处理所有资产类型
        Object.keys(assetCodeToNameMap).forEach(assetType => {
            const isHidden = hiddenAssets[assetType];
            
            // 获取与该资产类型相关的所有路径
            const paths = verticalChart.querySelectorAll(`path[data-asset-type="${assetType}"]`);
            
            // 更新路径的可见性
            paths.forEach(path => {
                if (isHidden) {
                    path.style.display = 'none';
                } else {
                    path.style.display = 'block';
                    path.style.opacity = '0.7'; // 恢复原透明度
                }
            });
        });
    }
}

/**
 * 显示错误消息
 */
function showErrorMessage(message) {
    const chartContainer = document.getElementById('vertical-trend-chart');
    if (!chartContainer) return;
    
    const errorElement = document.createElement('div');
    errorElement.className = 'chart-error';
    errorElement.style.color = '#e74c3c';
    errorElement.style.textAlign = 'center';
    errorElement.style.padding = '20px';
    errorElement.style.fontWeight = 'bold';
    errorElement.innerHTML = message;
    
    // 添加重试按钮
    const retryButton = document.createElement('button');
    retryButton.innerText = '重新加载';
    retryButton.style.marginTop = '10px';
    retryButton.style.padding = '5px 10px';
    retryButton.style.borderRadius = '4px';
    retryButton.style.border = '1px solid #ccc';
    retryButton.style.backgroundColor = '#f8f8f8';
    retryButton.style.cursor = 'pointer';
    
    retryButton.addEventListener('click', function() {
        // 显示正在重新加载状态
        chartContainer.innerHTML = '';
        const loadingElement = document.createElement('div');
        loadingElement.className = 'chart-loading';
        loadingElement.style.textAlign = 'center';
        loadingElement.style.padding = '40px';
        loadingElement.style.color = '#666';
        loadingElement.innerHTML = '正在重新加载数据...<br><small>请稍候</small>';
        chartContainer.appendChild(loadingElement);
        
        // 重新尝试加载数据
        setTimeout(() => {
            location.reload();
        }, 500);
    });
    
    errorElement.appendChild(retryButton);
    
    chartContainer.innerHTML = '';
    chartContainer.appendChild(errorElement);
}

/**
 * 绘制时间滚动轴
 * @param {SVGGElement} scrollbarGroup - 滚动轴SVG组
 * @param {number} width - 滚动轴宽度
 * @param {number} height - 滚动轴高度
 */
function drawTimeScrollbar(scrollbarGroup, width, height) {
    // 绘制滚动轴背景
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('x', 0);
    background.setAttribute('y', 0);
    background.setAttribute('width', width);
    background.setAttribute('height', height);
    background.setAttribute('fill', '#f0f0f0');
    background.setAttribute('rx', 3);
    background.setAttribute('ry', 3);
    background.setAttribute('class', 'scrollbar-background');
    scrollbarGroup.appendChild(background);
    
    // 绘制滚动轴滑块（初始状态下占满整个滚动区域）
    const slider = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    slider.setAttribute('x', 0);
    slider.setAttribute('y', 0);
    slider.setAttribute('width', width);
    slider.setAttribute('height', height);
    slider.setAttribute('fill', '#d0d0d0');
    slider.setAttribute('rx', 3);
    slider.setAttribute('ry', 3);
    slider.setAttribute('class', 'scrollbar-slider');
    slider.setAttribute('cursor', 'grab');
    scrollbarGroup.appendChild(slider);
    
    // 为滑块添加边框
    const sliderBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    sliderBorder.setAttribute('x', 0);
    sliderBorder.setAttribute('y', 0);
    sliderBorder.setAttribute('width', width);
    sliderBorder.setAttribute('height', height);
    sliderBorder.setAttribute('fill', 'none');
    sliderBorder.setAttribute('stroke', '#aaaaaa');
    sliderBorder.setAttribute('stroke-width', 1);
    sliderBorder.setAttribute('rx', 3);
    sliderBorder.setAttribute('ry', 3);
    sliderBorder.setAttribute('class', 'scrollbar-slider-border');
    sliderBorder.setAttribute('pointer-events', 'none');
    scrollbarGroup.appendChild(sliderBorder);
    
    // 添加拖动手柄指示器
    const handleIndicatorWidth = 5;
    const leftHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    leftHandle.setAttribute('x', 2);
    leftHandle.setAttribute('y', 2);
    leftHandle.setAttribute('width', handleIndicatorWidth);
    leftHandle.setAttribute('height', height - 4);
    leftHandle.setAttribute('fill', '#888888');
    leftHandle.setAttribute('rx', 2);
    leftHandle.setAttribute('class', 'scrollbar-handle');
    leftHandle.setAttribute('pointer-events', 'none');
    scrollbarGroup.appendChild(leftHandle);
    
    const rightHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rightHandle.setAttribute('x', width - handleIndicatorWidth - 2);
    rightHandle.setAttribute('y', 2);
    rightHandle.setAttribute('width', handleIndicatorWidth);
    rightHandle.setAttribute('height', height - 4);
    rightHandle.setAttribute('fill', '#888888');
    rightHandle.setAttribute('rx', 2);
    rightHandle.setAttribute('class', 'scrollbar-handle');
    rightHandle.setAttribute('pointer-events', 'none');
    scrollbarGroup.appendChild(rightHandle);
}

/**
 * 更新滚动轴状态以反映当前的缩放和位置
 * @param {SVGGElement} scrollbarGroup - 滚动轴SVG组
 * @param {number} width - 滚动轴总宽度
 * @param {number} height - 滚动轴高度
 * @param {number} minDate - 当前显示的最小日期
 * @param {number} maxDate - 当前显示的最大日期
 * @param {number} originalMinDate - 原始数据中的最小日期
 * @param {number} originalMaxDate - 原始数据中的最大日期
 */
function updateScrollbar(scrollbarGroup, width, height, minDate, maxDate, originalMinDate, originalMaxDate) {
    const fullRange = originalMaxDate - originalMinDate;
    const visibleRange = maxDate - minDate;
    
    // 计算滑块宽度和位置
    const sliderWidth = Math.max(20, (visibleRange / fullRange) * width);
    const sliderX = ((minDate - originalMinDate) / fullRange) * width;
    
    // 更新滑块位置和宽度
    const slider = scrollbarGroup.querySelector('.scrollbar-slider');
    if (slider) {
        slider.setAttribute('x', sliderX);
        slider.setAttribute('width', sliderWidth);
    }
    
    // 更新滑块边框
    const sliderBorder = scrollbarGroup.querySelector('.scrollbar-slider-border');
    if (sliderBorder) {
        sliderBorder.setAttribute('x', sliderX);
        sliderBorder.setAttribute('width', sliderWidth);
    }
    
    // 更新拖动手柄
    const handles = scrollbarGroup.querySelectorAll('.scrollbar-handle');
    if (handles.length >= 2) {
        // 左侧手柄
        handles[0].setAttribute('x', sliderX + 2);
        
        // 右侧手柄
        handles[1].setAttribute('x', sliderX + sliderWidth - 7);
    }
}

function redrawHorizontalTimeAxisMarkers() {
    try {
        // 移除现有的时间轴标记和网格线（只移除相关元素，而不是整个图表）
        const elementsToRemove = [];
        
        // 确保chartGroup是定义的
        if (typeof chartGroup === 'undefined') {
            console.error('chartGroup 未定义，无法重绘时间轴');
            return;
        }
        
        // 确保timeRangeState是定义的
        if (typeof timeRangeState === 'undefined') {
            console.error('timeRangeState 未定义，无法重绘时间轴');
            return;
        }
        
        // 确保width和height是定义的
        const chartWidth = chartGroup.getBBox ? chartGroup.getBBox().width : 800;
        const chartHeight = chartGroup.getBBox ? chartGroup.getBBox().height : 400;
        
        // 查找时间轴相关的元素（标记线和标签）
        chartGroup.querySelectorAll('line, text').forEach(element => {
            const isGridLine = element.getAttribute('stroke') === '#eee' && 
                             element.getAttribute('stroke-dasharray') === '3,3';
            const isTimeLabel = element.getAttribute('font-size') === '11' && 
                              element.getAttribute('fill') === '#666' &&
                              parseFloat(element.getAttribute('y')) >= chartHeight - 20; // 位于底部的文本元素
            
            if (isGridLine || isTimeLabel) {
                elementsToRemove.push(element);
            }
        });
        
        // 删除这些元素
        elementsToRemove.forEach(element => {
            if (element.parentNode === chartGroup) {
                chartGroup.removeChild(element);
            }
        });
        
        // 计算当前缩放状态下的时间比例尺
        const xScale = (timestamp) => {
            return chartWidth * (timestamp - timeRangeState.minDate) / (timeRangeState.maxDate - timeRangeState.minDate);
        };
        
        // 重新绘制时间轴标记，使用当前的时间范围
        const currentDateRange = {
            minDate: timeRangeState.minDate,
            maxDate: timeRangeState.maxDate
        };
        
        // 使用当前时间范围重新绘制时间轴标记
        // 确保使用当前正确的参数调用绘制函数
        console.log('重绘时间轴标记，日期范围:', formatDate(currentDateRange.minDate), '-', formatDate(currentDateRange.maxDate));
        
        // 修改：将交互面板移到前端调用之后，确保事件总能被捕获
        let interactionArea = chartGroup.querySelector('rect[pointer-events="all"]');
        if (interactionArea) {
            chartGroup.removeChild(interactionArea);
        }
        
        // 绘制时间轴标记
        drawHorizontalTimeAxisMarkers(chartGroup, xScale, chartWidth, chartHeight, currentDateRange);
        
        // 如果之前有交互区域，确保将它重新添加到最上层
        if (interactionArea) {
            chartGroup.appendChild(interactionArea);
        }
    } catch (error) {
        console.error('重绘水平时间轴标记时发生错误:', error);
    }
}

/**
 * 初始化资产分布趋势图
 */
function initAssetDistributionChart() {
    console.log('开始初始化资产分布趋势图');
    
    // 获取图表容器
    const chartContainer = document.getElementById('vertical-trend-chart');
    if (!chartContainer) {
        console.error('未找到图表容器 #vertical-trend-chart');
        return;
    }
    
    // 清空加载指示器
    chartContainer.innerHTML = '';
    
    try {
        // 创建SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.display = 'block';
        svg.style.fontFamily = 'Noto Sans SC, Arial, sans-serif';
        
        // 获取容器尺寸
        const containerWidth = chartContainer.clientWidth;
        const containerHeight = Math.max(280, chartContainer.clientHeight); // 确保最小高度
        
        // 设置SVG视口
        svg.setAttribute('viewBox', `0 0 ${containerWidth} ${containerHeight}`);
        
        // 添加滚动轴的高度和边距
        const scrollbarHeight = 15;
        const scrollbarMarginTop = 8;
        
        // 调整边距，为底部滚动条留出空间
        const adjustedMargin = {
            top: margin.top,
            right: margin.right,
            bottom: margin.bottom + scrollbarHeight + scrollbarMarginTop,
            left: margin.left
        };
        
        // 创建图表组
        const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        chartGroup.setAttribute('transform', `translate(${adjustedMargin.left}, ${adjustedMargin.top})`);
        
        // 绘制区域尺寸
        const width = containerWidth - adjustedMargin.left - adjustedMargin.right;
        const height = containerHeight - adjustedMargin.top - adjustedMargin.bottom;
        
        // 创建滚动轴组
        const scrollbarGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        scrollbarGroup.setAttribute('transform', `translate(${adjustedMargin.left}, ${adjustedMargin.top + height + scrollbarMarginTop})`);
        scrollbarGroup.setAttribute('class', 'scrollbar-group');
        
        // 绘制滚动轴
        drawTimeScrollbar(scrollbarGroup, width, scrollbarHeight);
        
        // 创建图表
        drawVerticalTrendChart(chartGroup, width, height);
        
        // 将SVG添加到容器
        svg.appendChild(chartGroup);
        svg.appendChild(scrollbarGroup);
        chartContainer.appendChild(svg);
        
        // 获取工具提示元素
        const tooltipElement = document.querySelector('.chart-tooltip');
        
        // 添加图表交互功能 - 竖向图表应该使用竖向的交互设置
        // 而不是使用横向图表的交互设置
        setupVerticalChartInteractions(svg, chartGroup, width, height, tooltipElement, scrollbarGroup, scrollbarHeight);
        
        // 添加交互图例
        addInteractiveLegend();
        
        console.log('资产分布趋势图初始化完成');
    } catch (error) {
        console.error('初始化资产分布趋势图时发生错误:', error);
        showErrorMessage(`图表初始化失败: ${error.message}`);
    }
}

/**
 * 绘制垂直趋势图
 * @param {SVGGElement} chartGroup - SVG图表组元素
 * @param {number} width - 图表宽度
 * @param {number} height - 图表高度
 * @param {number} minDate - 可选，最小日期
 * @param {number} maxDate - 可选，最大日期
 */
function drawVerticalTrendChart(chartGroup, width, height, minDate, maxDate) {
    if (!assetDistributionData || assetDistributionData.length === 0) {
        console.error('无可用数据绘制趋势图');
        return;
    }
    
    console.log(`绘制垂直趋势图，数据点数量: ${assetDistributionData.length}`);
    
    // 资产类型列表
    const assetTypes = Object.keys(assetCodeToNameMap);
    
    // 计算时间比例尺（时间在Y轴）
    const effectiveMinDate = minDate || assetDistributionData[0].compDate;
    const effectiveMaxDate = maxDate || assetDistributionData[assetDistributionData.length - 1].compDate;
    
    const yScale = (timestamp) => {
        return height * (1 - (timestamp - effectiveMinDate) / (effectiveMaxDate - effectiveMinDate));
    };
    
    // 计算比例尺，将百分比转换为X轴位置
    const xScale = (percent) => width * percent;
    
    // 绘制网格线和坐标轴
    drawGridAndAxes(chartGroup, width, height);
    
    // 绘制重叠区域
    drawOverlaidAreas(chartGroup, assetTypes, xScale, yScale, width, effectiveMinDate, effectiveMaxDate);
    
    // 绘制时间轴标记
    drawTimeAxisMarkers(chartGroup, yScale, width, height, effectiveMinDate, effectiveMaxDate);
}

/**
 * 绘制网格线和坐标轴
 */
function drawGridAndAxes(chartGroup, width, height) {
    // 创建坐标轴
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', 0);
    xAxis.setAttribute('y1', height);
    xAxis.setAttribute('x2', width);
    xAxis.setAttribute('y2', height);
    xAxis.setAttribute('stroke', '#ccc');
    xAxis.setAttribute('stroke-width', 1);
    xAxis.setAttribute('pointer-events', 'none');
    chartGroup.appendChild(xAxis);
    
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', 0);
    yAxis.setAttribute('y1', 0);
    yAxis.setAttribute('x2', 0);
    yAxis.setAttribute('y2', height);
    yAxis.setAttribute('stroke', '#ccc');
    yAxis.setAttribute('stroke-width', 1);
    yAxis.setAttribute('pointer-events', 'none');
    chartGroup.appendChild(yAxis);
    
    // 添加水平网格线和标签
    const percentGridLines = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
        
    percentGridLines.forEach(percent => {
        // 绘制水平网格线
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const x = width * percent;
        gridLine.setAttribute('x1', x);
        gridLine.setAttribute('y1', 0);
        gridLine.setAttribute('x2', x);
        gridLine.setAttribute('y2', height);
        gridLine.setAttribute('stroke', '#eee');
        gridLine.setAttribute('stroke-width', 1);
        gridLine.setAttribute('stroke-dasharray', '3,3');
        gridLine.setAttribute('pointer-events', 'none');
        chartGroup.appendChild(gridLine);
        
        // 添加百分比标签
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', -10);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '11');
        label.setAttribute('fill', '#666');
        label.setAttribute('pointer-events', 'none');
        label.textContent = `${(percent * 100).toFixed(0)}%`;
        chartGroup.appendChild(label);
    });
}

/**
 * 绘制重叠区域
 */
function drawOverlaidAreas(chartGroup, assetTypes, xScale, yScale, width, minDate, maxDate) {
    // 过滤可见时间范围内的数据点
    const visibleData = assetDistributionData.filter(point => 
        point.compDate >= minDate && point.compDate <= maxDate
    );
    
    if (visibleData.length === 0) {
        console.warn('指定时间范围内没有数据点');
        return;
    }
    
    // 计算所有时间点每种资产的平均占比
    const avgDistributions = {};
    assetTypes.forEach(type => {
        let sum = 0;
        let count = 0;
        
        visibleData.forEach(dataPoint => {
            if (dataPoint.distribution[type] !== undefined) {
                sum += dataPoint.distribution[type];
                count++;
            }
        });
        
        avgDistributions[type] = count > 0 ? sum / count : 0;
    });
    
    // 按平均占比从大到小排序资产类型
    const sortedTypes = [...assetTypes].sort((a, b) => {
        return avgDistributions[b] - avgDistributions[a];
    });
    
    // 绘制每种资产类型的区域
    sortedTypes.forEach(assetType => {
        // 创建路径
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // 构建路径数据点
        let pathData = '';
        
        // 从左侧开始
        visibleData.forEach((dataPoint, index) => {
            const x = xScale(dataPoint.distribution[assetType] || 0);
            const y = yScale(dataPoint.compDate);
            
            if (index === 0) {
                pathData = `M${x},${y}`;
            } else {
                pathData += ` L${x},${y}`;
            }
        });
        
        // 关闭路径 - 返回到右侧
        const lastY = yScale(visibleData[visibleData.length - 1].compDate);
        pathData += ` L0,${lastY}`;
        pathData += ` L0,${yScale(visibleData[0].compDate)}`;
        pathData += ' Z'; // 闭合路径
        
        // 设置路径样式
        path.setAttribute('d', pathData);
        path.setAttribute('fill', colorMapping[assetType]);
        path.setAttribute('fill-opacity', '0.7');
        path.setAttribute('stroke', colorMapping[assetType]);
        path.setAttribute('stroke-width', '1');
        path.setAttribute('data-asset-type', assetType);
        path.setAttribute('pointer-events', 'none'); // 避免截获鼠标事件
        
        // 添加到图表
        chartGroup.appendChild(path);
    });
}

/**
 * 绘制时间轴标记
 */
function drawTimeAxisMarkers(chartGroup, yScale, width, height, minDate, maxDate) {
    // 计算日期范围
    const dateRange = maxDate - minDate;
    const dayRange = dateRange / (24 * 60 * 60 * 1000); // 转换为天数
    
    // 根据缩放级别确定合适的时间间隔
    let interval;
    if (dayRange <= 14) {
        interval = 'day'; // 小于2周，按天显示
    } else if (dayRange <= 60) {
        interval = 'week'; // 小于2个月，按周显示
    } else if (dayRange <= 180) {
        interval = 'month'; // 小于6个月，按月显示
    } else if (dayRange <= 730) {
        interval = 'quarter'; // 小于2年，按季度显示
    } else {
        interval = 'year'; // 大于2年，按年显示
    }
    
    console.log(`时间轴使用间隔: ${interval}, 总跨度: ${dayRange}天`);
    
    // 生成时间标记点
    const timeMarkers = [];
    let currentDate = new Date(minDate);
    
    // 调整到合适的时间参考点
    if (interval === 'day') {
        currentDate.setHours(0, 0, 0, 0);
    } else if (interval === 'week') {
        const dayOfWeek = currentDate.getDay();
        currentDate.setDate(currentDate.getDate() - dayOfWeek);
        currentDate.setHours(0, 0, 0, 0);
    } else if (interval === 'month' || interval === 'quarter') {
        currentDate.setDate(1);
        currentDate.setHours(0, 0, 0, 0);
    } else if (interval === 'year') {
        currentDate.setMonth(0, 1);
        currentDate.setHours(0, 0, 0, 0);
    }
    
    // 根据间隔递增日期
    while (currentDate.getTime() <= maxDate) {
        const timestamp = currentDate.getTime();
        
        if (timestamp >= minDate) {
            timeMarkers.push({
                timestamp: timestamp,
                label: formatTimeLabel(timestamp, interval)
            });
        }
        
        // 递增到下一个时间点
        if (interval === 'day') {
            currentDate.setDate(currentDate.getDate() + 1);
        } else if (interval === 'week') {
            currentDate.setDate(currentDate.getDate() + 7);
        } else if (interval === 'month') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (interval === 'quarter') {
            currentDate.setMonth(currentDate.getMonth() + 3);
        } else {
            currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
    }
    
    // 如果标记点太多，筛选一部分
    let filteredMarkers = timeMarkers;
    if (timeMarkers.length > 10) {
        const skip = Math.ceil(timeMarkers.length / 10);
        filteredMarkers = timeMarkers.filter((_, index) => index % skip === 0);
        
        // 确保包含最后一个标记点
        if (timeMarkers.length > 0 && 
            filteredMarkers[filteredMarkers.length - 1] !== timeMarkers[timeMarkers.length - 1]) {
            filteredMarkers.push(timeMarkers[timeMarkers.length - 1]);
        }
    }
    
    // 绘制标记和标签
    filteredMarkers.forEach(marker => {
        const y = yScale(marker.timestamp);
        
        // 绘制水平标记线
        const markerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        markerLine.setAttribute('x1', 0);
        markerLine.setAttribute('y1', y);
        markerLine.setAttribute('x2', 5);
        markerLine.setAttribute('y2', y);
        markerLine.setAttribute('stroke', '#999');
        markerLine.setAttribute('stroke-width', 1);
        markerLine.setAttribute('pointer-events', 'none');
        chartGroup.appendChild(markerLine);
        
        // 添加日期标签
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', -5);
        label.setAttribute('y', y + 4); // 微调以垂直居中
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('font-size', '11');
        label.setAttribute('fill', '#666');
        label.setAttribute('pointer-events', 'none');
        label.textContent = marker.label;
        chartGroup.appendChild(label);
        
        // 添加水平网格线
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', 0);
        gridLine.setAttribute('y1', y);
        gridLine.setAttribute('x2', width);
        gridLine.setAttribute('y2', y);
        gridLine.setAttribute('stroke', '#eee');
        gridLine.setAttribute('stroke-width', 1);
        gridLine.setAttribute('stroke-dasharray', '3,3');
        gridLine.setAttribute('pointer-events', 'none');
        chartGroup.appendChild(gridLine);
    });
}

/**
 * 格式化时间标签
 */
function formatTimeLabel(timestamp, interval) {
    const date = new Date(timestamp);
    
    if (interval === 'day') {
        // 天 - 显示 "MM-DD"
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    } else if (interval === 'week') {
        // 周 - 显示 "MM/DD"
        return `${date.getMonth() + 1}/${date.getDate()}`;
    } else if (interval === 'month') {
        // 月 - 显示 "YYYY/MM"
        return `${date.getFullYear()}/${date.getMonth() + 1}`;
    } else if (interval === 'quarter') {
        // 季度 - 显示 "YYYY/QN"
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}/Q${quarter}`;
    } else {
        // 年 - 只显示年份
        return date.getFullYear().toString();
    }
}

/**
 * 更新工具提示位置
 */
function updateTooltipPosition(tooltipElement, mouseX, mouseY) {
    try {
        if (!tooltipElement) return;
        
        const tooltipWidth = tooltipElement.offsetWidth || 180;
        const tooltipHeight = tooltipElement.offsetHeight || 120;
        
        // 修改：减小与鼠标的距离，使工具提示更靠近鼠标
        let left = mouseX + 10; // 从20减少到10
        let top = mouseY + 5;   // 从10减少到5
        
        // 获取视口大小
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 检查并调整水平位置
        if (left + tooltipWidth > viewportWidth - 20) {
            left = mouseX - tooltipWidth - 10; // 从20减少到10
        }
        
        // 检查并调整垂直位置
        if (top + tooltipHeight > viewportHeight - 20) {
            top = mouseY - tooltipHeight - 10; // 从20减少到10
        }
        
        // 边界保护 - 确保工具提示始终在视口内
        left = Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, left));
        top = Math.max(20, Math.min(viewportHeight - tooltipHeight - 20, top));
        
        // 设置位置，带有平滑过渡
        tooltipElement.style.transition = 'left 0.15s ease-out, top 0.15s ease-out';
        tooltipElement.style.left = `${left}px`;
        tooltipElement.style.top = `${top}px`;
        
        // 确保显示
        tooltipElement.style.display = 'block';
        tooltipElement.style.pointerEvents = 'none'; // 防止工具提示阻止鼠标事件
        tooltipElement.style.zIndex = '1001'; // 确保在最上层
    } catch (error) {
        console.error('更新工具提示位置时发生错误:', error);
        // 尝试隐藏工具提示以避免更多错误
        if (tooltipElement) {
            tooltipElement.style.display = 'none';
        }
    }
}

/**
 * 添加水平图表交互式图例
 */
function addHorizontalLegend(legendContainer) {
    if (!legendContainer) {
        console.warn('未提供图例容器，无法添加水平图表图例');
        return;
    }
    
    // 清空容器内容
    legendContainer.innerHTML = '';
    
    // 资产类型列表
    const assetTypes = Object.keys(assetCodeToNameMap);
    
    // 为每种资产类型创建图例项
    Object.entries(assetCodeToNameMap).forEach(([type, name]) => {
        // 创建图例项
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.dataset.assetType = type;
        legendItem.style.cursor = 'pointer';
        legendItem.style.padding = '5px 8px';
        legendItem.style.margin = '3px 4px';
        legendItem.style.borderRadius = '4px';
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.fontSize = '12px';
        legendItem.style.border = '1px solid #f0f0f0';
        legendItem.style.backgroundColor = 'white';
        
        // 颜色指示器
        const colorIndicator = document.createElement('span');
        colorIndicator.style.backgroundColor = colorMapping[type];
        colorIndicator.style.display = 'inline-block';
        colorIndicator.style.width = '12px';
        colorIndicator.style.height = '12px';
        colorIndicator.style.marginRight = '6px';
        colorIndicator.style.borderRadius = '2px';
        
        // 资产名称
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        
        // 添加到图例项
        legendItem.appendChild(colorIndicator);
        legendItem.appendChild(nameSpan);
        
        // 添加点击事件 - 切换资产可见性
        legendItem.addEventListener('click', function() {
            // 切换该图例项的激活状态
            this.classList.toggle('hidden');
            
            // 获取资产类型
            const assetType = this.dataset.assetType;
            
            // 更新样式
            if (this.classList.contains('hidden')) {
                colorIndicator.style.opacity = '0.3';
                nameSpan.style.opacity = '0.5';
                this.style.backgroundColor = '#f5f5f5';
                
                // 隐藏对应的图形元素
                document.querySelectorAll(`.asset-path[data-asset-type="${assetType}"]`).forEach(path => {
                    path.style.display = 'none';
                });
            } else {
                colorIndicator.style.opacity = '1';
                nameSpan.style.opacity = '1';
                this.style.backgroundColor = 'white';
                
                // 显示对应的图形元素
                document.querySelectorAll(`.asset-path[data-asset-type="${assetType}"]`).forEach(path => {
                    path.style.display = 'block';
                });
            }
        });
        
        // 添加悬停效果
        legendItem.addEventListener('mouseenter', function() {
            if (!this.classList.contains('hidden')) {
                this.style.backgroundColor = 'rgba(0,0,0,0.05)';
            }
        });
        
        legendItem.addEventListener('mouseleave', function() {
            if (!this.classList.contains('hidden')) {
                this.style.backgroundColor = 'white';
            }
        });
        
        // 添加到图例容器
        legendContainer.appendChild(legendItem);
    });
    
    console.log('水平图表图例添加完成');
}

/**
 * 设置竖向图表交互功能
 */
function setupVerticalChartInteractions(svg, chartGroup, width, height, tooltipElement, scrollbarGroup, scrollbarHeight, options = {}) {
    try {
        // 保存到全局变量，供其他函数使用
        window.chartGroup = chartGroup;

        if (!tooltipElement) {
            console.error('未找到提示框元素 .chart-tooltip，请检查HTML结构');
            showErrorMessage('图表工具提示初始化失败：未找到.chart-tooltip元素');
            return;
        }

        // 创建鼠标跟踪线 - 对于竖向图表，是水平线
        const hoverLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hoverLine.setAttribute('stroke', '#999');
        hoverLine.setAttribute('stroke-width', 1);
        hoverLine.setAttribute('stroke-dasharray', '3,3');
        hoverLine.style.display = 'none';
        hoverLine.setAttribute('pointer-events', 'none');
        chartGroup.appendChild(hoverLine);

        // 创建缩放信息元素
        const zoomInfoText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        zoomInfoText.setAttribute('fill', '#333');
        zoomInfoText.setAttribute('font-size', '12');
        zoomInfoText.setAttribute('text-anchor', 'middle');
        zoomInfoText.setAttribute('font-family', 'Noto Sans SC, sans-serif');
        zoomInfoText.style.display = 'none';
        zoomInfoText.setAttribute('pointer-events', 'none');
        chartGroup.appendChild(zoomInfoText);

        // 缩放状态变量
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const timeRangeState = {
            originalMinDate: assetDistributionData[0].compDate,
            originalMaxDate: assetDistributionData[assetDistributionData.length - 1].compDate,
            minDate: assetDistributionData[0].compDate,
            maxDate: assetDistributionData[assetDistributionData.length - 1].compDate,
            zoomLevel: 1,
            isAnimating: false,
            isDraggingScrollbar: false,
            dragStartX: 0,
            dragType: null // 'slider', 'left-handle', 'right-handle'
        };

        // 保存到全局变量，供其他函数使用
        window.timeRangeState = timeRangeState;

        // 初始化滚动轴状态
        if (scrollbarGroup) {
            updateScrollbar(
                scrollbarGroup,
                width,
                scrollbarHeight || 15,
                timeRangeState.minDate,
                timeRangeState.maxDate,
                timeRangeState.originalMinDate,
                timeRangeState.originalMaxDate
            );
        }

        // 创建交互区域 - 稍微扩大以覆盖边缘
        const interactionArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        // 扩展交互区域的高度和宽度，确保完全覆盖图表边缘
        const interactionPadding = 10; // 交互区域的额外边距
        interactionArea.setAttribute('x', -interactionPadding);
        interactionArea.setAttribute('y', -interactionPadding);
        interactionArea.setAttribute('width', width + interactionPadding * 2);
        interactionArea.setAttribute('height', height + interactionPadding * 2);
        interactionArea.setAttribute('fill', 'transparent');
        interactionArea.style.cursor = 'crosshair';
        interactionArea.setAttribute('pointer-events', 'all'); // 确保捕获所有鼠标事件
        // 重要：将交互区域插入到chartGroup的第一个子元素位置，确保它在最底层
        // 这样即使鼠标在其他图表元素上方，也能接收滚轮事件
        chartGroup.insertBefore(interactionArea, chartGroup.firstChild);

        // 使用防抖函数减少鼠标移动事件触发频率
        let debounceTimeout;
        const debounce = (func, delay) => {
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => func.apply(context, args), delay);
            };
        };

        // 跟踪上一次找到的最近点，避免频繁更新
        let lastClosestIndex = -1;

        // 鼠标移动处理 - 竖向图表，横坐标代表百分比，纵坐标代表时间
        interactionArea.addEventListener('mousemove', (event) => {
            const svgRect = svg.getBoundingClientRect();
             // 注意：竖向图表使用正确的 margin
            const mouseX = event.clientX - svgRect.left - margin.left;

            // 扩展边界检测，添加边缘容差
            const edgeTolerance = 5; // 边缘容差值，单位为像素

            if (mouseX < -edgeTolerance || mouseX > width + edgeTolerance) {
                hoverLine.style.display = 'none';
                tooltipElement.style.display = 'none';
                return;
            }

            // 确保鼠标线位置在图表范围内
            const boundedMouseX = Math.max(0, Math.min(width, mouseX));

            // 设置垂直跟踪线位置 - 竖向图表使用垂直线
            hoverLine.setAttribute('x1', boundedMouseX);
            hoverLine.setAttribute('y1', 0);
            hoverLine.setAttribute('x2', boundedMouseX);
            hoverLine.setAttribute('y2', height);
            hoverLine.style.display = 'block';

            // 找到最接近鼠标位置对应的时间点
            const mouseY = event.clientY - svgRect.top - margin.top;
            const approximateDate = timeRangeState.minDate + (mouseY / height) * (timeRangeState.maxDate - timeRangeState.minDate);

            let closestIndex = -1; // 重置以确保每次都查找
            let minDistance = Infinity;

            // 查找当前时间范围内最接近鼠标时间的数据点
            assetDistributionData.forEach((point, index) => {
                if (point.compDate >= timeRangeState.minDate && point.compDate <= timeRangeState.maxDate) {
                    const distance = Math.abs(point.compDate - approximateDate);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestIndex = index;
                    }
                }
            });

            // 减少内容更新频率，但始终更新位置
            if (closestIndex !== -1 && closestIndex !== lastClosestIndex) { // 确保找到了点并且是新的点
                lastClosestIndex = closestIndex;
                const closestPoint = assetDistributionData[closestIndex];
                // 更新工具提示
                updateTooltip(tooltipElement, closestPoint, event.pageX, event.pageY);
            } else if (closestIndex !== -1) { // 如果点没变，只更新位置
                // 数据点相同但鼠标移动了，只更新位置
                updateTooltipPosition(tooltipElement, event.pageX, event.pageY);
            }
        });

        // 鼠标滚轮事件处理 - 竖向图表的缩放
        interactionArea.addEventListener('wheel', (event) => {
            event.preventDefault(); // 防止页面滚动

            if (timeRangeState.isAnimating) return; // 防止动画过程中处理滚轮事件

            // 获取鼠标在SVG中的位置
            const svgRect = svg.getBoundingClientRect();
             // 注意：竖向图表使用正确的 margin
            const mouseY = event.clientY - svgRect.top - margin.top;

            // 计算缩放中心点的时间戳 - 对于竖向图表，使用Y轴位置计算时间
            const centerTimestamp = timeRangeState.minDate + (mouseY / height) * (timeRangeState.maxDate - timeRangeState.minDate);

            // 当前时间范围
            const currentRange = timeRangeState.maxDate - timeRangeState.minDate;

            // 缩放系数 - 滚轮向上(负delta)为放大，向下(正delta)为缩小
            const zoomFactor = event.deltaY < 0 ? 0.8 : 1.25;

            // 计算新的时间范围
            let newRange = currentRange * zoomFactor;

            // 检查是否达到最小缩放范围（7天）
            if (newRange < SEVEN_DAYS_MS) {
                newRange = SEVEN_DAYS_MS;
                console.log('已达到最小缩放范围: 7天');
            }

            // 检查是否应该重置到原始范围
            if (newRange >= timeRangeState.originalMaxDate - timeRangeState.originalMinDate) {
                // 重置到完整范围
                timeRangeState.minDate = timeRangeState.originalMinDate;
                timeRangeState.maxDate = timeRangeState.originalMaxDate;
                timeRangeState.zoomLevel = 1;

                // 显示缩放反馈
                showZoomFeedback("已重置为完整时间范围");

                // 更新滚动轴
                if (scrollbarGroup) {
                    updateScrollbar(
                        scrollbarGroup,
                        width,
                        scrollbarHeight || 15,
                        timeRangeState.minDate,
                        timeRangeState.maxDate,
                        timeRangeState.originalMinDate,
                        timeRangeState.originalMaxDate
                    );
                }

                // 重绘竖向图表
                redrawVerticalChart();

                return;
            }

            // 计算新的日期范围，保持鼠标位置对应的时间点不变
            const ratio = (centerTimestamp - timeRangeState.minDate) / currentRange;
            let newMinDate = centerTimestamp - ratio * newRange;
            let newMaxDate = centerTimestamp + (1 - ratio) * newRange;

            // 确保不超出数据范围
            if (newMinDate < timeRangeState.originalMinDate) {
                newMinDate = timeRangeState.originalMinDate;
                newMaxDate = newMinDate + newRange;
            }

            if (newMaxDate > timeRangeState.originalMaxDate) {
                newMaxDate = timeRangeState.originalMaxDate;
                newMinDate = newMaxDate - newRange;

                // 再次检查最小日期边界
                if (newMinDate < timeRangeState.originalMinDate) {
                    newMinDate = timeRangeState.originalMinDate;
                }
            }

            // 更新时间范围状态
            timeRangeState.minDate = newMinDate;
            timeRangeState.maxDate = newMaxDate;
            timeRangeState.zoomLevel = (timeRangeState.originalMaxDate - timeRangeState.originalMinDate) / (newMaxDate - newMinDate);

            // 显示缩放信息
            showZoomFeedback(`${formatDate(newMinDate)} 至 ${formatDate(newMaxDate)}`);

            // 更新滚动轴
            if (scrollbarGroup) {
                updateScrollbar(
                    scrollbarGroup,
                    width,
                    scrollbarHeight || 15,
                    timeRangeState.minDate,
                    timeRangeState.maxDate,
                    timeRangeState.originalMinDate,
                    timeRangeState.originalMaxDate
                );
            }

            // 重绘竖向图表
            redrawVerticalChart();
        });

        // 双击重置缩放
        interactionArea.addEventListener('dblclick', () => {
            timeRangeState.minDate = timeRangeState.originalMinDate;
            timeRangeState.maxDate = timeRangeState.originalMaxDate;
            timeRangeState.zoomLevel = 1;

            // 显示缩放反馈
            showZoomFeedback("已重置为完整时间范围");

            // 更新滚动轴
            if (scrollbarGroup) {
                updateScrollbar(
                    scrollbarGroup,
                    width,
                    scrollbarHeight || 15,
                    timeRangeState.minDate,
                    timeRangeState.maxDate,
                    timeRangeState.originalMinDate,
                    timeRangeState.originalMaxDate
                );
            }

            // 重绘竖向图表
            redrawVerticalChart();
        });

        // 鼠标离开处理
        interactionArea.addEventListener('mouseleave', () => {
            hoverLine.style.display = 'none';
            tooltipElement.style.display = 'none';
            lastClosestIndex = -1; // 重置
        });

        // --- 开始添加滑动条拖动逻辑 ---
        if (scrollbarGroup) {
            const scrollbarSlider = scrollbarGroup.querySelector('.scrollbar-slider');

            if (scrollbarSlider) {
                // 检测点击位置是左侧手柄、右侧手柄还是滑块中间部分
                function getScrollbarDragType(event, sliderX, sliderWidth) {
                    const svgRect = svg.getBoundingClientRect();
                    // 注意：竖向图表的 margin
                    const mouseX = event.clientX - svgRect.left - margin.left;
                    const handleWidth = 10; // 手柄的有效宽度

                    if (mouseX >= sliderX && mouseX <= sliderX + handleWidth) {
                        return 'left-handle';
                    } else if (mouseX >= sliderX + sliderWidth - handleWidth && mouseX <= sliderX + sliderWidth) {
                        return 'right-handle';
                    } else if (mouseX >= sliderX && mouseX <= sliderX + sliderWidth) {
                        return 'slider';
                    }
                    return null;
                }

                // 滚动轴滑块鼠标按下事件
                scrollbarSlider.addEventListener('mousedown', (event) => {
                    event.preventDefault();

                    const svgRect = svg.getBoundingClientRect();
                    const sliderX = parseFloat(scrollbarSlider.getAttribute('x'));
                    const sliderWidth = parseFloat(scrollbarSlider.getAttribute('width'));

                    timeRangeState.isDraggingScrollbar = true;
                    // 注意：竖向图表的 margin
                    timeRangeState.dragStartX = event.clientX - svgRect.left - margin.left - sliderX;
                    timeRangeState.dragType = getScrollbarDragType(event, sliderX, sliderWidth);

                    // 改变鼠标样式
                    if (timeRangeState.dragType === 'left-handle' || timeRangeState.dragType === 'right-handle') {
                        scrollbarSlider.style.cursor = 'ew-resize';
                    } else {
                         scrollbarSlider.style.cursor = 'grabbing';
                    }

                     // 添加全局鼠标事件监听
                     document.addEventListener('mousemove', handleGlobalMouseMove);
                     document.addEventListener('mouseup', handleGlobalMouseUp);
                 });

                // 滚动轴背景点击事件 - 直接跳转到点击位置
                const scrollbarBackground = scrollbarGroup.querySelector('.scrollbar-background');
                if (scrollbarBackground) {
                    scrollbarBackground.addEventListener('click', (event) => {
                        if (timeRangeState.isDraggingScrollbar) return; // 如果正在拖动，忽略点击

                        const svgRect = svg.getBoundingClientRect();
                         // 注意：竖向图表的 margin
                         const mouseX = event.clientX - svgRect.left - margin.left;
                         const fullRange = timeRangeState.originalMaxDate - timeRangeState.originalMinDate;
                         const visibleRange = timeRangeState.maxDate - timeRangeState.minDate;

                         // 计算点击位置对应的时间戳
                         const clickedTime = timeRangeState.originalMinDate + (mouseX / width) * fullRange;

                         // 将可视区域中心移动到点击位置
                         let newMinDate = clickedTime - visibleRange / 2;
                         let newMaxDate = clickedTime + visibleRange / 2;

                         // 边界处理
                         if (newMinDate < timeRangeState.originalMinDate) {
                             newMinDate = timeRangeState.originalMinDate;
                             newMaxDate = newMinDate + visibleRange;
                         }

                         if (newMaxDate > timeRangeState.originalMaxDate) {
                             newMaxDate = timeRangeState.originalMaxDate;
                             newMinDate = newMaxDate - visibleRange;

                             if (newMinDate < timeRangeState.originalMinDate) {
                                 newMinDate = timeRangeState.originalMinDate;
                             }
                         }

                         // 更新状态
                         timeRangeState.minDate = newMinDate;
                         timeRangeState.maxDate = newMaxDate;

                         // 显示信息
                         showZoomFeedback(`${formatDate(newMinDate)} 至 ${formatDate(newMaxDate)}`);

                         // 更新滚动轴
                         updateScrollbar(
                             scrollbarGroup,
                             width,
                             scrollbarHeight || 15,
                             timeRangeState.minDate,
                             timeRangeState.maxDate,
                             timeRangeState.originalMinDate,
                             timeRangeState.originalMaxDate
                         );

                         // 重绘竖向图表 (确保调用正确的重绘函数)
                         redrawVerticalChart();
                     });
                 }

                // 全局鼠标移动事件处理 - 用于拖拽
                function handleGlobalMouseMove(event) {
                     if (!timeRangeState.isDraggingScrollbar) return;

                     const svgRect = svg.getBoundingClientRect();
                      // 注意：竖向图表的 margin
                      const mouseX = event.clientX - svgRect.left - margin.left;
                      const fullRange = timeRangeState.originalMaxDate - timeRangeState.originalMinDate;
                      const currentVisibleRange = timeRangeState.maxDate - timeRangeState.minDate;

                     // 根据拖动类型进行不同的处理
                     if (timeRangeState.dragType === 'slider') {
                         // 拖动整个滑块 - 移动可视区域
                         const sliderPosition = mouseX - timeRangeState.dragStartX;

                         // 确保滑块不超出滚动轴范围
                         const sliderWidth = scrollbarSlider ? parseFloat(scrollbarSlider.getAttribute('width')) : 0;
                         const boundedSliderPosition = Math.max(0, Math.min(width - sliderWidth, sliderPosition));

                         // 计算新的时间范围
                         let newMinDate = timeRangeState.originalMinDate + (boundedSliderPosition / width) * fullRange;
                         let newMaxDate = newMinDate + currentVisibleRange;

                         // 边界处理
                         if (newMaxDate > timeRangeState.originalMaxDate) {
                            newMaxDate = timeRangeState.originalMaxDate;
                            newMinDate = Math.max(timeRangeState.originalMinDate, newMaxDate - currentVisibleRange);
                         } else if (newMinDate < timeRangeState.originalMinDate) {
                            newMinDate = timeRangeState.originalMinDate;
                            newMaxDate = Math.min(timeRangeState.originalMaxDate, newMinDate + currentVisibleRange);
                         }

                         timeRangeState.minDate = newMinDate;
                         timeRangeState.maxDate = newMaxDate;

                     } else if (timeRangeState.dragType === 'left-handle') {
                          // 拖动左侧手柄 - 调整起始时间
                          let newMinDate = timeRangeState.originalMinDate + (mouseX / width) * fullRange;

                          // 边界和最小范围检查
                          newMinDate = Math.max(timeRangeState.originalMinDate, newMinDate);
                          newMinDate = Math.min(newMinDate, timeRangeState.maxDate - SEVEN_DAYS_MS);

                          timeRangeState.minDate = newMinDate;
                      } else if (timeRangeState.dragType === 'right-handle') {
                           // 拖动右侧手柄 - 调整结束时间
                           let newMaxDate = timeRangeState.originalMinDate + (mouseX / width) * fullRange;

                           // 边界和最小范围检查
                           newMaxDate = Math.min(timeRangeState.originalMaxDate, newMaxDate);
                           newMaxDate = Math.max(newMaxDate, timeRangeState.minDate + SEVEN_DAYS_MS);

                           timeRangeState.maxDate = newMaxDate;
                      }

                      // 重新计算缩放级别
                      timeRangeState.zoomLevel = (timeRangeState.originalMaxDate - timeRangeState.originalMinDate) / (timeRangeState.maxDate - timeRangeState.minDate);


                      // 更新滚动轴
                      updateScrollbar(
                          scrollbarGroup,
                          width,
                          scrollbarHeight || 15,
                          timeRangeState.minDate,
                          timeRangeState.maxDate,
                          timeRangeState.originalMinDate,
                          timeRangeState.originalMaxDate
                      );

                      // 重绘竖向图表 (确保调用正确的重绘函数)
                      redrawVerticalChart();
                  }

                 // 全局鼠标抬起事件处理
                 function handleGlobalMouseUp() {
                     if (timeRangeState.isDraggingScrollbar) {
                         timeRangeState.isDraggingScrollbar = false;
                         if (scrollbarSlider) { // 检查 scrollbarSlider 是否存在
                            scrollbarSlider.style.cursor = 'grab';
                         }

                         // 移除全局事件监听
                         document.removeEventListener('mousemove', handleGlobalMouseMove);
                         document.removeEventListener('mouseup', handleGlobalMouseUp);

                         // 显示当前时间范围信息
                         showZoomFeedback(`${formatDate(timeRangeState.minDate)} 至 ${formatDate(timeRangeState.maxDate)}`);
                     }
                 }
            }
        }
         // --- 结束添加滑动条拖动逻辑 ---

        // 显示缩放反馈信息
        function showZoomFeedback(message) {
            zoomInfoText.textContent = message;
            zoomInfoText.setAttribute('x', width / 2);
            zoomInfoText.setAttribute('y', 20);
            zoomInfoText.style.display = 'block';

            // 设置淡出动画
            setTimeout(() => {
                zoomInfoText.style.opacity = '1';
                zoomInfoText.style.transition = 'opacity 0.5s ease-in-out';

                setTimeout(() => {
                    zoomInfoText.style.opacity = '0';

                    setTimeout(() => {
                        zoomInfoText.style.display = 'none';
                        zoomInfoText.style.transition = '';
                        zoomInfoText.style.opacity = '1';
                    }, 500);
                }, 1500);
            }, 10);
        }

        // 重绘竖向图表函数
        function redrawVerticalChart() {
            // 清空图表组，但保留特定元素
            const elementsToKeep = [interactionArea, hoverLine, zoomInfoText];

            Array.from(chartGroup.children).forEach(child => {
                if (!elementsToKeep.includes(child)) {
                    chartGroup.removeChild(child);
                }
            });

            // 重新绘制竖向图表
            drawVerticalTrendChart(chartGroup, width, height, timeRangeState.minDate, timeRangeState.maxDate);

            // 确保交互元素在顶层
            elementsToKeep.forEach(el => {
                chartGroup.appendChild(el);
            });
        }

        // 初始绘制竖向图表
         redrawVerticalChart();
    } catch (error) {
        console.error('设置竖向图表交互功能时发生错误:', error);
        showErrorMessage('竖向图表交互功能设置失败: ' + error.message);
    }
} 
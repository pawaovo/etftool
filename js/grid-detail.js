/**
 * grid-detail.js
 * 网格策略详情页面的数据处理和渲染逻辑
 */

// 全局变量
let detailData = {}; // 当前ETF的详细数据
let originalTradeHistory = []; // 原始交易历史数据
let currentChartInstance = null; // 当前图表实例

/**
 * 从URL获取参数
 * @param {string} param - 参数名
 * @returns {string} 参数值
 */
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * 加载单个ETF的数据
 * @param {string} etfCode - ETF代码
 * @returns {Promise} 包含ETF数据的Promise
 */
async function loadEtfData(etfCode) {
    // 在4.1任务中实现
    return {};
}

/**
 * 获取最新净值
 * @param {string} etfCode - ETF代码
 * @returns {Promise} 包含净值的Promise
 */
async function getLatestNetValue(etfCode) {
    // 在4.1任务中实现
    return 0;
}

/**
 * 计算ETF详细数据
 * @param {Object} jsonData - 原始JSON数据
 * @param {number} latestNetValue - 最新净值
 * @returns {Object} 计算后的详细数据
 */
function calculateDetailData(jsonData, latestNetValue) {
    // 在4.2任务中实现（可复用grid-data.js中的逻辑）
    return {};
}

/**
 * 渲染顶部信息栏
 * @param {Object} detailData - ETF详细数据
 */
function renderInfoBar(detailData) {
    // 在4.3任务中实现
}

/**
 * 准备图表数据
 * @param {Object} detailData - ETF详细数据
 * @returns {Object} 图表数据
 */
function prepareChartData(detailData) {
    // 在4.4任务中实现
    return {
        labels: [],
        prices: [],
        buyPoints: [],
        sellPoints: [],
        currentBuyLevelLine: 0,
        pairedTrades: []
    };
}

/**
 * 渲染趋势图
 * @param {Object} chartData - 图表数据
 */
function renderTrendChart(chartData) {
    // 在4.5任务中实现
}

/**
 * 配置图表交互
 * @param {Object} chartInstance - 图表实例
 * @param {Object} chartData - 图表数据
 */
function setupChartInteractions(chartInstance, chartData) {
    // 在4.6任务中实现
}

/**
 * 准备交易明细表格数据
 * @param {Object} detailData - ETF详细数据
 * @returns {Object} 表格数据
 */
function prepareTradeDetailsTable(detailData) {
    // 在4.7任务中实现
    return {
        records: [],
        cumulativeProfit: 0,
        cumulativeProfitRate: '0%'
    };
}

/**
 * 渲染交易明细表格
 * @param {Object} tableData - 表格数据
 */
function renderTradeDetailsTable(tableData) {
    // 在4.8任务中实现
}

/**
 * 准备网格策略参数数据
 * @param {Object} detailData - ETF详细数据
 * @returns {Object} 参数数据
 */
function prepareStrategyParams(detailData) {
    // 在4.9任务中实现
    return {};
}

/**
 * 渲染网格策略参数区
 * @param {Object} paramsData - 参数数据
 */
function renderStrategyParams(paramsData) {
    // 在4.10任务中实现
}

/**
 * 计算网格档位
 * @param {Object} strategyParams - 策略参数
 * @param {Array} tradeHistory - 交易历史
 * @returns {Object} 档位详情表数据
 */
function calculateGridLevels(strategyParams, tradeHistory) {
    // 在4.11任务中实现
    return {
        levels: [],
        footer: {}
    };
}

/**
 * 渲染网格档位表
 * @param {Object} gridLevelsData - 档位详情表数据
 */
function renderGridLevelsTable(gridLevelsData) {
    // 在4.12任务中实现
}

/**
 * 设置表格切换按钮事件
 */
function setupTableToggleButtons() {
    // 在5.1任务中实现
}

/**
 * 设置参数修改事件
 */
function setupParamModificationEvents() {
    // 在5.2任务中实现
}

/**
 * 页面初始化
 */
async function initPage() {
    try {
        // 获取URL参数
        const etfCode = getUrlParam('etfCode') || '';
        const sourceFile = getUrlParam('sourceFile') || '';
        
        if (!etfCode && !sourceFile) {
            throw new Error('缺少ETF代码或源文件参数');
        }
        
        // 加载ETF数据
        const jsonData = await loadEtfData(etfCode || sourceFile);
        originalTradeHistory = jsonData.交易记录 || [];
        
        // 获取最新净值
        const latestNetValue = await getLatestNetValue(etfCode);
        
        // 计算详细数据
        detailData = calculateDetailData(jsonData, latestNetValue);
        
        // 渲染顶部信息栏
        renderInfoBar(detailData);
        
        // 准备并渲染图表
        const chartData = prepareChartData(detailData);
        currentChartInstance = renderTrendChart(chartData);
        setupChartInteractions(currentChartInstance, chartData);
        
        // 准备并渲染交易明细表格
        const tradeTableData = prepareTradeDetailsTable(detailData);
        renderTradeDetailsTable(tradeTableData);
        
        // 准备并渲染网格策略参数和表格
        const strategyParams = prepareStrategyParams(detailData);
        renderStrategyParams(strategyParams);
        
        const gridLevelsData = calculateGridLevels(strategyParams, originalTradeHistory);
        renderGridLevelsTable(gridLevelsData);
        
        // 设置交互事件
        setupTableToggleButtons();
        setupParamModificationEvents();
        
    } catch (error) {
        console.error('初始化页面失败:', error);
        alert('加载ETF详情数据失败: ' + error.message);
    }
}

// 当DOM加载完成后初始化页面
document.addEventListener('DOMContentLoaded', initPage); 
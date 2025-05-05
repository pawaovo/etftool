/**
 * 资产分布数据 - 处理文件
 * 实现大类资产占比趋势图的数据加载和处理
 * 数据源：class-distribution.json
 */

// 定义全局变量，用于存储资产分布数据
let assetDistributionData = [];

// 添加一个事件，当数据加载完成时触发
document.addEventListener('DOMContentLoaded', function() {
    console.log('开始加载class-distribution.json数据');
    
    // 确保在Web服务器环境下运行
    const isWebServer = window.location.protocol.startsWith('http');
    if (!isWebServer) {
        console.warn('警告：当前不是通过Web服务器访问，可能会导致CORS问题。请使用run-local.bat启动本地服务器后访问。');
    }
    
    // 使用fetch API加载数据，添加更多选项以提高可靠性
    fetch('data/class-distribution.json', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`加载数据失败: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(rawData => {
            console.log(`成功加载原始数据，共${rawData.length}条记录`);
            // 处理数据
            processDistributionData(rawData);
            
            // 触发自定义事件，通知数据已加载完成
            const dataReadyEvent = new CustomEvent('assetDataReady');
            document.dispatchEvent(dataReadyEvent);
            
            // 数据验证
            validateTimestamps();
        })
        .catch(error => {
            console.error('加载或处理资产分布数据时出错:', error);
            
            // 更明确的错误信息
            if (error.message.includes('Failed to fetch')) {
                console.error('无法获取数据文件。如果是直接在浏览器打开HTML文件，请改用Web服务器：右键点击run-local.bat并运行');
            }
            
            // 由于用户明确要求不使用默认数据，这里不再使用备选数据加载方法
            document.dispatchEvent(new CustomEvent('assetDataError', { 
                detail: `无法加载原始数据: ${error.message}。请通过Web服务器访问页面以解决CORS限制。` 
            }));
        });
});

/**
 * 处理原始分布数据
 * @param {Array} rawData 从JSON文件加载的原始数据
 */
function processDistributionData(rawData) {
    if (!Array.isArray(rawData) || rawData.length === 0) {
        console.error('原始数据无效或为空');
        return;
    }
    
    console.log('开始处理资产分布数据');
    
    // 处理每条记录
    assetDistributionData = rawData.map(item => {
        // 验证记录格式
        if (!item.compDate || !item.distribution) {
            console.warn('跳过无效数据记录:', item);
            return null;
        }
        
        // 验证时间戳
        const timestamp = Number(item.compDate);
        if (isNaN(timestamp) || timestamp <= 0) {
            console.warn(`跳过无效时间戳: ${item.compDate}`);
            return null;
        }
        
        // 重新组合分布数据，确保所有资产类型都有值（默认为0）
        const distribution = {
            'GOLD': item.distribution.GOLD || 0,
            'CHINA_STOCK': item.distribution.CHINA_STOCK || 0, 
            'OIL': item.distribution.OIL || 0,
            'CHINA_BOND': item.distribution.CHINA_BOND || 0,
            'OVERSEA_STOCK_MATURE': item.distribution.OVERSEA_STOCK_MATURE || 0,
            'OVERSEA_BOND': item.distribution.OVERSEA_BOND || 0,
            'OVERSEA_STOCK_EMERGING': item.distribution.OVERSEA_STOCK_EMERGING || 0,
            'CASH': item.distribution.CASH || 0
        };
        
        // 验证分布总和是否接近1
        const sum = Object.values(distribution).reduce((acc, val) => acc + val, 0);
        if (Math.abs(sum - 1) > 0.01) {
            console.warn(`警告：资产分布总和不为1（${sum.toFixed(4)}），日期: ${formatTimestamp(timestamp)}`);
        }
        
        // 格式化日期（仅用于日志）
        const formattedDate = formatTimestamp(timestamp);
        
        // 添加到结果数组
        return {
            compDate: timestamp,
            distribution: distribution,
            formattedDate: formattedDate // 用于调试，实际绘图时不使用
        };
    }).filter(item => item !== null); // 过滤无效记录
    
    // 按时间升序排序（从最早到最晚）
    assetDistributionData.sort((a, b) => a.compDate - b.compDate);
    
    console.log(`数据处理完成，有效记录${assetDistributionData.length}条`);
    
    // 打印数据范围
    if (assetDistributionData.length > 0) {
        console.log(`数据范围: ${formatTimestamp(assetDistributionData[0].compDate)} 至 ${formatTimestamp(assetDistributionData[assetDistributionData.length-1].compDate)}`);
        
        // 显示详细数据用于验证，显示更多条记录
        console.log('数据样本（以下为部分记录，用于验证）:');
        
        // 前几条
        for (let i = 0; i < Math.min(5, assetDistributionData.length); i++) {
            const item = assetDistributionData[i];
            logDistributionData(i, item);
        }
        
        // 中间部分
        if (assetDistributionData.length > 10) {
            console.log('...');
            const midIndex = Math.floor(assetDistributionData.length / 2);
            for (let i = midIndex - 2; i <= midIndex + 2; i++) {
                if (i >= 0 && i < assetDistributionData.length) {
                    logDistributionData(i, assetDistributionData[i]);
                }
            }
        }
        
        // 后几条
        if (assetDistributionData.length > 5) {
            console.log('...');
            for (let i = Math.max(5, assetDistributionData.length - 5); i < assetDistributionData.length; i++) {
                logDistributionData(i, assetDistributionData[i]);
            }
        }
    } else {
        console.error('处理后没有有效数据!');
    }
}

/**
 * 记录单条分布数据的详细信息
 * @param {number} index 数据索引
 * @param {object} item 分布数据项
 */
function logDistributionData(index, item) {
    const dist = item.distribution;
    console.log(`[${index}] ${formatTimestamp(item.compDate)}:`, 
            `A股=${(dist.CHINA_STOCK*100).toFixed(2)}%`, 
            `境内债=${(dist.CHINA_BOND*100).toFixed(2)}%`,
            `新兴市场=${(dist.OVERSEA_STOCK_EMERGING*100).toFixed(2)}%`,
            `成熟市场=${(dist.OVERSEA_STOCK_MATURE*100).toFixed(2)}%`,
            `现金=${(dist.CASH*100).toFixed(2)}%`,
            `黄金=${(dist.GOLD*100).toFixed(2)}%`,
            `原油=${(dist.OIL*100).toFixed(2)}%`,
            `海外债=${(dist.OVERSEA_BOND*100).toFixed(2)}%`);
}

/**
 * 将毫秒级时间戳转换为标准日期格式（YYYY-MM-DD）
 * 与data-convert.js中的逻辑一致
 * @param {number} timestamp - 毫秒级时间戳
 * @returns {string} 格式化的日期字符串
 */
function formatTimestamp(timestamp) {
    // 创建Date对象
    const date = new Date(timestamp);
    // 获取年份
    const year = date.getFullYear();
    // 获取月份（注意：月份从0开始计数，所以要加1）
    const month = String(date.getMonth() + 1).padStart(2, '0');
    // 获取日期
    const day = String(date.getDate()).padStart(2, '0');
    // 拼接成yyyy-MM-dd格式的日期字符串
    return `${year}-${month}-${day}`;
}

// 添加一个辅助函数，用于验证时间戳转换
function validateTimestamps() {
    // 测试几个关键时间戳
    const testTimestamps = [
        1435680000000,  // 2015-07-01
        1483200000000,  // 2017-01-01
        1546300800000,  // 2019-01-01
        1609459200000   // 2021-01-01
    ];
    
    console.log("===== 时间戳验证 =====");
    testTimestamps.forEach(ts => {
        const date = new Date(ts);
        console.log(`${ts} => ${formatTimestamp(ts)} (JS原生: ${date.toISOString().split('T')[0]})`);
    });
    
    // 如果有实际数据，也测试第一条和最后一条
    if (assetDistributionData && assetDistributionData.length > 0) {
        const first = assetDistributionData[0].compDate;
        const last = assetDistributionData[assetDistributionData.length-1].compDate;
        
        console.log(`首条数据: ${first} => ${formatTimestamp(first)}`);
        console.log(`末条数据: ${last} => ${formatTimestamp(last)}`);
    }
} 
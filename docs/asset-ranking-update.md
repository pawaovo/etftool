# 大类资产排名功能更新文档

## 1. 修改概述

本次修改主要针对页面左侧"大类资产排名"功能进行了优化，解决了页面刷新后数据异常的问题。主要涉及以下三个文件的修改：

- `process-data.js`: 添加了生成资产排名数据的函数
- `plan-data.js`: 修改了资产排名数据的处理和展示逻辑
- `processed-data.js`: 通过重新运行 `process-data.js` 更新了预处理数据

## 2. 问题描述

原有功能在页面加载初次显示正常，但在自动刷新后数据会出现异常，主要是由于百分比数值被错误处理导致的。例如：

- 原始数据中的占比为 `0.5117`（小数形式，表示 51.17%）
- 在前端展示时，错误地将其二次乘以 100，显示为 `51.17%`
- 在页面自动刷新时，这个值被再次处理，又乘以 100，变成了 `5117%`

## 3. 具体修改

### 3.1 `process-data.js` 修改

添加了 `generateAssetRankings` 函数，用于生成按不同指标排序的资产排名列表：

```javascript
function generateAssetRankings(etfData) {
    const result = {
        byUnit: [],        // 按份数排名
        byPercent: [],     // 按占比排名
        byProfit: []       // 按收益率排名
    };
    
    const assets = [];
    if (etfData.composition && Array.isArray(etfData.composition)) {
        etfData.composition.forEach(assetClass => {
            assets.push({
                className: assetClass.className || '未知资产',
                classCode: assetClass.classCode || '',
                unit: assetClass.unit || 0,
                // 确保percent存储为小数形式（不乘以100）
                percent: assetClass.percent || 0,
                // 确保accProfitRate存储为小数形式（不乘以100）
                accProfitRate: assetClass.accProfitRate || 0
            });
        });
    }
    
    // 按份数排序（降序）
    result.byUnit = [...assets].sort((a, b) => b.unit - a.unit);
    
    // 按占比排序（降序）
    result.byPercent = [...assets].sort((a, b) => b.percent - a.percent);
    
    // 按收益率排序（降序）
    result.byProfit = [...assets].sort((a, b) => b.accProfitRate - a.accProfitRate);
    
    return result;
}
```

并在 `processedData` 对象中添加了 `assetRankings` 属性，存储上述排名数据：

```javascript
const processedData = {
    // 保留原始etf数据，以备需要
    originalData: etfData,
    
    // 处理后的资产数据
    assets: processAssets(etfData, adjustData, assetLatestOperations),
    
    // 资产最后操作时间
    assetLatestOperations: assetLatestOperations,
    
    // 最后更新时间
    lastUpdated: new Date().toISOString(),
    
    // 汇总统计数据
    summary: calculateSummary(etfData),
    
    // 大类资产排名
    assetRankings: generateAssetRankings(etfData)
};
```

### 3.2 `plan-data.js` 修改

修改了 `updateAssetRankingItem` 函数，纠正百分比的处理逻辑：

```javascript
function updateAssetRankingItem(className, unit, percent, accProfitRate) {
    // 根据资产名称找到对应的元素
    let assetType = getAssetTypeFromClassName(className);
    const assetItem = document.querySelector(`.asset-item[data-asset-type="${assetType}"]`);
    
    if (!assetItem) return;
    
    // 更新份数和占比
    const sharesElem = assetItem.querySelector('.asset-shares');
    if (sharesElem) {
        // 确保percent是以小数形式传入的，直接格式化为百分比显示
        sharesElem.textContent = `${unit}份 (${percent.toFixed(2)}%)`;
    }
    
    // 更新累计收益率
    const profitElem = assetItem.querySelector('.asset-profit');
    if (profitElem) {
        // 确保accProfitRate是以小数形式传入的，直接格式化为百分比显示
        profitElem.textContent = `+${accProfitRate.toFixed(2)}%`;
        profitElem.className = `asset-profit ${accProfitRate >= 0 ? 'positive' : 'negative'}`;
    }
}
```

修改了 `initPlanPage` 函数，优先使用 `processedData.assetRankings` 而不是 `assetDistribution`：

```javascript
if (processedData.assets) {
    // 检查是否有assetRankings数据
    if (processedData.assetRankings && processedData.assetRankings.byProfit) {
        console.log('使用预处理的资产排名数据');
        
        // 默认使用按收益率排序的数据
        const sortedAssets = processedData.assetRankings.byProfit;
        
        // 遍历排序后的资产，更新资产排名列表
        sortedAssets.forEach(asset => {
            updateAssetRankingItem(
                asset.className,
                asset.unit,
                asset.percent * 100, // 转换为百分比
                asset.accProfitRate * 100 // 转换为百分比
            );
        });
    } else {
        // 如果没有assetRankings，fallback到原来的方法
        console.log('未找到预处理的资产排名数据，使用assetDistribution');
        const assetDistribution = processedData.summary.assetDistribution;
        
        // 遍历所有大类资产，更新资产排名列表
        for (const className in assetDistribution) {
            const assetData = assetDistribution[className];
            updateAssetRankingItem(
                className, 
                assetData.unit, 
                assetData.percent * 100, 
                assetData.accProfitRate * 100
            );
        }
    }
}
```

修改了 `sortAssets` 函数，使用预处理的资产排名数据进行排序：

```javascript
function sortAssets(sortType) {
    // 检查是否有预处理数据及assetRankings
    if (typeof processedData !== 'undefined' && processedData.assetRankings) {
        const assetList = document.querySelector('.asset-list');
        if (!assetList) return;
        
        // 根据排序方式获取对应的排序结果
        let sortedAssets;
        if (sortType === 'shares') {
            console.log('按份数排序');
            sortedAssets = processedData.assetRankings.byUnit;
        } else if (sortType === 'profit') {
            console.log('按收益率排序');
            sortedAssets = processedData.assetRankings.byProfit;
        } else {
            console.warn('未知的排序方式:', sortType);
            return;
        }
        
        // 确保有排序结果
        if (!sortedAssets || sortedAssets.length === 0) {
            console.warn('无排序结果');
            return;
        }
        
        console.log(`使用预处理的排序结果，共${sortedAssets.length}项`);
        
        // 清空当前资产列表的选中状态
        const assetItems = Array.from(document.querySelectorAll('.asset-item'));
        assetItems.forEach(item => item.classList.remove('active'));
        
        // 遍历排序后的资产，更新资产排名列表
        sortedAssets.forEach(asset => {
            const assetType = getAssetTypeFromClassName(asset.className);
            const assetItem = document.querySelector(`.asset-item[data-asset-type="${assetType}"]`);
            
            if (assetItem) {
                // 将该项移动到列表末尾，实现排序
                assetList.appendChild(assetItem);
                
                // 更新份数和占比显示
                updateAssetRankingItem(
                    asset.className,
                    asset.unit,
                    asset.percent * 100, // 转换为百分比
                    asset.accProfitRate * 100 // 转换为百分比
                );
            }
        });
        
        // 选中第一个资产
        const firstAssetItem = assetList.querySelector('.asset-item');
        if (firstAssetItem) {
            firstAssetItem.classList.add('active');
            const firstAssetType = firstAssetItem.getAttribute('data-asset-type');
            showAssetDetails(firstAssetType);
        }
        
        // 更新URL参数
        updateUrlParams('sort', sortType);
    } else {
        // 兼容旧代码：如果没有预处理数据，使用原来的DOM操作方式排序
        // ...原有的排序逻辑...
    }
}
```

## 4. 实施效果

这些修改确保了：
1. 数据以一致的格式存储和处理
2. 前端展示时正确处理百分比值
3. 页面排序功能使用预处理数据，减少运行时计算
4. 页面刷新时数据保持正确的格式和值

修改不会影响原有的"大类资产详情"功能，包括ETF卡片的"最后操作"等指标。

## 5. 注意事项

- 如果更新了 `etf.json` 数据，需要重新运行 `node process-data.js` 生成最新的预处理数据
- 所有百分比值在内部存储时均为小数形式（如 0.5117 表示 51.17%），只在显示时才转换为百分比格式

## 6. 待优化项

在检查代码过程中，发现 `updateAssetDetailHeader` 函数的处理逻辑存在潜在问题：

```javascript
function updateAssetDetailHeader(className, unit, percent, accProfitRate) {
    // 找到对应的资产组
    const assetGroupHeaders = document.querySelectorAll('.asset-group-header');
    
    assetGroupHeaders.forEach(header => {
        const titleElem = header.querySelector('h4');
        if (!titleElem) return;
        
        // 判断是否是当前处理的资产类别
        let currentTitle = titleElem.textContent.split(' ')[0];
        if ((className === '现金' && currentTitle.includes('现金')) ||
            (className === '境内债券' && currentTitle.includes('境内')) ||
            (currentTitle === className)) {
            
            // 更新份数和占比
            const sharesElem = header.querySelector('.detail-shares');
            if (sharesElem) {
                sharesElem.textContent = `${unit}份 (${(percent * 100).toFixed(2)}%)`;
            }
            
            // 更新累计收益率
            const profitElem = header.querySelector('.detail-profit');
            if (profitElem) {
                const profitValue = accProfitRate * 100;
                profitElem.textContent = `累计收益率 +${profitValue.toFixed(2)}%`;
                profitElem.className = `detail-profit ${profitValue >= 0 ? 'positive' : 'negative'}`;
            }
        }
    });
}
```

该函数在处理百分比时，仍在将值乘以 100，但没有和其他函数保持一致。目前可以正常工作是因为传入的值通常直接来自 etf.json，尚未被处理。但若将来从 processedData 中获取数据时可能会出现类似问题。

### 未来优化建议：

1. 统一所有处理百分比的函数的行为，全部采用相同的输入参数约定
2. 添加明确的参数文档注释，说明期望的输入格式（小数还是百分比）
3. 考虑添加数据类型检查，避免重复处理
4. 将 `updateAssetDetailHeader` 也修改为与 `updateAssetRankingItem` 相同的处理逻辑

## 7. 更新日期

- 2024-04-XX：初始修改完成 
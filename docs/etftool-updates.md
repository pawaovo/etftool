# ETF投资工具项目更新文档

## 项目概述
ETF投资工具是一个用于展示和分析E大150计划投资情况的前端页面。主要显示大类资产排名、大类资产详情和资产占比趋势等信息。

## 主要改动内容

### 1. 移除现金大类资产的详情显示
- **目标**：由于现金没有对应的ETF基金，从"大类资产详情"中移除现金大类资产
- **实现**：
  - 在`generateAssetGroupsHTML`函数中添加判断，跳过现金类资产的渲染
  - 在`showAssetDetails`和`scrollToAssetGroup`函数中添加条件，点击现金资产时不响应
- **文件**：
  - `plan-data.js`

```javascript
// 跳过现金资产不显示
if (assetClass.isCash || assetClass.className === '现金') {
  console.log('跳过现金资产 - 不在"大类资产详情"中显示现金');
  return;
}

// 点击现金资产时不响应
if (assetType === 'cash') {
  console.log('现金资产无详情可显示，已跳过操作');
  return;
}
```

### 2. 修复境内债券的跳转和排序问题
- **目标**：解决点击"境内债券"不跳转以及排序异常的问题
- **原因**：HTML中使用`domestic-bond`而JavaScript中使用`cn-bond`的不一致
- **解决方法**：
  - 统一修改HTML中的资产类型标识符为`cn-bond`
  - 优化`scrollToAssetGroup`函数，增加特殊情况处理
- **文件**：
  - `150plan.html`
  - `plan-data.js`

```javascript
// 改进的资产组查找逻辑
if (!targetGroup && assetType === 'cn-bond') {
  console.log('使用特殊处理查找境内债券资产组');
  // 查找标题中包含"境内债券"的资产组
  for (const group of assetGroups) {
    const title = group.querySelector('.asset-group-header h4');
    if (title && title.textContent.includes('境内债券')) {
      targetGroup = group;
      console.log('找到境内债券资产组');
      break;
    }
  }
}
```

### 3. 动态资金状况显示
- **目标**：将静态资金显示(`现投入/现金 xx/xx 75.43%`)改为动态数据
- **实现**：
  - 创建HTML结构显示持仓和现金信息
  - 添加CSS样式，使用颜色区分不同类型
  - 实现`updateFundStatusDouble`函数计算和更新数据
- **文件**：
  - `150plan.html`（HTML结构和CSS样式）
  - `plan-data.js`（数据更新功能）

```html
<!-- 资金状况单行显示 -->
<div class="fund-status-single">
  <span class="position-group">持仓 <span id="total-position-units">xx</span>份 <span id="total-position-percent">xx%</span></span>    
  <span class="cash-group">现金 <span id="total-cash-units">xx</span>份 <span id="total-cash-percent">xx%</span></span>
</div>
```

```javascript
/**
 * 更新资金状况显示
 */
function updateFundStatusDouble(data) {
  // 计算持仓总份数（除现金外的所有资产份数之和）
  let totalPositionUnits = 0;
  let cashUnits = 0;
  const totalUnits = 150; // 150计划总份数固定为150份
  
  // 遍历所有资产，计算持仓总份数和现金份数
  for (const className in assetDistribution) {
    const assetData = assetDistribution[className];
    if (className === '现金' || assetData.isCash) {
      cashUnits = assetData.unit;
    } else {
      totalPositionUnits += assetData.unit;
    }
  }
  
  // 计算百分比和更新显示
  const positionPercent = (totalPositionUnits / totalUnits * 100).toFixed(2);
  const cashPercent = (cashUnits / totalUnits * 100).toFixed(2);
  
  positionUnitsElem.textContent = totalPositionUnits;
  positionPercentElem.textContent = positionPercent + '%';
  cashUnitsElem.textContent = cashUnits;
  cashPercentElem.textContent = cashPercent + '%';
}
```

### 4. 界面布局优化
- **目标**：优化"大类资产排名"区域的布局和样式
- **实现**：
  - 增加元素间距，改进标题区域布局
  - 优化排序按钮样式，添加填充和居中对齐
  - 调整资金状况文字颜色和位置
- **文件**：
  - `150plan.html`（CSS样式）

```css
/* 调整排名标题区域布局 */
.asset-ranking-header {
  padding: 15px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

/* 排序按钮样式 */
.sort-controls {
  display: flex;
  width: 100%;
  border: 1px solid #dddddd;
  border-radius: 4px;
  overflow: hidden;
}

.sort-btn {
  flex: 1;
  text-align: center;
  padding: 8px 12px;
  cursor: pointer;
  background-color: #f5f5f5;
  transition: all 0.2s ease;
  font-size: 14px;
  white-space: nowrap;
}
```

## 数据流和交互逻辑

### 数据流程
1. 从`etf.json`和`adjust.json`读取原始数据
2. 通过`process-data.js`预处理数据并生成`processed-data.js`
3. 页面加载时，读取`processed-data.js`中的数据并渲染界面

### 交互功能
1. **资产排名切换**：可按份数(占比)或累计收益率排序
2. **资产详情查看**：点击左侧资产项，右侧显示相应资产详情
3. **自动隐藏现金**：现金资产不在右侧详情中显示，但左侧排名中保留

## 已知问题和注意事项
1. 所有数据依赖`process-data.js`脚本的预处理结果，更新数据后需运行此脚本
2. 现金资产在左侧排名中显示，但点击不会有任何响应（设计如此）
3. 资产类型标识符需保持一致，HTML和JavaScript中均使用`cn-bond`表示境内债券

## 后续工作建议
1. 考虑添加更多数据可视化图表，如收益趋势、资产配置分析等
2. 优化移动端显示，提高响应式设计的适配性
3. 添加数据导出功能，方便用户保存分析结果
4. 考虑增加历史数据对比功能，分析不同时期的投资状况变化

---

此文档记录了ETF投资工具项目的主要更新内容，包括功能实现和界面优化，可作为后续开发的参考。更新时间：2024年。 
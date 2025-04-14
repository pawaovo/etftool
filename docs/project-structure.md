# ETF投资工具项目文件结构与说明

## 项目概述
ETF投资工具是一个用于展示和分析E大150计划投资组合的前端应用。主要功能包括展示大类资产排名、ETF基金详情、资产占比趋势等。

## 主要文件结构

### 核心HTML文件
- `150plan.html` - 150计划主页面，展示ETF投资组合数据
- `150plan-simple.html` - (可能) 简化版150计划页面
- `150plan-local.html` - (可能) 本地版本页面
- `asset-ratio.html` - (可能) 资产比例页面
- `splan.html` - (可能) S计划页面 (如果存在)
- `grid-test.html` - (可能) Grid布局测试页面
- `page-template.html` - (可能) 页面模板
*注意: 需要确认这些HTML文件的具体用途和当前状态*

### 核心JavaScript文件
- `plan-data.js` - **核心逻辑文件**，包含页面交互和数据处理功能
- `asset-distribution-chart.js` - (可能) 资产分布图表逻辑
- `process-data.js` - **数据预处理脚本** (Node.js)
- `processed-data.js` - **预处理数据文件** (由`process-data.js`生成)
- `dateUtils.js` - 日期处理工具函数
- `serve.js` - (可能) Node.js本地服务器脚本
- `script.js` - (可能) 通用或特定页面的脚本

### 数据文件
- `etf.json` - ETF基金原始数据
- `adjust.json` - 投资调整记录
- `processed-data.js` - (生成文件) 预处理后的数据
- `class-distribution.json` - (可能) 类别分布数据
- `test.json` - (可能) 测试数据

### 样式文件
- `plan-data.css` - 主要样式文件
- `styles.css` - (可能) 通用样式文件 (在 `styles/` 目录下?)

### 文档文件
- `README.md` - 项目总体说明 (根目录)
- `deploy-guide.md` - Vercel部署指南 (根目录)
- `docs/` - 详细文档目录
  - `project-structure.md` - 本文档
  - `etftool-updates.md` - 功能更新记录
  - `asset-ranking-update.md` - 资产排名更新记录
  - `etf-display-requirements.md` - ETF显示需求

### 配置和脚本文件
- `package.json` - 项目配置和NPM脚本
- `package-lock.json` - 依赖锁定文件
- `.gitignore` - (可能) Git忽略配置
- `create-local-version.bat`, `run-local.bat`, `start-server.bat` - (Windows) 批处理脚本
- `local-version-creator.js`, `data-convert.js` - (可能) 辅助脚本

### 辅助目录
- `backups/` - 备份目录
- `docs/` - 文档目录
- `scripts/` - (可能) 辅助脚本目录 (如 `getLowestNav.js`)
- `styles/` - (可能) 通用样式目录
- `data/` - (可能) 其他数据文件目录
- `api/` - (可能) API相关代码目录
- `node_modules/` - Node.js依赖安装目录
- `.git/` - Git版本控制目录
- `.cursor/` - (可能) Cursor IDE配置目录

## 数据流与处理流程

### 数据预处理流程
1. 运行 `node process-data.js`
2. 脚本读取 `etf.json` 和 `adjust.json`
3. 进行数据处理、计算和整合
4. 生成 `processed-data.js` 文件，包含预处理好的数据

### 页面加载流程
1. 浏览器加载 `150plan.html` 或 `splan.html`
2. 页面引入 `processed-data.js` 和 `plan-data.js`
3. `plan-data.js` 中的 `initPlanPage()` 函数执行，初始化页面
4. 检测到预处理数据存在，使用预处理数据初始化界面
5. 动态生成资产组、ETF卡片等HTML结构
6. 设置排序控件、资产项点击响应等交互功能

## 关键注意事项

### 1. 数据更新流程
- **重要**: 每次更新 `etf.json` 或 `adjust.json` 后，必须运行 `node process-data.js` 生成最新的预处理数据
- 更新顺序: 更新源数据 → 运行预处理脚本 → 刷新页面

### 2. 资产类型标识一致性
- 确保HTML和JavaScript中的资产类型标识保持一致
- 例如：境内债券统一使用 `cn-bond`，不要混用 `domestic-bond`
- 在类名、`data-asset-type` 属性和getAssetTypeFromClassName函数中保持一致

### 3. 现金资产特殊处理
- 现金资产在左侧排名中显示，但在右侧详情中不显示
- 点击现金资产时不会触发跳转或其他交互

### 4. 资产分类修改注意事项
- 如需修改或添加资产分类，需在以下位置同步更新:
  - `plan-data.js` 中的 `getAssetTypeFromClassName` 函数
  - `plan-data.css` 中的对应颜色样式
  - HTML中相应的资产图标和类名

### 5. 排序功能扩展
- 当前支持按份数和累计收益率排序 (通过 `processedData.assetRankings`)
- 如需扩展排序功能，需修改 `process-data.js` 中的 `generateAssetRankings` 函数，并在 `plan-data.js` 的 `sortAssets` 函数中添加处理逻辑。

## 代码优化建议

1. **模块化改进**
   - 考虑将 `plan-data.js` 拆分为多个功能模块，如数据处理、UI生成、交互响应等

2. **代码注释**
   - 为复杂逻辑添加更详细的注释，特别是数据处理和排序算法部分

3. **错误处理**
   - 增强错误处理机制，添加更友好的错误提示
   - 针对数据加载失败情况提供备选方案

4. **性能优化**
   - 考虑使用虚拟滚动技术处理大量ETF卡片的显示
   - 优化DOM操作，减少不必要的重绘和回流

## 未来扩展方向

1. **数据可视化增强**
   - 添加更多图表类型，如收益趋势折线图、基金对比图表等
   - 实现更多交互式数据分析功能

2. **用户体验改进**
   - 添加暗黑模式支持
   - 增加更多自定义设置选项
   - 优化移动端体验

3. **数据分析功能**
   - 添加历史表现分析
   - 实现基金对比功能
   - 提供投资建议和模拟功能

---

文档更新日期: 2024年7月 (根据当前更新调整) 
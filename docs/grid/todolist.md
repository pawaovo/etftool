# 开发待办列表（To-Do List） - 网格策略页面 (`grid.html` & `grid-detail.html`)

*请严格按顺序执行任务，完成后勾选并记录日志。*

**重要提示：** `grid.html` 和 `grid-detail.html` 的前端页面已经分别在 `reference-html/index.html` 和 `reference1-html/grid-trading-calculator.html` 中实现。开发时，**阶段一** 的任务是将这些文件复制到项目根目录并重命名，而不是从头创建。后续阶段主要是在 `js/grid-data.js` 和 `js/grid-detail.js` 中实现数据处理、计算、渲染和交互逻辑，以填充和驱动这些现有的 HTML 页面。

## 阶段一：准备 HTML/CSS/JS 基础文件

- [✅] **1.1: 准备 HTML 文件**: 复制 `reference-html/index.html` 到 `grid` 文件夹，重命名为 `grid.html`；复制 `reference1-html/grid-trading-calculator.html` 到 `grid` 文件夹，重命名为 `grid-detail.html`。同时复制 `reference-html` 和 `reference1-html` 中的 `css/` 和 `js/` 目录到 `grid` 文件夹对应子目录中。
- [✅] **1.2: 创建核心 JS 文件**: 在 `js/` 目录下创建空的 `grid-data.js` 和 `grid-detail.js` 文件。
- [✅] **1.3: 验证 CSS 和 JS 链接**: 检查 `grid.html` 和 `grid-detail.html` 文件：
    - [✅] 确保它们正确链接了所需的 CSS 文件（可能包括通用的 `styles/plan-data.css`, `styles/etf-cards.css` 以及它们自带的相对路径样式）。
    - [✅] 确保它们在底部正确引入了对应的核心 JS 文件 (`js/grid-data.js` for `grid.html`, `js/grid-detail.js` for `grid-detail.html`)。如果未引入，请添加 `<script>` 标签。

## 阶段二：数据加载与核心计算 (`js/grid-data.js`)

- [✅] **2.1: 获取 JSON 文件列表**: 实现获取 `public/data/grid/` 下所有 `<code>(<category>).json` 文件名列表的逻辑 (可硬编码或使用索引文件)。
- [✅] **2.2: 异步加载单个 JSON**: 实现 `fetchJsonData(filename)` 函数，处理加载成功/失败。
- [✅] **2.3: 获取最新净值**: 实现 `fetchLatestNetValues()` 函数:
    - [✅] 根据文件名列表提取所有基金代码。
    - [✅] 循环调用 `erd.md` 中指定的API (`https://tiantian-fund-api.vercel.app/...&key=<code>`) 获取每个代码的最新净值 (`DWJZ`)。
    - [✅] 将结果处理成 `{ "code": netValue, ... }` 格式。
    - [✅] **(可选/推荐)** 将获取到的净值写入 `public/data/grid/latest_netvalues.json` 文件 (注意：纯前端JS写入文件受限，此步骤可能需要在本地Node.js环境或手动完成，或者JS仅在内存中持有)。 *如果无法写入文件，则每次加载页面都需要重新请求API。*
- [✅] **2.4: 加载所有数据**: 并行或串行加载所有 ETF JSON 文件和最新净值数据。
- [✅] **2.5: 实现核心计算函数 (根据 `erd.md` 补充的逻辑)**:
    - [✅] `calculateEtfData(jsonData, latestNetValue)`: 接收单个ETF的JSON数据和其最新净值，计算 `erd.md` 中定义的"网格策略卡片数据结构"所需的字段。
- [✅] **2.6: 处理所有ETF数据**: 遍历加载的JSON数据，调用 `calculateEtfData` 生成包含所有ETF计算后数据的数组 `allEtfData`。
- [✅] **2.7: 计算总体概览信息**: 实现 `calculateOverallSummary(allEtfData)`，计算 `erd.md` 中定义的总体信息字段（总执行次数、总买卖金额/股数、总收益/收益率）。

## 阶段三：主界面渲染与交互 (`grid.html` / `js/grid-data.js`)

- [ ] **3.1: 渲染总体概览**: 将阶段 2.7 计算出的总体信息显示在 `grid.html` 页面顶部的对应元素中。
- [ ] **3.2: 生成卡片HTML**: 实现 `createCardElement(etfData)`，根据单个ETF计算后的数据生成卡片HTML字符串（结构需匹配 `grid.html` 中卡片容器的预期）。
- [ ] **3.3: 分类渲染卡片**: 根据 `etfData.isRunning` 状态，将生成的卡片HTML分别添加到 `grid.html` 中 "运行中" 和 "已暂停" 的容器元素内。
- [✅] **3.4: 实现卡片排序**: 为 `grid.html` 中的排序控件添加事件监听，根据选择的字段 (`executionCount`, `cumulativeYieldRate`, `netValueChangeRate`) 对 `allEtfData` 排序，并清空后重新执行 3.3 渲染卡片。
- [ ] **3.5: 实现查看详情跳转**: 给 `grid.html` 中卡片上的"查看详情"按钮添加点击事件，使其导航到 `grid-detail.html`，并通过 URL 参数传递 `etfCode` 或 `sourceFile`。
- [ ] **3.6: 页面加载逻辑**: 确保 DOM 加载完成后，在 `js/grid-data.js` 中触发执行数据加载 (阶段二)、计算和初始渲染 (阶段三)。

## 阶段四：详情页面数据处理与渲染 (`grid-detail.html` / `js/grid-detail.js`)

- [ ] **4.1: 获取参数并加载数据**: 在 `js/grid-detail.js` 中，页面加载时从 URL 参数获取 `etfCode` (或 `sourceFile`)，然后加载对应的单个 ETF JSON 数据和 `latest_netvalues.json` (或从 `grid.html` 传递数据，待定)。
- [ ] **4.2: 计算详情数据**: 调用 `js/grid-data.js` 中的 `calculateEtfData` (或复用其逻辑) 计算该ETF的详细数据 `detailData` (应包含 `erd.md` 中"网格策略详细信息数据结构"所需的所有原始或待计算数据)。
- [ ] **4.3: 渲染顶部信息栏**: 使用 `detailData` 填充 `grid-detail.html` 页面顶部的各项信息元素。
- [ ] **4.4: 准备图表数据**: 实现 `prepareChartData(detailData)`，根据 `交易记录` 转换成图表库所需的格式 (参考 `erd.md` 中 `trendData` 结构)。
- [ ] **4.5: (集成图表库) 渲染趋势图**: 初始化图表库 (如 Chart.js, ECharts)，传入 `chartData` 渲染到 `grid-detail.html` 的图表容器元素中。
- [ ] **4.6: 实现图表交互**: 配置图表库，实现悬停在卖出点时高亮配对买入点、连线并显示详细信息的 Tooltip。
- [ ] **4.7: 准备交易明细表格数据**: 实现 `prepareTradeDetailsTable(detailData)`，格式化 `交易记录` 并计算表尾合计 (参考 `erd.md` 中 `tradeDetailsTable` 结构)。
- [ ] **4.8: 渲染交易明细表格**: 将 `tradeDetailsTableData` 渲染到 `grid-detail.html` 的交易明细表格元素中。
- [ ] **4.9: 准备网格策略参数数据**: 实现 `prepareStrategyParams(detailData)`，提取或设置默认的网格策略参数 (参考 `erd.md` 中 `gridStrategyDetails.parameters` 结构)。
- [ ] **4.10: 渲染网格策略参数区**: 将 `strategyParamsData` 显示在 `grid-detail.html` 的参数区元素中，并为可修改参数关联输入控件。
- [ ] **4.11: 实现网格档位计算逻辑**: **(核心复杂功能)** 实现 `calculateGridLevels(strategyParams, tradeHistory)` 函数，根据输入的策略参数和交易历史，**重新计算** 网格档位详情表的所有数据及表尾合计 (参考 `erd.md` 中 `gridStrategyDetails.gridLevelsTable` 结构)。
- [ ] **4.12: 准备并渲染初始网格档位表**: 调用 `calculateGridLevels` 使用初始参数计算数据，并将其渲染到 `grid-detail.html` 的网格档位详情表元素中。

## 阶段五：详情页面交互 (`grid-detail.html` / `js/grid-detail.js`)

- [ ] **5.1: 实现表格切换**: 为 `grid-detail.html` 中的表格切换按钮添加点击事件，控制交易明细表格和网格策略表格容器元素的显示/隐藏。
- [ ] **5.2: 实现参数修改与表格重新生成**:
    - [ ] 给 `grid-detail.html` 网格参数区的"修改"按钮（或参数输入框的 `change` 事件）添加监听。
    - [ ] 读取用户修改后的参数。
    - [ ] 调用 `calculateGridLevels` 函数 (4.11)，传入**修改后的参数**和**原始交易历史**，重新计算档位详情表数据。
    - [ ] 清空并重新渲染网格档位详情表元素 (复用 4.12 的渲染逻辑)。
- [ ] **5.3: 实现返回按钮**: 给 `grid-detail.html` 中的返回按钮添加点击事件，使其导航回 `grid.html`。

## 阶段六：优化与测试

- [ ] **6.1: 验证并按需调整响应式设计**: 检查 `grid.html` 和 `grid-detail.html` 在不同屏幕尺寸下的布局和可用性。
- [ ] **6.2: (可选) 动效添加**: 添加简单的 CSS 过渡或 JS 动效。
- [ ] **6.3: 代码审查与优化**: 检查 `js/grid-data.js` 和 `js/grid-detail.js` 代码，优化性能，确保注释清晰。
- [ ] **6.4: 错误处理**: 完善数据加载、API调用、计算过程中的错误处理和用户提示。
- [ ] **6.5: 全面功能测试**: 对照 `prd.md` 和 `erd.md` 测试所有功能、计算逻辑和交互。
- [ ] **6.6: 数据准确性测试**: 抽查几个 ETF 的数据，手动核对页面显示结果与预期计算是否一致。

---
*（文档结束）* 
# 开发待办列表（To-Do List） - 网格策略页面 (`grid.html` & `grid-detail.html`)

*请严格按顺序执行任务，完成后勾选并记录日志。*

## 阶段一：基础结构与样式

- [✅] **1.1: 创建 HTML 文件**: 创建 `grid.html` 和 `grid-detail.html`，设置基本骨架。
- [✅] **1.2: 引入 CSS**: 在两个 HTML 文件中链接 `styles/plan-data.css` 和 `styles/etf-cards.css`。
- [✅] **1.3: 创建 JS 文件**: 创建 `js/grid-data.js` 和 `js/grid-detail.js`，并在对应 HTML 文件底部引入。
- [✅] **1.4: `grid.html` 布局**: 创建主容器、顶部导航按钮区、总体信息概览区、卡片列表容器区 (按运行中/已暂停分类)。
- [✅] **1.5: `grid-detail.html` 布局**: 创建主容器、返回按钮、顶部信息栏、图表容器、表格切换按钮、交易明细表格容器、网格策略表格容器（包含参数区和档位详情表区）。

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
    - [✅] `calculateEtfData(jsonData, latestNetValue)`: 接收单个ETF的JSON数据和其最新净值，计算以下字段：
        - `etfName`, `etfCode`, `category` (提取)
        - `isRunning` (计算: `网格交易数据` 是否存在)
        - `basePrice` (计算: 第一个档位的平均买入价)
        - `executionCount` (计算: `交易记录` 数量 / 2)
        - `tradePairs` (计算: 将 `交易记录` 两两配对)
        - `cumulativeProfit` (计算: 汇总所有配对交易的 `收益`)
        - `totalBuyAmount` (计算: 汇总所有买入交易的 `交易金额`)
        - `cumulativeYieldRate` (计算: `cumulativeProfit / totalBuyAmount`)
        - `currentLevelInfo` (计算: 根据 `latestNetValue` 和 `网格交易数据` 判断当前档位及买入价，处理多网格情况)
        - `currentLevelBuyPrice` (格式化输出 `currentLevelInfo`)
        - `smallGridStep` (计算: 前两个档位差值)
        - `mediumGridStep`, `largeGridStep` (默认值 15, 30)
        - `stepSize` (格式化输出: `small/medium/large`)
        - `netValueChangeRate` (计算: `(latestNetValue - currentLevelInfo.buyPrice) / currentLevelInfo.buyPrice`)
        - `headerColor` (计算: 根据 `netValueChangeRate` 正负)
        - `sourceFile` (提取)
- [✅] **2.6: 处理所有ETF数据**: 遍历加载的JSON数据，调用 `calculateEtfData` 生成包含所有ETF计算后数据的数组 `allEtfData`。
- [✅] **2.7: 计算总体概览信息**: 实现 `calculateOverallSummary(allEtfData)`，计算 `erd.md` 中定义的总体信息字段（总执行次数、总买卖金额/股数、总收益/收益率）。

## 阶段三：主界面渲染与交互 (`grid.html` / `js/grid-data.js`)
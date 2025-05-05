# 工程结构和数据结构设计文档（ERD）——网格策略

## 1. 工程结构

- **页面文件**：
  - `grid.html`：主页面，展示网格策略**概览信息**和**卡片列表**，并提供到 `grid-detail.html` 的查看详情按钮**导航**。
  - `grid-detail.html`: **（新增）** 网格策略详细信息页面，展示单个ETF的趋势图、交易明细和网格设置。
  - `styles/plan-data.css`：页面主要样式（通用样式）。
  - `styles/etf-cards.css`：卡片样式（通用样式）。
  - `js/grid-data.js`：处理 `grid.html` 页面的数据加载、解析、转换、**概览计算**和**卡片渲染**的脚本。**可能也包含部分 `grid-detail.html` 的共享逻辑或数据传递准备。**
  - `js/grid-detail.js`: **（新增/可选）** 处理 `grid-detail.html` 页面的数据加载（或接收）、图表渲染、表格渲染和交互的脚本。*如果逻辑简单，也可合并到 `grid-data.js` 中。*
  - `js/vendors/`：可能引入的第三方库，如图表库（例如 Chart.js, ECharts）。

- **数据文件**：
  - `public/data/grid/`：存放源数据的目录。
    - `<code>(<category>).json`：每个ETF的源数据文件。

    - **(新增)** `latest_netvalues.json` ：用于提供 `最新净值` 数据，通过外部接口获得，用基金的代码作为关键字，调用接口获得其最新净值数据。
    以`512980(传媒).json`为例，基金代码为512980，
    接口为：https://tiantian-fund-api.vercel.app/api/action?action_name=fundSearch&m=1&key=512880
    返回数据为：
{"ErrCode":0,"ErrMsg":"fromes","Datas":[{"_id":"512880","CODE":"512880","NAME":"国泰中证全指证券公司ETF","JP":"GTZZQZZQGSETF","CATEGORY":700,"CATEGORYDESC":"基金","STOCKMARKET":null,"BACKCODE":"512880","MatchCount":1,"FundBaseInfo":{"_id":"512880","FCODE":"512880","SHORTNAME":"国泰中证全指证券公司ETF","JJGSID":"80000224","JJGS":"国泰基金","JJJLID":"30277862","JJJL":"艾小军","FUNDTYPE":"001","ISBUY":"","FTYPE":"指数型-股票","MINSG":"","JJGSBID":6,"OTHERNAME":"国泰中证全指ETF,国泰中证证券ETF,证券ETF","FSRQ":"2025-04-25","DWJZ":1.0404,"RSFUNDTYPE":"000","NAVURL":"http://fund.eastmoney.com/ZS_jzzzl.html"},"StockHolder":null,"ZTJJInfo":[{"TTYPE":"BK000128","TTYPENAME":"证券"},{"TTYPE":"BK000127","TTYPENAME":"非银金融"}],"SEARCHWEIGHT":0,"NEWTEXCH":""}]}
其中的"DWJZ"字段为其最新净值信息"DWJZ":1.0404。

将所有`<code>(<category>).json`都通用上述方法，通过基金代码得到最新净值信息，然后将最新的净值信息和对应基金信息写入`latest_netvalues.json`中。
每天获取到的最新净值以一组数据进行存储如：
{
  "lastUpdated": "2025-05-03",
  "159920": {"netValue": 1.0532},
  "159938": {"netValue": 2.1556},
  "512880": {"netValue": 1.0404},
  "512980": {"netValue": 0.8765},
  "513050": {"netValue": 1.2345},
  "513180": {"netValue": 0.9876},
  "513500": {"netValue": 5.4321},
  "513520": {"netValue": 2.3456},
  "515180": {"netValue": 1.5432}
} 

- **文档**：
  - `docs/grid/`：存放网格策略相关文档。
    - `readme.md`: 开发指南。
    - `prd.md`: 产品需求文档。
    - `erd.md`: 本文档。
    - `todolist.md`: 开发任务清单。

- **项目根目录**：
  - `index.html`: (项目入口页)。
  - `150plan.html`: 定投计划页面。
  - `Splan.html`: (其他计划页面)。
  - `grid.html`: 网格策略**列表**页面。
  - `grid-detail.html`: 网格策略**详细**页面。
  - `public/`: 静态资源目录。
  - `styles/`: CSS样式目录。
  - `js/`: JavaScript脚本目录。
  - `docs/`: 文档目录。

## 2. 数据结构

**数据来源**：
- 主要源数据为存储在 `public/data/grid/` 目录下的 `<code>(<category>).json` 文件。
- `最新净值` 的数据通过上述 **(新增)** `latest_netvalues.json`提到的方法进行提供。
- 前端 (`js/grid-data.js`, `js/grid-detail.js`) 读取、解析和转换数据。

**源JSON文件数据结构 (以 `512980(传媒).json` 为例)**：
```json
{
  "网格交易示例表": "string", // ETF名称和代码描述
  "最新时间": "string",    // 数据最后更新时间
  // --- 网格档位设置 ---
  "网格交易数据": [
    {
      "网格种类": "string", // 如 "小网", "中网", "大网"
      "档位": "number",    // 相对基准价的比例或绝对价格?
      "买入触发价": ["string", "string"], // 价格区间或单值?
      "买入价": ["string", "string"],   // 同上
      "买入金额": ["string", "string"], // 计划买入金额
      "入股数": ["string", "string"],   // 计划买入股数
      "卖出触发价": ["string", "string"],
      "卖出价": ["string", "string"],
      "出股数": "string", // 计划卖出股数 (与买入股数通常对应)
      "卖出金额": "string" // 计划卖出金额
      // (步长百分比是否也应在此定义?)
    },
     {
      "网格种类": "string", // 如 "小网", "中网", "大网"
      "档位": "number",    // 相对基准价的比例或绝对价格?
      "买入触发价": ["string", "string"], // 价格区间或单值?
      "买入价": ["string", "string"],   // 同上
      "买入金额": ["string", "string"], // 计划买入金额
      "入股数": ["string", "string"],   // 计划买入股数
      "卖出触发价": ["string", "string"],
      "卖出价": ["string", "string"],
      "出股数": "string", // 计划卖出股数 (与买入股数通常对应)
      "卖出金额": "string" // 计划卖出金额
      // (步长百分比是否也应在此定义?)
    }
  ]

  // --- 交易流水 ---
  "交易记录": [
    {
      "日期": "string",      // 格式?
      "交易金额": "string",    // (需转 number)
      "实际交易价格": "string",// (需转 number)
      "交易股数": "string",    // (需转 number)
      "收益": "string",      // (需转 number, 卖出时)
      "收益率": "string"     // (格式如 "x.xx%", 卖出时)
    },
    {
      "日期": "string",      // 格式?
      "交易金额": "string",    // (需转 number)
      "实际交易价格": "string",// (需转 number)
      "交易股数": "string",    // (需转 number)
      "收益": "string",      // (需转 number, 卖出时)
      "收益率": "string"     // (格式如 "x.xx%", 卖出时)
    }
    // ...
  ]
}

重要说明：根据源JSON文件，可判断/计算出各项数据，大致根据JSON文件分为"网格交易数据"和"交易记录"两大部分：
- "网格交易数据"：

在JSON文件中按顺序（从头到尾）查找"网格交易数据"中的各组组数据，其"买入价"和"卖出价"都会有两个数字，其平均值即为其实际"买入价"和"卖出价"。如"买入价": ["0.774", "0.776"],实际买入价为=（0.774+0.776）/2=0.775。"卖出价": ["0.774", "0.776"],实际卖出价为=（0.774+0.776）/2=0.775。

"smallGridStep"（小网步长）：在JSON文件中按顺序（从头到尾）查找"网格交易数据"中最先出现的两组数据，两组数据中的"档位"差值即为该策略的小网步长（为小网步长初始值），如第一组为1.00，第二组为0.95，小网步长即为5%。如第一组为1.00，第二组为0.90，小网步长即为10%。（小网步长根据计算得出，中网 "mediumGridStep"/大网"largeGridStep"步长初始值默认为15%和30%）

"isRunning"（运行状态）：在在JSON文件中，查找"网格交易数据"，JSON中不存在的，其网格策略状态为已暂停，其余情况为运行中。

"basePrice"（基准价）：为其网格策略中基金的第一份买入价格（1.00档位时的买入价）。在JSON文件中按顺序（从头到尾）查找"网格交易数据"中的第一组数据，其"买入价"会有两个数字，其平均值即为基准价。如"买入价": ["0.774", "0.776"],基准价=（0.774+0.776）/2=0.775。
特别注意：当"买入价"中存在多组（大于2组）数据时，取其列表内倒数2组数据进行计算。


- "交易记录"：
在JSON文件中，"交易记录"部分中出现的各组数据，按其出现顺序，两两组数据互一对，前者为买入交易，后者为卖出交易，两者组合即为一次完整的网格策略执行交易。前者数据信息中没有收益和收益率（为空字段，因为为买入交易），后者数据信息中存在收益和收益率（即为本次网格策略执行的收益和收益率）

"executionCount"（执行次数）：在JSON文件中，查找"交易记录"中的数据，数据以组为单位依顺序进行展示，用所有组（单次交易）的个数 /2 即为网格策略执行次数（完整买入/卖出交易）。

"Profit"（收益）：在JSON文件中，查找"交易记录"中的数据，根据其出现的各组数据，按顺序两两匹配，后者（卖出交易）数据中的收益即为和前者（买入交易）共同的本次网格策略收益。
收益具体计算公式为：一次完整网格策略中的收益 = 卖出金额（卖出交易） - 买入金额（买入交易） + 剩余股数（买入股数-卖出的股数） * 价格（卖出交易中的实际交易价格）
"totalProfit"(总收益)：所有"Profit"的总和。

"ProfitRate"（收益率）：在JSON文件中，查找"交易记录"中的数据，根据其出现的各组数据，按顺序两两匹配，后者（卖出交易）数据中的收益率即为和前者（买入交易）共同的本次网格策略收益率。
收益率具体计算公式为：一次完整网格策略中的收益率 = 一次完整网格策略中的收益/吗，买入金额（买入交易）
"overallProfitRate"（总收益率）：所有的"totalProfit"/所有的买入金额（买入交易）

"level"（当前档位）：用上文中提到的净值表`latest_netvalues.json`中匹配对应基基金，取其最新净值数据。再用该净值数据，对比该网格策略表格中的各档位的"买入价"和"卖出价"（由"网格策略表格"功能通过计算生成），如该净值数据正好处于某档位的"买入价"和"卖出价"区间内，则此档位为当前档位，此档位的"买入价"为当前档位买入价。
可能出现某净值数据处于多个档位的"买入价"和"卖出价"区间内，这是因为小/中/大网的策略差异，在其标注上小/中/大网标识和档位、买入价即可。即可能存在多个小/中/大网同时运行的情况。

"BuyPrice"（买入价）：各档位"level"的买入价。

"netValueChangeRate"（净值对比买入价变化）：取对应网格策略基金的最新净值"latestNetValue"（通过净值表`latest_netvalues.json`），再取该网格策略基金的当前档位买入价，（最新净值-当前档位买入价）/当前档位买入价即净值对比买入价变化值。


**前端展示所需数据结构 (由JS从源JSON转换生成)**：

- **网格策略总体信息数据结构 (用于 `grid.html` 顶部概览)**:
  ```json
  {
    "totalExecutionCount": "number", // 计算: 总卖出次数
    "totalBuyAmount": "number",      // 计算: 总买入金额
    "totalSellAmount": "number",     // 计算: 总卖出金额
    "totalBuyShares": "number",      // 计算: 总买入股数
    "totalSellShares": "number",     // 计算: 总卖出股数
    "totalRemainingShares": "number",// 计算: 总剩余股数
    "totalProfit": "number",         // 计算: 总已实现收益
    "overallProfitRate": "string"    // 计算: 整体收益率
  }
  ```

- **网格策略卡片数据结构 (用于 `grid.html` 卡片列表)**：
  ```json
  {
    "etfName": "string",             // 提取
    "etfCode": "string",             // 提取
    "category": "string",            // 提取
    "basePrice": "number",           // **新增**: 计算: 基准价
    "isRunning": "boolean",          // 提取/计算
    "executionCount": "number",      // 计算: 单策略卖出次数
    "cumulativeYieldRate": "string", // 计算: 单策略累计收益率
    "currentLevelBuyPrice": "string",// 计算: 当前档位/买入价 
    "stepSize": "string",            // 提取/计算: "5/15/30"
    "latestNetValue": "number",      // 提取/计算
    "netValueChangeRate": "string",  // 计算: (最新净值 - 当前档位买入价) / 当前档位买入价 
    "headerColor": "string",         // 计算: 'red'/'green'
    "sourceFile": "string"           // 或 etfCode, 用于导航
  }
  ```

- **网格策略详细信息数据结构 (用于 `grid-detail.html` 页面)**：
  ```json
  {
    // --- Top Info Bar Data (大多同卡片) ---
    "etfName": "string",
    "etfCode": "string",
    "category": "string",
    "executionCount": "number",
    "cumulativeYieldRate": "string",
    "currentLevelBuyPrice": "string",
    "stepSize": "string",
    "latestNetValue": "number",
    "netValueChangeRate": "string",

    // --- Trend Chart Data ---
    "trendData": {
      "labels": ["string"],           // 转换: 日期轴
      "prices": ["number"],           // 转换: 价格序列
      "buyPoints": [{"x": "string", "y": "number", ...}], // 转换: 买点
      "sellPoints": [{"x": "string", "y": "number", ...}], // 转换: 卖点
      "currentBuyLevelLine": "number",// 计算: 当前档位买入价水平线
      "pairedTrades": [ ... ]        // 计算: 用于图表悬停交互的买卖配对信息
    },

    // --- Trade Details Table Data ---
    "tradeDetailsTable": {
       "records": [                   // 转换: 交易记录格式化
         {
           "id": "number", "date": "string", "type": "string", // 买/卖
           "amount": "number", "price": "number", "shares": "number",
           "profit": "number", "profitRate": "string"
         }
         // ...
       ],
       "cumulativeProfit": "number",   // 计算: 表尾累计收益
       "cumulativeProfitRate": "string"// 计算: 表尾累计收益率
    },

    // --- Grid Strategy Details (对应 PRD 3.3.2) ---
    "gridStrategyDetails": {
        // (A) 网格策略参数区
        "parameters": {              // 提取/计算: 从源数据或配置获取
      "targetType": "string", // 标的类型，默认为中国场内基金
      "minQuoteUnit": "number", // 最小报价单位，默认为0.001
      "minTradeUnit": "number", // 最小交易单位 ，默认为100股
      "basePrice": "number",    // 基准价，默认为1.000，为第一份买入价
      "amountPerUnit": "number", // 每份金额，默认为10000，第一份买入金额不同档位的买入金额会乘一个系数
      "minPrice": "number",     // 最低价，默认为0.500，低于此价不会再买入
      "smallGridStep": "number", // 小网步长，跌多少个百分点触发下一个档位，根据网格策略实际情况计算得出
      "mediumGridStep": "number",// 中网步长，默认为15%
      "largeGridStep": "number", // 大网步长，默认为30%
      "levelBoostFactor": "number",// 档位加码系数，默认为1.0，逐级增加档位间距。如: 0:不增加档位间距
      "amountBoostFactor": "number",// 金额加码系数，默认为1.0，逐级增加买入金额。如: 0:按照设定好的每份金额买入。公式：每份金额 + 每份金额 * 系数 * (1 - 当前档位)。比如：每份金额是10000，系数是1，当前档位是0.9，则买入金额是10000 + 10000 * 1 * (1 - 0.9) = 10100
      "profitRetentionFactor": "number" // 保留利润系数，默认为1.0，卖出时，是否保留利润。如: 0:不保留利润，0.5:保留一半利润，1:保留全部利润，2:保留两倍利润
  },
        // (B) 网格档位详情表
        "gridLevelsTable": {
            "levels": [               // 计算/转换: 基于 网格交易数据 和 交易记录
              {
                "gridType": "string",     // 网格种类
                "level": "string",        // 档位
                "buyTriggerPrice": "string",// 买入触发价
                "buyPrice": "string",     // 买入价
                "plannedBuyAmount": "string", // 计划买入金额
                "plannedBuyShares": "string", // 计划买入股数
                "currentHoldingShares": "number",// **计算**: 当前持仓股数
                "sellTriggerPrice": "string",// 卖出触发价
                "sellPrice": "string",    // 卖出价
                "plannedSellShares": "string",// 计划卖出股数
                "plannedSellAmount": "string",// 计划卖出金额
                "status": "string",       // **计算**: 档位状态 (未触发, 已买入...)
                "levelProfit": "number",    // **计算**: 该档位累计贡献收益
                "levelProfitRate": "string" // **计算**: 该档位累计贡献收益率
              }
              // ...
            ],
            // 表尾合计
            "footer": {                 // **计算**: 基于 levels 数据和交易记录
                "totalPlannedAmount": "number", // 累计计划投入金额?
                "totalActualBuyAmount": "number", // 累计实际买入金额
                "totalSellAmount": "number",    // 累计卖出金额
                "currentHoldingValue": "number", // 累计剩余持仓市值 (需最新净值)
                "totalRealizedProfit": "number",// 累计已实现收益
                "overallHoldingProfitRate": "string" // 整体持仓收益率 (计算复杂)
            }
        }
    }
  }
  ```
*开发者注：`gridStrategyDetails` 部分需要大量计算逻辑，特别是 `currentHoldingShares`, `status`, `levelProfit`, `levelProfitRate` 以及 `footer` 中的各项合计。参数来源 (`parameters`) 和实时数据 (`latestNetValue`) 仍是关键依赖。*

---
*（文档结束）* 
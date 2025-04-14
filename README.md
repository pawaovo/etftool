<<<<<<< HEAD
# ETF投资工具 - MoshiCoCo

这是一个ETF投资数据分析和展示工具，用于跟踪和可视化150计划和S计划的投资组合表现。

## 项目概述

本项目是一个前端网页应用，主要提供以下功能：
- 展示"150计划"和"S计划"的ETF基金持仓信息
- 按资产类别分组显示基金数据
- 提供资产占比趋势图表
- 支持按份数或收益率排序查看数据
- 实时显示基金预估净值和价格差异

## 项目结构

- `150plan.html` - 150计划主页面，展示ETF基金卡片
- `asset-distribution-chart.js` - 资产分布图表逻辑
- `plan-data.js` - **核心逻辑文件**，包含所有页面交互和数据处理功能
- `plan-data.css` - 主要样式文件
- `process-data.js` - **数据预处理脚本** (Node.js)
- `processed-data.js` - **预处理数据文件** (由`process-data.js`生成)
- `etf.json` - ETF基金原始数据
- `adjust.json` - 投资调整记录
- `dateUtils.js` - 日期处理工具函数
- `package.json` - 项目配置文件，包含依赖和脚本
- `README.md` - 本文档
- `deploy-guide.md` - Vercel部署指南
- `docs/` - 包含更详细文档的目录
- `styles/` - 通用样式目录 (可能包含 `styles.css`)
- `scripts/` - 辅助脚本目录 (可能包含 `getLowestNav.js` 等)

## 开发指南

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd <repository-directory>

# 安装Node.js依赖 (如果需要运行脚本或进行开发)
# 确保已安装 Node.js (>=18.0.0)
# 本项目目前无外部npm依赖，但保留package.json用于脚本执行
```

### 本地开发

1.  **生成预处理数据** (首次运行或更新数据后必须执行):
    ```bash
    node process-data.js
    ```
    此命令会读取 `etf.json` 和 `adjust.json`，生成 `processed-data.js` 文件。

2.  **启动本地服务器**:
    有多种方式启动本地服务器以查看页面：
    *   **使用 Python (推荐)**:
        ```bash
        python -m http.server 8080
        ```
        (需要安装 Python)
    *   **使用 npm**:
        ```bash
        npm start
        ```
        (此命令在 `package.json` 中定义，同样执行 `python -m http.server 8080`)
    *   **使用 Node.js (serve)**: 如果安装了 `serve` 包 (`npm install -g serve`)
        ```bash
        serve . -l 8080
        ```
    *   **使用 `start-server.bat` (Windows)**: 双击运行 `start-server.bat` 脚本。
    *   **使用 `serve.js` (Node.js)**:
        ```bash
        node serve.js
        ```

3.  **访问页面**:
    打开浏览器访问 `http://localhost:8080/150plan.html` (或其他HTML文件)。

### 数据更新流程

1.  手动更新原始数据文件 `etf.json` 和/或 `adjust.json`。
2.  **必须** 重新运行数据预处理脚本：
    ```bash
    node process-data.js
    ```
3.  刷新浏览器页面 (`http://localhost:8080/150plan.html`) 查看更新后的数据。

## 部署到Vercel

项目已配置好 `package.json`，可以方便地部署到 Vercel。

1.  将项目代码推送到 GitHub 仓库。
2.  在 Vercel 中导入该 GitHub 仓库。
3.  配置项目:
    *   框架预设 (Framework Preset): 选择 "Other"
    *   构建命令 (Build Command): `npm run build` 或 `node process-data.js`
    *   输出目录 (Output Directory): 留空 (或设置为 `.`)
    *   安装命令 (Install Command): 可以留空，因为没有外部依赖，但如果未来有，应为 `npm install`
4.  点击 "Deploy"。Vercel 会自动运行构建命令来生成 `processed-data.js`。
5.  部署完成后即可通过 Vercel 提供的链接访问。

**自动部署**: 当你将更新（包括修改后的 `etf.json` 或 `adjust.json`）推送到 GitHub 仓库的主分支时，Vercel 会自动触发新的构建和部署。

## 实现原理

1.  数据预处理脚本 `process-data.js` 读取 `etf.json` 和 `adjust.json`。
2.  脚本进行数据计算、整合，并生成包含所有前端所需数据的 `processed-data.js` 文件。
3.  前端页面 (`150plan.html` 等) 引入 `processed-data.js` 和主要的交互脚本 `plan-data.js`。
4.  `plan-data.js` 检测到 `processedData` 对象存在，直接使用预处理数据来渲染页面，提高了加载性能并确保了数据一致性。

## 文件结构 (详细)

```
etftool/
├── 150plan.html              # 150计划主页面
├── 150plan-simple.html       # 简化版150计划页面 (可能)
├── 150plan-local.html        # 本地版本页面 (可能)
├── asset-ratio.html          # 资产比例页面 (可能)
├── grid-test.html            # Grid布局测试页面 (可能)
├── temp.html                 # 临时HTML文件 (可能)
├── page-template.html        # 页面模板 (可能)
├── splan.html                # S计划页面 (可能)
│
├── asset-distribution-chart.js # 资产分布图表JS
├── plan-data.js              # 核心交互逻辑JS
├── processed-data.js         # 预处理后的数据JS (自动生成)
├── dateUtils.js              # 日期工具JS
├── script.js                 # 通用或首页脚本JS (可能)
├── serve.js                  # Node.js本地服务器脚本
├── local-version-creator.js  # 本地版本创建脚本 (可能)
├── data-convert.js           # 数据转换脚本 (可能)
├── temp-chart.js             # 临时图表JS (可能)
│
├── plan-data.css             # 核心页面样式CSS
├── styles.css                # 通用样式CSS
│
├── etf.json                  # ETF原始数据
├── adjust.json               # 调整记录数据
├── class-distribution.json   # 类别分布数据 (可能)
├── test.json                 # 测试数据 (可能)
│
├── process-data.js           # 数据预处理脚本 (Node.js)
├── getLowestNav.js           # 获取最低净值脚本 (可能在 scripts/ 下)
│
├── package.json              # 项目配置与脚本
├── package-lock.json         # 依赖锁定文件
├── README.md                 # 本文档
├── deploy-guide.md           # Vercel部署指南
│
├── create-local-version.bat  # 创建本地版本批处理 (Windows)
├── run-local.bat             # 运行本地版本批处理 (Windows)
├── start-server.bat          # 启动服务器批处理 (Windows)
│
├── docs/                     # 详细文档目录
│   ├── project-structure.md
│   ├── etftool-updates.md
│   ├── asset-ranking-update.md
│   └── etf-display-requirements.md
│
├── .git/                     # Git版本控制目录
├── .cursor/                  # Cursor IDE配置目录 (可能)
├── backups/                  # 备份目录 (内容未知)
├── node_modules/             # Node.js依赖安装目录 (通常不提交到Git)
└── api/                      # API相关目录 (内容未知)
└── data/                     # 数据目录 (内容未知)
└── scripts/                  # 脚本目录 (内容未知)
└── styles/                   # 样式目录 (内容未知)
```
*注意: 标记为 "(可能)" 的文件/目录是根据文件列表推断，具体用途需进一步确认。*

## 功能说明

### 首页 (index.html)
- 提供网站功能导航
- 通过卡片界面引导用户至不同功能区域
- 点击卡片或按钮跳转至对应页面

### 计划数据页面 (150plan.html 和 splan.html)
1. **计划选择器**：
   - 切换查看"150计划"和"S计划"的数据

2. **资产排行**：
   - 展示不同资产类别的持仓情况
   - 可按份数或收益率排序
   - 点击资产类别可查看详细基金信息

3. **资产详情**：
   - 显示基金基本信息和持仓数据
   - 直观展示预估净值和价格差异
   - 基于价格差异的正负值显示不同颜色标识

4. **趋势图表**：
   - 显示资产占比趋势变化
   - 提供饼图展示当前资产分布比例

## 样式设计

- 使用响应式布局，适配不同设备屏幕
- 采用现代化卡片设计，提升用户体验
- 颜色编码系统：
  - 正值（增长）显示绿色
  - 负值（下跌）显示红色
  - 不同资产类别使用不同图标和颜色标识

## 如何使用

1.  确保已按照 **开发指南** 中的步骤生成了最新的 `processed-data.js`。
2.  使用本地服务器启动项目。
3.  在浏览器中打开 `150plan.html` (或其他主要页面)。
4.  在计划数据页面，可以：
   - 切换查看不同计划的数据
   - 选择按份数或收益率排序
   - 点击资产类别查看详细基金信息
   - 查看资产占比趋势图表

## 技术实现

- 纯前端实现，使用HTML5、CSS3和JavaScript
- 使用CSS Grid和Flexbox进行布局
- 采用模块化设计，便于维护和扩展
- 使用Google Noto Sans SC字体，优化中文显示

## 未来计划

- 集成实时数据API，自动更新基金信息
- 添加用户账户系统，支持个性化设置
- 开发更多数据可视化图表和分析工具
- 增加历史数据比较功能

## 贡献指南

如需贡献代码，请遵循以下步骤：
1. Fork本仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个Pull Request

## 许可证

版权所有 © 2023 MoshiCoCo 

## 功能特点

- 展示"150计划"和"S计划"的ETF基金持仓信息
- 显示大类资产的占比和收益率
- 展示每个ETF基金的详细信息，包括最后操作时间、持仓份额、累计收益率、平均持有价格、历史最低价格等
- 同一大类资产下的ETF卡片按照最后操作时间排序，最近操作的卡片显示在最前面
- 已清仓基金卡片也显示最后操作信息，保持与持仓中基金卡片一致的体验
- 支持在线和离线环境下工作

## 数据预处理

本工具实现了数据预处理功能，可以将ETF数据和调整数据合并处理，生成一个包含所有需要信息的预处理数据文件。

### 预处理流程

1. 从`etf.json`和`adjust.json`读取原始数据
2. 提取和计算各种指标，如大类资产占比、最后操作时间、历史最低价格等
3. 生成`processed-data.js`文件，包含预处理后的数据

### 交易类型判断逻辑

在预处理过程中，ETF基金的最后操作类型（买入/卖出）是通过以下逻辑判断的：

1. 在`adjust.json`中通过基金代码查找匹配的记录
2. 记录该基金在调整记录的`orders`数组中的位置索引
3. 将对应记录的`comment`字段按逗号（`，`）分割成多个操作描述
4. 基于基金在`orders`中的位置，匹配`comment`中对应位置的操作描述
5. 根据该操作描述是否包含"买入"或"卖出"来确定交易类型

## 使用方法

### 预处理数据

1. 运行`node process-data.js`生成预处理数据文件
2. 生成的`processed-data.js`文件会被自动保存到项目根目录

### 查看ETF信息

可以通过以下两种方式查看ETF信息：

1. **使用HTTP服务器（推荐）**：
   ```
   python -m http.server 8080
   ```
   然后访问 http://localhost:8080/150plan.html

2. **直接打开HTML文件**：
   双击打开`150plan.html`文件
   
   注意：直接打开HTML文件时，必须先运行`node process-data.js`生成预处理数据文件，否则某些功能可能无法正常工作。

## 技术说明

- 通过预处理数据解决了离线环境下无法加载JSON文件的问题
- 实现了在本地文件系统中打开HTML文件时也能正确显示ETF卡片信息
- 正确解析`comment`字段，准确判断ETF基金的最后操作类型

## 更新日志

### 2025-04-12
- 新增已清仓基金的最后操作信息显示功能
- 优化清仓基金的卡片展示
- 改进卡片排序算法 (活跃优先，按最后操作时间排序)
- 已清仓基金卡片的操作类型固定显示为"卖出"

### 2025-04-11
- 新增同一大类资产下ETF卡片按照最后操作时间排序功能
- 优化数据加载流程
- 改进卡片排序算法 (活跃在前)

### 2025-04-10
- 修复交易类型判断逻辑 (解析`comment`字段)
- 优化离线环境数据加载 (通过预处理)
- 增加数据预处理功能 (`process-data.js` 和 `processed-data.js`)

## 技术说明

- 通过预处理数据解决了离线环境下无法加载JSON文件的问题
- 实现了在本地文件系统中打开HTML文件时也能正确显示ETF卡片信息
- 正确解析`comment`字段，准确判断ETF基金的最后操作类型

## 更新日志

### 2025-04-12
- 新增已清仓基金的最后操作信息显示功能
- 优化清仓基金的卡片展示
- 改进卡片排序算法 (活跃优先，按最后操作时间排序)
- 已清仓基金卡片的操作类型固定显示为"卖出"

### 2025-04-11
- 新增同一大类资产下ETF卡片按照最后操作时间排序功能
- 优化数据加载流程
- 改进卡片排序算法 (活跃在前)

### 2025-04-10
- 修复交易类型判断逻辑 (解析`comment`字段)
- 优化离线环境数据加载 (通过预处理)
- 增加数据预处理功能 (`process-data.js` 和 `processed-data.js`)

```
*注意: 更新日志基于 README.md 的现有内容，可能需要与实际提交历史核对。* 
=======
# etftool
>>>>>>> 9192f26ce41b51282f125a0d7b0ec1f5ff8c5374

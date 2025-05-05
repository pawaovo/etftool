# ETF基金数据工具

这是一个自动获取和展示ETF基金净值数据的工具，主要提供两种数据获取方案：

1. **Python桥接方案**：通过Python脚本获取数据，再由Node.js处理结果（适用于本地开发环境）
2. **GitHub Actions自动更新**：通过GitHub Actions定时运行Python脚本更新数据（适用于生产环境）

## 功能特点

- 自动获取多只ETF基金的最新净值数据
- 通过GitHub Actions定时执行更新
- 数据存储在JSON文件中，方便前端调用
- 可部署在Vercel等静态托管服务上

## 技术架构

### 方案一：Python桥接方案（本地开发）

- **Python脚本** (`fetch_fund_data.py`): 通过API获取ETF基金数据
- **桥接脚本** (`scripts/python-api-bridge.js`): 调用Python脚本并处理结果
- **数据流向**: Python获取数据 → Node.js处理结果 → 保存到JSON文件

### 方案二：GitHub Actions自动更新（推荐生产方案）

- **Python脚本** (`.github/workflows/fetch_fund_data.py`): 获取ETF基金数据
- **GitHub Actions配置** (`.github/workflows/update_etf_data.yml`): 定时运行Python脚本
- **数据流向**: GitHub Actions运行Python → 更新数据 → 自动提交到仓库 → Vercel部署获取最新数据

### 数据存储

- 最新净值数据: `public/data/grid/latest_netvalues.json`
- 历史数据: `public/data/grid/{基金代码}.json`

### 部署方式

- Vercel自动部署
- 配置文件: `vercel.json`

## 使用方法

### 方案一：本地开发（Python桥接）

1. 确保安装了Python环境和Node.js环境
2. 安装Python依赖: `pip install requests`
3. 安装Node.js依赖: `npm install`
4. 运行桥接脚本: `node scripts/python-api-bridge.js`

### 方案二：GitHub Actions自动更新（推荐）

数据更新由GitHub Actions自动执行，每天北京时间17:00（UTC 09:00）自动运行。

您也可以手动触发更新:
1. 打开GitHub仓库的Actions标签
2. 选择"更新ETF基金净值数据"工作流
3. 点击"Run workflow"按钮

### 自定义ETF基金列表

如需修改监控的ETF基金列表，请编辑以下文件中的`FUND_CODES`数组：
- 本地开发: `fetch_fund_data.py`
- GitHub Actions: `.github/workflows/fetch_fund_data.py`

## 故障排除

### Node.js连接问题(ECONNRESET)

项目最初尝试使用Node.js直接获取数据，但遇到连接问题(ECONNRESET)。经测试发现Python请求库可以成功获取API数据，因此采用了Python脚本方案。

### 数据获取失败

如果数据获取失败:
1. 检查GitHub Actions运行日志（生产环境）
2. 检查Python脚本输出（本地环境）
3. 验证API连接状态
4. 确认Python请求库是否正确安装

## 许可证

MIT 
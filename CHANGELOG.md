# 更新日志

## [2.0.0] - YYYY-MM-DD (稳定版)

### ✨ 新特性与主要功能

- **ETF投资组合管理**: 本工具主要用于处理和展示ETF（交易型开放式指数基金）投资计划数据，支持多种投资策略，例如E大的150计划、S计划以及网格策略。
- **数据处理与展示**: 
    - 自动处理原始ETF数据 (`etf.json`) 和操作调整数据 (`adjust.json`)。
    - 生成统一的预处理数据文件 (`processed-data.js`) 供前端页面使用。
    - 在不同的HTML页面 (`150plan.html`, `splan.html`, `gridplan.html`) 上清晰展示各类计划的ETF数据、资产分布、持仓详情等。
- **自动化与脚本支持**:
    - 提供了数据处理脚本 (`scripts/process-data.js`) 和文件复制脚本 (`scripts/copy-to-dist.js`)。
    - 支持本地开发服务器 (`scripts/serve.js`)。
    - 包含Python脚本 (`fetch_fund_data.py`) 用于获取基金数据，并有Node.js桥接脚本 (`scripts/python-api-bridge.js`)。
    - 支持通过GitHub Actions自动更新基金净值数据。
- **部署友好**: 项目构建后生成的 `dist` 目录可以方便地部署到任何静态文件服务器，并提供了Vercel部署的相关指南和配置。

### 📝 文档

- 主要文档包括 `README.md`, `README-ETF-TOOL.md`, `VERCEL-DEPLOY-GUIDE.md`, `deploy-guide.md` 以及 `docs/` 目录下的详细更新和说明文档。
- 本次更新将项目标记为稳定的2.0版本。

### 🚀 构建与依赖

- 使用 `npm` 进行依赖管理和脚本执行。
- `package.json` 中定义了项目的基本信息、脚本命令和依赖项。

---
*请将 YYYY-MM-DD 替换为今天的日期。* 
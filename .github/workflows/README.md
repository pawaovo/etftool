# ETF基金数据自动更新系统

本目录包含通过GitHub Actions自动获取ETF基金最新净值数据的配置和脚本。

## 功能说明

- 自动每天定时获取指定ETF基金的最新净值数据
- 将数据保存到`public/data/grid/latest_netvalues.json`
- 自动提交并推送更新到GitHub仓库
- 当Vercel部署时，将自动使用最新数据

## 文件说明

- `update_etf_data.yml`: GitHub Actions工作流配置文件
- `fetch_fund_data.py`: 获取ETF基金数据的Python脚本

## 运行时间

工作流默认设置为每天北京时间17:00（UTC 09:00）自动运行，以确保获取当天的最新数据。

## 手动触发

您也可以在GitHub仓库的Actions标签页中手动触发此工作流：

1. 打开仓库的Actions标签页
2. 选择"更新ETF基金净值数据"工作流
3. 点击"Run workflow"按钮

## 修改基金列表

如需修改监控的ETF基金列表，请编辑`fetch_fund_data.py`文件中的`FUND_CODES`数组。

## 故障排除

如果工作流运行失败：

1. 检查Actions运行日志以获取详细错误信息
2. 确认API连接是否正常
3. 检查是否有足够的GitHub Actions免费额度（每月2000分钟）

## 提示

- 此自动化依赖外部API，如API发生变更可能需要更新脚本
- 为避免API请求过于频繁，脚本中设置了请求间隔
- 工作流会检查获取成功率，如果成功率过低会发出警告 
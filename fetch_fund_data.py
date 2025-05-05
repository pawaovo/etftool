
#!/usr/bin/env python3
import requests
import json
import sys
import time
from datetime import datetime

# 基金代码列表
FUND_CODES = [
    '159920', '159938', '512880', '512980', '513050',
    '513180', '513500', '513520', '515180'
]

# 如果提供了命令行参数，则使用命令行参数作为基金代码
if len(sys.argv) > 1:
    fund_codes = [sys.argv[1]]
else:
    fund_codes = FUND_CODES

# 获取当前日期
def get_current_date():
    return datetime.now().strftime("%Y-%m-%d")

# 初始化结果对象
result = {
    "lastUpdated": get_current_date()
}

# 获取每个基金的数据
for fund_code in fund_codes:
    print(f"正在获取基金 {fund_code} 的数据...", file=sys.stderr)
    api_url = f'https://tiantian-fund-api.vercel.app/api/action?action_name=fundSearch&m=1&key={fund_code}'
    
    try:
        # 发送GET请求
        response = requests.get(api_url, timeout=10)
        # 检查响应状态码
        response.raise_for_status()
        # 解析响应内容
        data = response.json()
        
        # 提取净值信息
        if data and data.get('ErrCode') == 0 and data.get('Datas') and len(data['Datas']) > 0:
            fund_data = data['Datas'][0]
            if fund_data.get('FundBaseInfo') and fund_data['FundBaseInfo'].get('DWJZ'):
                net_value = float(fund_data['FundBaseInfo']['DWJZ'])
                result[fund_code] = {"netValue": net_value}
                print(f"基金 {fund_code} 的净值为: {net_value}", file=sys.stderr)
            else:
                print(f"无法从返回数据中找到基金 {fund_code} 的净值信息", file=sys.stderr)
        else:
            print(f"API返回错误或无数据，基金代码: {fund_code}", file=sys.stderr)
            
    except requests.exceptions.RequestException as e:
        print(f"获取基金 {fund_code} 数据时出错: {e}", file=sys.stderr)
    
    # 添加延迟，避免请求过于频繁
    if fund_code != fund_codes[-1]:
        time.sleep(1)

# 输出JSON结果
print(json.dumps(result, ensure_ascii=False, indent=2)) 
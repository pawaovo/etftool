#!/usr/bin/env python3
import requests
import json
import os
import sys
import time
from datetime import datetime

# 基金代码列表
FUND_CODES = [
    '159920', '159938', '512880', '512980', '513050',
    '513180', '513500', '513520', '515180'
]

# 获取当前日期
def get_current_date():
    return datetime.now().strftime("%Y-%m-%d")

# 初始化结果对象
result = {
    "lastUpdated": get_current_date()
}

# 获取每个基金的数据
success_count = 0
for fund_code in FUND_CODES:
    print(f"正在获取基金 {fund_code} 的数据...")
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
                print(f"基金 {fund_code} 的净值为: {net_value}")
                success_count += 1
            else:
                print(f"无法从返回数据中找到基金 {fund_code} 的净值信息")
        else:
            print(f"API返回错误或无数据，基金代码: {fund_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"获取基金 {fund_code} 数据时出错: {e}")
    
    # 添加延迟，避免请求过于频繁
    if fund_code != FUND_CODES[-1]:
        time.sleep(1)

# 检查是否获取到足够的数据
if success_count < len(FUND_CODES) / 2:
    print(f"警告: 只获取到 {success_count}/{len(FUND_CODES)} 个基金的数据，可能存在问题")
    if success_count == 0:
        print("未获取到任何数据，退出程序")
        sys.exit(1)

# 确定输出路径
output_path = os.path.join(os.environ.get('GITHUB_WORKSPACE', '.'), 'public', 'data', 'grid', 'latest_netvalues.json')
output_dir = os.path.dirname(output_path)

# 确保目录存在
os.makedirs(output_dir, exist_ok=True)

# 输出JSON结果
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"成功将净值数据保存到: {output_path}")
print(f"共获取了 {success_count}/{len(FUND_CODES)} 个基金的数据") 
#!/usr/bin/env python3
import requests
import json
import sys
import time
from datetime import datetime
import os
import shutil

# 基金代码列表
FUND_CODES = [
    '159920', '159938', '512880', '512980', '513050',
    '513180', '513500', '513520', '515180'
]

# 定义文件路径 (相对于项目根目录)
OUTPUT_FILE_PATH = "public/data/grid/latest_netvalues.json"
BACKUP_FILE_PATH = "public/data/grid/latest_netvalues.json.backup"

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

# 处理文件操作
# 确保目标目录存在
output_dir = os.path.dirname(OUTPUT_FILE_PATH)
if output_dir and not os.path.exists(output_dir):
    os.makedirs(output_dir)
    print(f"创建目录: {output_dir}", file=sys.stderr)

# 备份现有文件 (新的追加逻辑)
if os.path.exists(OUTPUT_FILE_PATH):
    try:
        with open(OUTPUT_FILE_PATH, 'r', encoding='utf-8') as f_current_live:
            current_live_data = json.load(f_current_live)

        backup_history = []
        if os.path.exists(BACKUP_FILE_PATH):
            try:
                with open(BACKUP_FILE_PATH, 'r', encoding='utf-8') as f_backup_read:
                    # Handle empty file case
                    content_to_load = f_backup_read.read()
                    if content_to_load.strip(): # Check if file is not just whitespace
                        backup_history = json.loads(content_to_load)
                    else:
                        backup_history = [] # Treat empty file as an empty list
                
                if not isinstance(backup_history, list):
                    print(f"警告: 备份文件 {BACKUP_FILE_PATH} 的内容不是预期的列表格式。将创建一个新的备份历史。", file=sys.stderr)
                    # Optionally, you could try to wrap the old object in a list:
                    # backup_history = [backup_history] 
                    # For now, let's start fresh if format is unexpected to ensure integrity.
                    backup_history = [] 
            except json.JSONDecodeError:
                print(f"警告: 备份文件 {BACKUP_FILE_PATH} 内容不是有效的JSON。将创建一个新的备份历史。", file=sys.stderr)
                backup_history = []
            except Exception as e:
                print(f"读取备份文件 {BACKUP_FILE_PATH} 时出错: {e}。将创建一个新的备份历史。", file=sys.stderr)
                backup_history = []
        
        backup_history.append(current_live_data)

        with open(BACKUP_FILE_PATH, 'w', encoding='utf-8') as f_backup_write:
            json.dump(backup_history, f_backup_write, ensure_ascii=False, indent=2)
        print(f"已将先前的数据追加到备份文件: {BACKUP_FILE_PATH}", file=sys.stderr)

    except FileNotFoundError:
        # This case should ideally not happen if os.path.exists(OUTPUT_FILE_PATH) is true,
        # but good to have for robustness.
        print(f"信息: 原始数据文件 {OUTPUT_FILE_PATH} 未找到，跳过备份。", file=sys.stderr)
    except json.JSONDecodeError:
        print(f"警告: 原始数据文件 {OUTPUT_FILE_PATH} 内容不是有效的JSON，跳过备份。", file=sys.stderr)
    except Exception as e:
        print(f"备份文件时出错: {e}", file=sys.stderr)
else:
    print(f"信息: 原始数据文件 {OUTPUT_FILE_PATH} 未找到，首次运行无需备份。", file=sys.stderr)

# 输出JSON结果到文件
try:
    with open(OUTPUT_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"数据已成功保存到: {OUTPUT_FILE_PATH}", file=sys.stderr) # 打印到stderr，stdout留给可能的json输出
except Exception as e:
    print(f"保存数据到文件时出错: {e}", file=sys.stderr)

# 如果仍然需要将JSON打印到stdout，可以取消下面这行注释
# print(json.dumps(result, ensure_ascii=False, indent=2)) 
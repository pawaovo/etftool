import requests
import json
import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

# --- 配置数据源 ---
# 请根据您的项目结构调整 output_file 的路径
# 这些路径应该是相对于脚本在 GitHub Actions 中运行时项目根目录的路径
DATA_SOURCES = [
    {
        "name": "ETF Plan Data (etf.json)",
        "url": "https://qieman.com/pmdj/v2/long-win/plan?prodCode=LONG_WIN",
        "output_file": "./src/data/etf.json"
    },
    {
        "name": "Plan Adjustments (adjust.json)",
        "url": "https://qieman.com/pmdj/v2/long-win/plan/adjustments?desc=true&prodCode=LONG_WIN",
        "output_file": "./src/data/adjust.json"
    },
    {
        "name": "Class Distribution (class-distribution.json)",
        "url": "https://qieman.com/pmdj/v2/long-win/plan/clz-distribution",
        "output_file": "./src/data/class-distribution.json"
    }
]

# --- Selenium 和 x-sign 获取逻辑 ---
def updateXsign(chromedriver_path=None):
    print("开始获取 x-sign...")
    url = 'https://qieman.com/longwin/compositions/LONG_WIN'
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox') # 在GitHub Actions等CI环境中通常需要
    chrome_options.add_argument('--disable-dev-shm-usage') # 解决资源限制问题
    chrome_options.add_argument('--disable-gpu') # 无需GPU
    chrome_options.add_argument('--window-size=1920x1080') # 设置窗口大小
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36") # 指定User-Agent
    chrome_options.set_capability("goog:loggingPrefs", {"performance": "ALL"})

    if chromedriver_path:
        service = Service(chromedriver_path)
        browser = webdriver.Chrome(service=service, options=chrome_options)
    else:
        # 如果未提供路径，则期望 chromedriver 在系统 PATH 中
        # 或者在 GitHub Actions 中，通常由 setup-chrome action 配置好
        try:
            browser = webdriver.Chrome(options=chrome_options)
        except Exception as e:
            print(f"启动 Chrome 失败 (chromedriver是否在PATH中?): {e}")
            print("提示: 在 GitHub Actions 中，请确保使用了如 'setup-chrome' action 来准备 Chrome 和 chromedriver。")
            return None


    x_sign = None
    try:
        print(f"访问页面以获取 x-sign: {url}")
        browser.get(url)
        WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.TAG_NAME, 'body')))
        time.sleep(3) # 额外等待，可根据实际情况调整

        logs = browser.get_log('performance')
        print(f"获取到 {len(logs)} 条性能日志。")

        for log_entry_wrapper in logs:
            try:
                log_entry = json.loads(log_entry_wrapper['message'])
                message = log_entry['message']
                if 'Network.requestWillBeSent' in message.get('method', ''):
                    if 'params' in message and 'request' in message['params']:
                        headers = message['params']['request'].get('headers', {})
                        if 'x-sign' in headers:
                            x_sign = headers['x-sign']
                            print(f"成功提取到 x-sign: {x_sign}")
                            break
            except KeyError as e:
                # print(f"解析日志时缺少键 {e} (可忽略)") # 日志可能很多，选择性打印
                pass
            except Exception as e:
                print(f"解析日志时出现未知错误: {e}")
                pass # 避免单个日志条目解析失败导致整个过程终止

    except Exception as e:
        print(f"获取 x-sign 过程中出错: {e}")
    finally:
        if 'browser' in locals() and browser is not None:
            browser.quit()
        print("浏览器已关闭。")

    if not x_sign:
        print("未能获取到 x-sign。请检查网站结构或反爬策略是否已更改。")
    return x_sign

# --- 主逻辑 ---
def main():
    # 在 GitHub Actions 中，通常不需要指定 chromedriver_path，
    # 因为它会由如 `setup-chrome` action 提供或已在环境中。
    # 如果在本地运行，并且 chromedriver 不在 PATH 中，请提供其路径，例如:
    # chromedriver_executable_path = 'D:\python\chromedriver.exe'
    chromedriver_executable_path = os.getenv('CHROMEWEBDRIVER') # 尝试从环境变量获取 (setup-chrome action 可能会设置)
    
    print(f"尝试使用的 Chromedriver 路径: {chromedriver_executable_path if chromedriver_executable_path else '系统PATH'}")

    current_x_sign = updateXsign(chromedriver_path=chromedriver_executable_path)

    if not current_x_sign:
        print("由于未能获取 x-sign，无法继续获取数据。脚本终止。")
        return

    print(f"将使用 x-sign: {current_x_sign} 获取数据。")
    headers = {
        "x-sign": current_x_sign,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" # 和浏览器获取x-sign时用同样的UA
    }

    for source in DATA_SOURCES:
        print(f"\n--- 开始获取: {source['name']} ---")
        url = source['url']
        output_file = source['output_file']
        print(f"请求URL: {url}")

        try:
            response = requests.get(url, headers=headers, timeout=20)
            response.raise_for_status() # 如果状态码不是200，则抛出异常
            data = response.json()
            print(f"成功从API获取数据。")

            # 确保输出目录存在
            output_dir = os.path.dirname(output_file)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)
                print(f"创建目录: {output_dir}")

            # 保存数据到文件
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"数据已成功保存到: {output_file}")

        except requests.exceptions.HTTPError as http_err:
            print(f"HTTP错误: {http_err} - 响应内容: {response.text[:500] if response else 'N/A'}")
        except requests.exceptions.RequestException as req_err:
            print(f"请求错误: {req_err}")
        except json.JSONDecodeError:
            print(f"响应非JSON格式或JSON解析失败。响应内容前500字符: {response.text[:500]}")
        except Exception as e:
            print(f"处理 {source['name']} 时发生未知错误: {e}")
        
        if source != DATA_SOURCES[-1]: # 如果不是最后一个请求，则稍作等待
             print("等待1秒...")
             time.sleep(1)

    print("\n--- 所有数据获取任务完成 ---")

if __name__ == "__main__":
    main() 
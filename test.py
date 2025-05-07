import requests
import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By


# 更新 x-sign 的函数
def updateXsign():
    url = 'https://qieman.com/longwin/compositions/LONG_WIN'
    chrome_options = Options()
    chrome_options.add_argument('headless')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')  # 绕过反爬检测
    chrome_options.set_capability("goog:loggingPrefs", {"performance": "ALL"})  # 启用性能日志

    # 指定 ChromeDriver 路径（确保版本与 Chrome 浏览器完全匹配）
    service = Service('D:\python\chromedriver.exe')  # 替换为你的 chromedriver 路径
    browser = webdriver.Chrome(service=service, options=chrome_options)

    x_sign = None  # 初始化 x_sign 变量

    try:
        browser.get(url)
        # 等待页面完全加载（包括所有异步请求）
        WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.TAG_NAME, 'body')))
        time.sleep(2)  # 额外等待异步请求（根据页面加载速度调整）

        # 获取所有性能日志（包含网络请求信息）
        logs = browser.get_log('performance')

        for log in logs:
            try:
                log_entry = json.loads(log['message'])
                message = log_entry['message']
                if 'Network.requestWillBeSent' in message['method']:  # 捕获请求发送前的事件
                    # 增加额外的检查，确保 'params' 和 'request' 存在
                    if 'params' in message and 'request' in message['params']:
                        headers = message['params']['request']['headers']
                        if 'x-sign' in headers:
                            x_sign = headers['x-sign']
                            break  # 找到后立即停止
            except KeyError as e:
                print(f"解析日志时出错，缺少键 {e}，日志内容：{log}")
            except Exception as e:
                print(f"解析日志时出现未知错误：{e}，日志内容：{log}")

    except Exception as e:
        print(f"获取 x-sign 时出错: {e}")
    finally:
        browser.quit()

    return x_sign


# 获取更新后的 x-sign
x_sign = updateXsign()

if x_sign:
    url = "https://qieman.com/pmdj/v2/long-win/plan?prodCode=LONG_WIN"
    headers = {
        "x-sign": x_sign,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    try:
        print("获取的数据：", response.json())
    except json.JSONDecodeError:
        print("响应非 JSON 格式，原始内容：", response.text)
else:
    print("未能获取 x-sign，请检查浏览器驱动版本或页面加载逻辑。")

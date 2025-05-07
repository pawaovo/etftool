# ETF数据处理工具 (Stable Version 2.0)

这是一个用于处理和展示ETF投资计划数据的工具，包括E大的150计划、S计划和网格策略数据。

## 项目结构

```
etftool/
├── src/                  # 源代码目录
│   ├── js/               # JavaScript源文件
│   ├── css/              # CSS样式文件
│   ├── data/             # 数据文件
│   │   └── fund/         # 基金数据文件
│   ├── assets/           # 资源文件（图片等）
│   ├── index.html        # 主页
│   ├── 150plan.html      # 150计划页面
│   ├── splan.html        # S计划页面
│   └── gridplan.html     # 网格策略页面
│
├── dist/                 # 构建输出目录
│
├── scripts/              # 构建和工具脚本
│   ├── process-data.js   # 数据处理脚本
│   ├── copy-to-dist.js   # 文件复制脚本
│   └── serve.js          # 本地开发服务器
│
├── docs/                 # 文档
│
├── package.json          # 项目配置
└── README.md             # 项目说明
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发流程

1. 修改`src`目录下的源文件
2. 运行以下命令处理数据并构建项目：

```bash
npm run build
```

3. 启动本地开发服务器预览：

```bash
npm run start
```

4. 或者直接运行开发模式（构建+启动服务器）：

```bash
npm run dev
```

### 构建流程

构建流程会执行以下步骤：

1. 清理`dist`目录
2. 处理ETF和调整数据，生成预处理数据文件
3. 将`src`目录下的文件复制到`dist`目录，并调整文件路径引用

## 页面说明

- **index.html**: 主页，提供各个计划的导航
- **150plan.html**: 显示150计划的ETF数据和资产分布
- **splan.html**: 显示S计划的ETF数据和资产分布
- **gridplan.html**: 显示网格策略的相关数据

## 数据文件

项目使用以下主要数据文件：

- **etf.json**: ETF基金基本数据
- **adjust.json**: 调整和操作数据
- **class-distribution.json**: 资产类别分布数据
- **fund-data.json**: 基金数据

## 部署

项目构建完成后，`dist`目录中的所有文件可以部署到任何静态文件服务器上。

```bash
# 构建项目
npm run build

# 部署dist目录到服务器
```

# Cursor自动化工具

这个工具包可以自动打开Cursor的开发者工具，并在控制台中执行`cursor_auto_resume.js`脚本。

## 功能介绍

此工具会自动执行以下操作：

1. 读取`cursor_auto_resume.js`文件内容
2. 复制到剪贴板
3. 模拟按下`Ctrl+Shift+I`打开开发者工具
4. 切换到控制台面板
5. 粘贴脚本内容并按回车执行

## 使用方法

提供了三种不同的运行方式，请选择一种适合您的方式：

### 方法1：使用批处理文件（推荐Windows用户）

1. 确保Cursor已经打开
2. 双击运行`cursor_automation.bat`
3. 按照提示操作

### 方法2：使用Python脚本

1. 确保已安装Python 3.x
2. 安装必要的库：`pip install pyautogui pyperclip`
3. 运行`python cursor_automation.py`
4. 按照提示操作

### 方法3：使用PowerShell脚本

1. 右键点击`cursor_automation_ps1.ps1`，选择"使用PowerShell运行"
2. 如果遇到执行策略限制，可以使用以下命令临时允许脚本运行：  
   `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
3. 按照提示操作

## 注意事项

- 运行工具前，请确保Cursor已经打开
- 在工具提示后，请立即点击Cursor窗口使其处于活动状态
- 如果脚本执行失败，可能需要手动调整时间延迟或重试
- 脚本执行过程中，请勿移动鼠标或使用键盘

## 故障排除

1. **无法打开开发者工具**：确认Cursor窗口处于活动状态，或手动按下`Ctrl+Shift+I`
   
2. **无法切换到控制台**：脚本尝试了多种方法切换到控制台，如果都失败，请在开发者工具打开后手动点击"Console"选项卡

3. **Python脚本错误**：确保已安装最新版本的`pyautogui`和`pyperclip`库

4. **PowerShell执行权限问题**：以管理员身份运行PowerShell，并执行`Set-ExecutionPolicy RemoteSigned`

# 特别注意（非常重要）

During project development, do NOT directly start implementing or modifying code based on the user's requirements in the conversation. You must carefully deliberate and first return the best solution after your analysis to the user. Only after obtaining the user's explicit consent should you begin making code modifications. (This rule is of utmost importance.)

Efficiency Guideline: Favor direct file edits via tools instead of command-line operations for modifications.(This rule is of utmost importance.)

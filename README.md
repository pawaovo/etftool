# ETF数据处理工具

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

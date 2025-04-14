# ETF投资工具部署指南

本文档提供了如何将ETF投资工具部署到Vercel的详细步骤，以及如何更新基金数据。

## 一、Vercel部署步骤

### 1. 准备工作

#### 1.1 GitHub账号准备
- 如果没有GitHub账号，请先在 [GitHub官网](https://github.com) 注册一个账号
- 登录GitHub账号

#### 1.2 创建代码仓库
1. 在GitHub上点击右上角的"+"图标，选择"New repository"
2. 填写仓库名称，如"etftool"
3. 可以选择添加README文件（勾选"Add a README file"）
4. 点击"Create repository"创建仓库

#### 1.3 上传代码到仓库
方法一：使用GitHub网页界面上传
1. 进入你创建的仓库
2. 点击"Add file" > "Upload files"
3. 拖拽或选择你的项目文件上传
4. 点击"Commit changes"确认上传

方法二：使用Git命令行（适合熟悉Git的用户）
```bash
# 克隆仓库到本地
git clone https://github.com/你的用户名/etftool.git

# 复制项目文件到仓库文件夹

# 添加所有文件到Git
git add .

# 提交更改
git commit -m "初始提交"

# 推送到GitHub
git push origin main
```

### 2. Vercel账号及部署

#### 2.1 创建Vercel账号
1. 访问 [Vercel官网](https://vercel.com)
2. 点击"Sign Up"
3. 选择"Continue with GitHub"，使用GitHub账号登录（推荐）

#### 2.2 导入项目
1. 登录Vercel后，点击"Add New..." > "Project"
2. 在列出的GitHub仓库中找到并选择你的"etftool"仓库
3. 点击"Import"按钮

#### 2.3 配置项目
在配置页面：
- 项目名称：使用默认名称或自定义
- 框架预设：选择"Other"
- 根目录：默认为"/"
- 构建命令：`npm run build` 或 `node process-data.js`
- 输出目录：留空 (或设置为 `.`) 
- 安装命令：可以留空 (如果未来有外部依赖，应为 `npm install`)

#### 2.4 部署项目
1. 点击"Deploy"按钮
2. Vercel 将运行构建命令 (`node process-data.js`) 来生成最新的 `processed-data.js` 文件。
3. 等待部署完成
4. 部署成功后，Vercel会显示一个预览链接，点击查看你的网站

#### 2.5 自定义域名（可选）
1. 在项目页面，点击"Settings" > "Domains"
2. 输入你的域名，点击"Add"
3. 按照Vercel提供的说明，在你的域名DNS设置中添加相应的记录
4. 等待DNS生效（可能需要几分钟到几小时）

## 二、数据更新方法

要更新网站上显示的ETF数据，你需要更新源数据文件并重新部署。

### 更新流程

1.  **修改源数据文件**:
    *   在你的本地项目副本中，编辑 `etf.json` 和/或 `adjust.json` 文件，更新所需的数据。

2.  **运行数据预处理脚本** (本地):
    *   打开终端或命令行，导航到项目目录。
    *   运行以下命令生成最新的 `processed-data.js` 文件：
        ```bash
        node process-data.js
        ```
    *   **(重要)** 确认 `processed-data.js` 文件已被更新。

3.  **提交并推送更改到GitHub**:
    *   将修改后的 `etf.json`, `adjust.json` (如果已修改) 以及 **更新后的 `processed-data.js`** 文件添加到 Git。
    *   提交这些更改：
        ```bash
        git add etf.json adjust.json processed-data.js
        git commit -m "更新ETF数据"
        ```
    *   将更改推送到你的 GitHub 仓库的主分支：
        ```bash
        git push origin main  # 或者你的主分支名称
        ```

4.  **Vercel 自动重新部署**:
    *   Vercel 会自动检测到你的 GitHub 仓库主分支的更新。
    *   它将自动拉取最新的代码（包含更新后的 `processed-data.js`）。
    *   Vercel 会重新部署你的项目。
    *   通常在几分钟内，你的 Vercel 网站就会显示最新的数据。

### 不再推荐的方式 (网页更新按钮 / 直接修改GitHub文件)

-   **网页更新按钮**: `deploy-guide.md` 之前可能提到过通过网页按钮更新数据。这种方式通常只将数据存储在用户的浏览器本地存储 (localStorage) 中，是临时的，并非永久更新，且对其他用户无效。如果此按钮仍然存在，其功能可能与当前的数据处理流程不符，应考虑移除或修改。
-   **直接修改 GitHub 上的 `data/fund-data.json`**: `deploy-guide.md` 之前可能提到直接在 GitHub 网页上编辑 `data/fund-data.json`。根据我们对 `process-data.js` 的分析，项目的核心数据源是 `etf.json` 和 `adjust.json`，并通过 `process-data.js` 生成 `processed-data.js`。因此，直接修改 `data/fund-data.json` (如果该文件还存在且被使用的话) 可能不是正确的数据更新路径。正确流程是修改源文件并运行预处理脚本。

### 自动更新脚本（高级）

如果你希望完全自动化数据更新，可以考虑设置一个服务器脚本：

1.  创建一个脚本 (例如，使用 Node.js、Python) 来自动从数据源获取最新的 ETF 数据。
2.  脚本需要能更新本地的 `etf.json` 和 `adjust.json` 文件。
3.  脚本接着需要执行 `node process-data.js` 来生成 `processed-data.js`。
4.  最后，脚本需要使用 Git 命令将更新后的 `etf.json`, `adjust.json`, 和 `processed-data.js` 推送到 GitHub 仓库。
5.  设置定时任务 (如 cron job) 定期运行此脚本。

*注意：实现自动更新脚本需要一定的开发和服务器运维知识。*

```javascript
// 脚本示例 (概念性，需要根据实际情况调整)
const { execSync } = require('child_process');
const fs = require('fs');
// ... (添加获取最新数据的逻辑, 更新 etf.json, adjust.json)

try {
  console.log('获取最新数据并更新源文件...');
  // ... (更新 etf.json 和 adjust.json 的代码)

  console.log('运行数据预处理脚本...');
  execSync('node process-data.js', { stdio: 'inherit' });

  console.log('提交并推送更新到 GitHub...');
  execSync('git add etf.json adjust.json processed-data.js', { stdio: 'inherit' });
  // 检查是否有更改需要提交
  const status = execSync('git status --porcelain').toString();
  if (status) {
      execSync(`git commit -m "自动更新ETF数据 ${new Date().toISOString()}"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('数据成功更新并推送到 GitHub');
  } else {
      console.log('数据无变化，无需推送');
  }

} catch (error) {
  console.error('自动更新脚本执行失败:', error);
}
```

## 三、常见问题解答

### Q1: 更新按钮点击后显示错误
如果页面上还存在旧的"更新数据"按钮，它可能不再有效或与当前数据流程冲突。推荐移除该按钮，并遵循本文档描述的通过修改源文件、运行预处理脚本和推送GitHub的更新流程。

### Q2: Vercel部署失败
- 确保 GitHub 仓库中包含了所有必要的文件，特别是 `etf.json`, `adjust.json` 和 **最新生成的 `processed-data.js`**。
- 检查 Vercel 构建日志，确认 `node process-data.js` 命令是否成功执行。
- 确保 `package.json` 文件正确配置了 `build` 脚本。
- 确保项目根目录有可访问的 HTML 文件 (如 `150plan.html`)。

### Q3: 数据不显示或显示异常
- 确认 `processed-data.js` 文件已通过运行 `node process-data.js` 正确生成。
- 检查 `etf.json` 和 `adjust.json` 的格式是否正确。
- 检查浏览器控制台是否有 JavaScript 错误，特别是关于 `processedData` 对象的错误。
- 确认 HTML 文件中正确引入了 `processed-data.js` 和 `plan-data.js`。

### Q4: 如何添加新的基金
1.  编辑本地的 `etf.json` 文件，在 `composition` 数组的相应资产类别下的 `compList` 中添加新的基金对象信息。
2.  如果新基金有调整记录，相应地更新 `adjust.json` 文件。
3.  **运行 `node process-data.js`** 生成包含新基金数据的 `processed-data.js`。
4.  将修改后的 `etf.json`, `adjust.json` (如果修改) 和 **更新后的 `processed-data.js`** 提交并推送到 GitHub。
5.  Vercel 将自动重新部署。

## 四、资源和链接

- [Vercel文档](https://vercel.com/docs)
- [GitHub帮助](https://docs.github.com)
- [天天基金网](https://fund.eastmoney.com/)

如需进一步帮助，请查看项目的README.md文件或联系开发者。 
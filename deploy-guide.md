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
- 构建命令：留空
- 输出目录：留空

#### 2.4 部署项目
1. 点击"Deploy"按钮
2. 等待部署完成（通常只需几秒钟）
3. 部署成功后，Vercel会显示一个预览链接，点击查看你的网站

#### 2.5 自定义域名（可选）
1. 在项目页面，点击"Settings" > "Domains"
2. 输入你的域名，点击"Add"
3. 按照Vercel提供的说明，在你的域名DNS设置中添加相应的记录
4. 等待DNS生效（可能需要几分钟到几小时）

## 二、数据更新方法

本项目提供了两种数据更新方法：

### 1. 通过网页界面更新（简单）

我们已经在页面右下角添加了一个"更新基金数据"按钮：

1. 访问你部署的网站
2. 点击右下角的"更新基金数据"按钮
3. 系统会自动从天天基金网获取最新数据
4. 数据更新成功后会自动刷新页面

注意事项：
- 这种方法使用浏览器的localStorage存储更新后的数据
- 数据只保存在当前浏览器中，不会同步到其他设备
- 如果清除浏览器缓存，更新的数据会丢失

### 2. 通过修改数据文件更新（永久）

如果你希望更新对所有访问者都生效，需要修改GitHub仓库中的数据文件：

1. 登录GitHub，进入你的etftool仓库
2. 找到并点击"data/fund-data.json"文件
3. 点击右上角的铅笔图标（Edit this file）
4. 修改文件内容，更新基金数据
5. 完成修改后，点击"Commit changes"保存

Vercel会自动检测到GitHub仓库的变更，并自动重新部署你的网站。通常在1-2分钟内，所有访问者都能看到更新后的数据。

### 3. 自动更新脚本（高级，需要服务器）

如果你有自己的服务器，可以设置自动更新脚本：

1. 创建一个Node.js脚本，使用axios和cheerio爬取基金数据
2. 使用GitHub API自动更新仓库中的数据文件
3. 设置定时任务，如每天下午收盘后自动运行

参考脚本示例：
```javascript
const axios = require('axios');
const { Octokit } = require('@octokit/rest');

// 初始化GitHub API客户端
const octokit = new Octokit({
  auth: 'your-github-token'  // 需要生成个人访问令牌
});

async function updateFundData() {
  // 获取最新基金数据的代码，类似于data-updater.js中的逻辑
  // ...
  
  // 更新GitHub仓库中的数据文件
  const content = Buffer.from(JSON.stringify(updatedData, null, 2)).toString('base64');
  
  // 获取当前文件的SHA
  const { data: fileData } = await octokit.repos.getContent({
    owner: 'your-username',
    repo: 'etftool',
    path: 'data/fund-data.json'
  });
  
  // 更新文件
  await octokit.repos.createOrUpdateFileContents({
    owner: 'your-username',
    repo: 'etftool',
    path: 'data/fund-data.json',
    message: `更新基金数据 ${new Date().toISOString().split('T')[0]}`,
    content: content,
    sha: fileData.sha
  });
  
  console.log('数据更新成功！');
}

// 运行更新函数
updateFundData();
```

## 三、常见问题解答

### Q1: 更新按钮点击后显示错误
可能是天天基金API发生变化或限制了访问。您可以：
- 检查浏览器控制台的错误信息（按F12打开开发者工具）
- 修改data-updater.js文件，尝试使用不同的API端点

### Q2: Vercel部署失败
- 确保仓库中包含了所有必要的文件
- 检查Vercel构建日志，查看具体错误原因
- 确保index.html文件存在于根目录

### Q3: 数据不显示或显示异常
- 检查data/fund-data.json文件格式是否正确
- 确保HTML中正确引入了所有JavaScript文件
- 查看浏览器控制台是否有JavaScript错误

### Q4: 如何添加新的基金
1. 编辑data/fund-data.json文件
2. 在相应的资产类别中添加新的基金信息
3. 在fundCodes数组中添加新基金的代码
4. 提交更改并等待Vercel重新部署

## 四、资源和链接

- [Vercel文档](https://vercel.com/docs)
- [GitHub帮助](https://docs.github.com)
- [天天基金网](https://fund.eastmoney.com/)

如需进一步帮助，请查看项目的README.md文件或联系开发者。 
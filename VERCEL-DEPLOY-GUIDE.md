# Vercel部署指南

## 问题排查

在Vercel部署过程中可能遇到的常见问题及解决方案：

### 1. 页面404错误

如果部署后页面显示404，可能有以下原因：

- **路由配置错误**：确保`vercel.json`中使用`routes`而非`route`
- **构建输出目录配置错误**：确保`outputDirectory`与实际构建目录一致
- **构建过程失败**：检查构建日志，确保所有文件正确复制到输出目录

### 2. Git子模块获取失败

如果看到"Failed to fetch one or more git submodules"警告：

- 如果项目不依赖子模块，可以在`vercel.json`中添加以下配置禁用子模块：
  ```json
  "git": {
    "submodules": false
  }
  ```

### 3. 构建设置冲突

当看到"Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply"警告：

- 这是正常现象，表示`vercel.json`中的`builds`配置会覆盖项目设置中的构建配置
- 确保`vercel.json`中的`builds`配置正确

### 4. Node.js版本警告

当看到关于`engines`的警告：

- 这只是一个提示，表示当新的Node.js主版本发布时，你的项目可能会自动升级
- 如果需要固定Node.js版本，可以在`package.json`中指定确切版本，例如：`"node": "18.x"`

## 最佳实践

### Vercel配置文件

一个完整的`vercel.json`配置示例：

```json
{
  "routes": [
    { "src": "/", "dest": "/150plan.html" },
    { "src": "/(.*)", "dest": "/$1" }
  ],
  "outputDirectory": "dist",
  "github": {
    "silent": true
  },
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "git": {
    "submodules": false
  }
}
```

### package.json构建脚本

确保`package.json`中包含正确的构建脚本：

```json
"scripts": {
  "vercel-build": "npm run build",
  "build": "node scripts/process-data.js && node scripts/copy-to-dist.js"
}
```

## 部署流程

1. 确保本地构建成功：`npm run build`
2. 确认`dist`目录中包含所有必要文件
3. 提交代码到GitHub
4. Vercel将自动部署最新代码

如有问题，请查看Vercel部署日志以获取详细错误信息。
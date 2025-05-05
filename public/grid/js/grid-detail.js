try {
    // 优先尝试从绝对路径加载
    // 适用于直接通过文件系统访问或特定服务器配置
    const filePath = `/data/grid/${filename}`; 
    const response = await fetch(filePath);
    if (!response.ok) {
        // 如果绝对路径失败，尝试相对路径
        // ... existing code ...
    } else {
         console.log(`从相对路径成功加载 ${filename}`);
        jsonData = await response.json();
    }
    const relativePath = `/data/grid/${filename}`;
    // 添加sourceFile属性记录来源文件名
    jsonData.sourceFile = filename;
    return jsonData;
} catch (error) {
    console.error(`加载文件失败: ${filename}`, error);
    return null;
} 
async function fetchJsonData(filename) {
    try {
        // 优先尝试从绝对路径加载
        const filePath = `/data/grid/${filename}`;
        let response = await fetch(filePath);

        // 如果绝对路径加载失败 (非2xx状态码)，尝试相对路径
        if (!response.ok) {
            // ... existing code ...
        } else {
            jsonData = await response.json();
        }

        const relativePath = `/data/grid/${filename}`;

        // 添加sourceFile属性记录来源文件名
        jsonData.sourceFile = filename;
        // ... existing code ...
    } catch (error) {
        // ... existing code ...
    }
} 
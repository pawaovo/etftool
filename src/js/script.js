document.addEventListener('DOMContentLoaded', () => {
    // 移除导航栏功能，仅保留文字展示
    
    // 处理卡片点击事件
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        // 获取卡片对应的URL
        const pageUrl = card.getAttribute('data-url');
        if (!pageUrl) return;
        
        // 为整个卡片添加点击事件
        card.addEventListener('click', () => {
            window.location.href = pageUrl;
        });
        
        // 为卡片中的按钮单独添加点击事件，避免冒泡
        const cardBtn = card.querySelector('.card-btn');
        if (cardBtn) {
            cardBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                window.location.href = pageUrl;
            });
        }
    });
}); 
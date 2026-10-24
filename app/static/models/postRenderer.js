// 修复后的 postRenderer.js 核心逻辑
export function renderPost(post) {
    // 1. 如果没有图片或作者已注销，直接拦截，不进行渲染
    if (!post.image || post.image === 'image.png' || !post.author) {
        console.warn("跳过无效帖子渲染，防止 404 循环");
        return ""; 
    }

    // 2. 正常渲染逻辑
    return `
        <div class="post-card">
            <img src="/static/images/${post.image}" 
                 onerror="this.parentElement.style.display='none';" 
                 loading="lazy">
            <p>${post.content}</p>
        </div>
    `;
}
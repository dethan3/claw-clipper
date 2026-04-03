/**
 * Medium 文章提取器
 * 专门针对 Medium.com 的文章页面优化
 */

module.exports = {
  name: 'medium',
  
  /**
   * 检查是否适用于 Medium URL
   */
  match: (url) => {
    const hostname = url.hostname.toLowerCase();
    return hostname === 'medium.com' || 
           hostname.endsWith('.medium.com') ||
           hostname.includes('medium');
  },
  
  /**
   * 提取 Medium 文章内容
   */
  extract: async (document, url) => {
    const result = {
      title: '',
      content: '',
      author: '',
      date: '',
      description: '',
      siteName: 'Medium',
      language: 'en', // Medium 主要是英文
      selectors: {
        content: 'article',
        title: 'h1',
        author: '[data-testid="authorName"]',
        date: 'time, [data-testid="storyPublishDate"]'
      }
    };
    
    // 提取标题 - Medium 有特定的标题结构
    const titleElement = document.querySelector('h1') || 
                       document.querySelector('[data-testid="storyTitle"]');
    result.title = titleElement?.textContent?.trim() || 
                   document.title.replace(/ – .*$/, '').trim();
    
    // 提取作者
    const authorElement = document.querySelector('[data-testid="authorName"]') ||
                         document.querySelector('[data-testid="author"]') ||
                         document.querySelector('.pw-author-name') ||
                         document.querySelector('.author');
    result.author = authorElement?.textContent?.trim() || '';
    
    // 提取日期
    const dateElement = document.querySelector('time') ||
                       document.querySelector('[data-testid="storyPublishDate"]') ||
                       document.querySelector('[data-testid="timestamp"]');
    result.date = dateElement?.getAttribute('datetime') || 
                 dateElement?.textContent?.trim() || '';
    
    // 提取描述
    const descriptionElement = document.querySelector('meta[name="description"]') ||
                             document.querySelector('meta[property="og:description"]');
    result.description = descriptionElement?.getAttribute('content')?.trim() || '';
    
    // 提取主要内容 - Medium 文章通常在 article 标签中
    let contentElement = document.querySelector('article');
    
    // 如果没有找到 article，尝试其他选择器
    if (!contentElement) {
      contentElement = document.querySelector('[role="article"]') ||
                      document.querySelector('.postArticle-content') ||
                      document.querySelector('.section-content');
    }
    
    if (contentElement) {
      // 清理 Medium 特定的元素
      cleanupMediumContent(contentElement);
      result.content = contentElement.innerHTML;
    } else {
      // 回退到通用提取
      result.content = document.body.innerHTML;
    }
    
    return result;
  },
  
  /**
   * 清理 Medium 特定的元素
   */
  cleanup: (html) => {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // 移除 Medium 的推荐阅读、相关文章等
    const unwantedSelectors = [
      // 推荐和推广内容
      '.recommendations',
      '.relatedPosts',
      '.postFade',
      '.postArticle-readMore',
      '.highlightMenu',
      '.highlightMenuContainer',
      
      // 社交分享和互动
      '.socialActions',
      '.postActions',
      '.recommendButton',
      '.shareMenu',
      '.collectionSidebar',
      
      // 会员和订阅相关
      '.meteredContent',
      '.paywall',
      '.overlay',
      '.gateway',
      
      // 广告
      '.ad',
      '.advertisement',
      '.promoted',
      
      // 页脚和导航
      '.postArticle-footer',
      '.postArticle-sidebar',
      '.postArticle-recommendations'
    ];
    
    unwantedSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // 清理空的段落
    document.querySelectorAll('p').forEach(p => {
      if (!p.textContent.trim() && !p.querySelector('img, iframe, video')) {
        p.remove();
      }
    });
    
    return document.body.innerHTML;
  }
};

/**
 * 清理 Medium 内容元素
 */
function cleanupMediumContent(element) {
  if (!element) return;
  
  // 移除阅读更多按钮
  element.querySelectorAll('button, .postArticle-readMore').forEach(el => el.remove());
  
  // 移除推荐部分
  element.querySelectorAll('section').forEach(section => {
    const text = section.textContent.toLowerCase();
    if (text.includes('recommended') || text.includes('you might also like')) {
      section.remove();
    }
  });
  
  // 移除会员门控内容
  element.querySelectorAll('[class*="metered"], [class*="paywall"]').forEach(el => {
    el.textContent = '[This content is behind Medium\'s paywall]';
  });
}

// 需要在模块中导入 JSDOM
const { JSDOM } = require('jsdom');
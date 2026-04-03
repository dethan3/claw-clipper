/**
 * 通用网页提取器
 * 适用于大多数网站
 */

module.exports = {
  name: 'generic',
  
  /**
   * 检查是否适用于此 URL
   */
  match: (url) => {
    // 通用提取器适用于所有网站
    return true;
  },
  
  /**
   * 提取文章内容
   */
  extract: async (document, url) => {
    const result = {
      title: '',
      content: '',
      author: '',
      date: '',
      description: '',
      siteName: '',
      language: 'zh-CN',
      selectors: {
        content: null,
        title: null,
        author: null,
        date: null
      }
    };
    
    // 提取标题
    result.title = extractTitle(document, url);
    result.selectors.title = 'h1 or title';
    
    // 提取作者
    result.author = extractAuthor(document);
    result.selectors.author = findAuthorSelector(document);
    
    // 提取日期
    result.date = extractDate(document);
    result.selectors.date = findDateSelector(document);
    
    // 提取描述
    result.description = extractDescription(document);
    
    // 提取网站名称
    result.siteName = extractSiteName(document, url);
    
    // 提取主要内容
    const mainContent = findMainContent(document);
    if (mainContent) {
      result.content = mainContent.innerHTML;
      result.selectors.content = getSelector(mainContent);
    } else {
      result.content = document.body.innerHTML;
      result.selectors.content = 'body';
    }
    
    return result;
  },
  
  /**
   * 清理提取的内容
   */
  cleanup: (html) => {
    // 移除常见的不需要元素
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      'aside',
      '.ad',
      '.advertisement',
      '.sidebar',
      '.related-posts',
      '.comments',
      '.share-buttons',
      '.newsletter',
      '.popup',
      '.modal'
    ];
    
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    unwantedSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // 清理空的段落和 div
    document.querySelectorAll('p, div').forEach(el => {
      if (!el.textContent.trim() && !el.querySelector('img, iframe, video')) {
        el.remove();
      }
    });
    
    return document.body.innerHTML;
  }
};

/**
 * 辅助函数
 */

function extractTitle(document, url) {
  // 优先级: h1 > og:title > meta title > document.title
  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent.trim()) {
    return h1.textContent.trim();
  }
  
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && ogTitle.getAttribute('content')) {
    return ogTitle.getAttribute('content').trim();
  }
  
  const metaTitle = document.querySelector('title');
  if (metaTitle && metaTitle.textContent.trim()) {
    return metaTitle.textContent.trim().replace(/\s*[-|·]\s*.+$/, '').trim();
  }
  
  return document.title.trim() || new URL(url).hostname;
}

function extractAuthor(document) {
  const authorSelectors = [
    'meta[name="author"]',
    '[rel="author"]',
    '.author',
    '.byline',
    '[itemprop="author"]',
    'a[class*="author"]',
    '[class*="author"] a',
    '.post-author',
    '.article-author',
    '.entry-author'
  ];
  
  for (const selector of authorSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const author = element.getAttribute('content') || 
                    element.getAttribute('title') || 
                    element.textContent?.trim();
      if (author && author.length > 0 && author.length < 100) {
        return author;
      }
    }
  }
  
  return '';
}

function findAuthorSelector(document) {
  const authorSelectors = [
    'meta[name="author"]',
    '[rel="author"]',
    '.author',
    '.byline',
    '[itemprop="author"]'
  ];
  
  for (const selector of authorSelectors) {
    if (document.querySelector(selector)) {
      return selector;
    }
  }
  
  return null;
}

function extractDate(document) {
  const dateSelectors = [
    'time[datetime]',
    'time',
    '[class*="date"]',
    '[class*="time"]',
    '[itemprop="datePublished"]',
    '[itemprop="dateModified"]',
    'meta[property="article:published_time"]',
    'meta[property="article:modified_time"]',
    'meta[name="published_time"]',
    'meta[name="modified_time"]',
    '.post-date',
    '.article-date',
    '.entry-date',
    '.published',
    '.updated'
  ];
  
  for (const selector of dateSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const date = element.getAttribute('datetime') || 
                  element.getAttribute('content') || 
                  element.getAttribute('title') ||
                  element.textContent?.trim();
      if (date && isValidDate(date)) {
        return normalizeDate(date);
      }
    }
  }
  
  return '';
}

function findDateSelector(document) {
  const dateSelectors = [
    'time[datetime]',
    '[itemprop="datePublished"]',
    'meta[property="article:published_time"]'
  ];
  
  for (const selector of dateSelectors) {
    if (document.querySelector(selector)) {
      return selector;
    }
  }
  
  return null;
}

function extractDescription(document) {
  const descriptionSelectors = [
    'meta[name="description"]',
    'meta[property="og:description"]',
    'meta[name="twitter:description"]',
    '.article-description',
    '.post-excerpt',
    '.entry-summary'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const description = element.getAttribute('content') || element.textContent?.trim();
      if (description && description.length > 10 && description.length < 300) {
        return description;
      }
    }
  }
  
  return '';
}

function extractSiteName(document, url) {
  const siteSelectors = [
    'meta[property="og:site_name"]',
    'meta[name="application-name"]',
    '.site-title',
    '.site-name',
    'header h1 a'
  ];
  
  for (const selector of siteSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const siteName = element.getAttribute('content') || element.textContent?.trim();
      if (siteName) {
        return siteName;
      }
    }
  }
  
  // 从 URL 提取域名
  const hostname = new URL(url).hostname;
  return hostname.replace(/^www\./, '').split('.')[0];
}

function findMainContent(document) {
  // 优先级选择器
  const contentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content',
    '.post',
    '.article',
    '.blog-post',
    '.story-content',
    '#content',
    '#main',
    '.main-content',
    '.page-content'
  ];
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element && hasSubstantialContent(element)) {
      return element;
    }
  }
  
  // 如果没有找到明确的内容区域，尝试找到包含最多文本的 div
  const divs = Array.from(document.querySelectorAll('div'));
  let bestDiv = null;
  let maxTextLength = 0;
  
  for (const div of divs) {
    const textLength = div.textContent.trim().length;
    const linkDensity = calculateLinkDensity(div);
    
    // 选择文本最多且链接密度较低的 div
    if (textLength > maxTextLength && textLength > 200 && linkDensity < 0.5) {
      maxTextLength = textLength;
      bestDiv = div;
    }
  }
  
  return bestDiv || document.body;
}

function hasSubstantialContent(element) {
  const text = element.textContent.trim();
  const paragraphs = element.querySelectorAll('p');
  
  // 至少有 100 个字符或 3 个段落
  return text.length > 100 || paragraphs.length >= 3;
}

function calculateLinkDensity(element) {
  const textLength = element.textContent.length;
  if (textLength === 0) return 0;
  
  const linkTextLength = Array.from(element.querySelectorAll('a'))
    .reduce((total, link) => total + (link.textContent?.length || 0), 0);
  
  return linkTextLength / textLength;
}

function getSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c).join('.');
    if (classes) {
      return `${element.tagName.toLowerCase()}.${classes}`;
    }
  }
  
  return element.tagName.toLowerCase();
}

function isValidDate(dateString) {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
  } catch {
    return false;
  }
}

function normalizeDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return dateString;
  }
}

// 需要在模块中导入 JSDOM
const { JSDOM } = require('jsdom');
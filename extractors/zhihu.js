/**
 * 知乎文章/回答提取器
 * 专门针对 zhihu.com 的内容优化
 */

module.exports = {
  name: 'zhihu',
  
  /**
   * 检查是否适用于知乎 URL
   */
  match: (url) => {
    const hostname = url.hostname.toLowerCase();
    return hostname === 'zhihu.com' || 
           hostname.endsWith('.zhihu.com') ||
           hostname.includes('zhihu');
  },
  
  /**
   * 提取知乎内容
   */
  extract: async (document, url) => {
    const result = {
      title: '',
      content: '',
      author: '',
      date: '',
      description: '',
      siteName: '知乎',
      language: 'zh-CN',
      selectors: {
        content: '.RichText, .Post-RichText, .AnswerItem',
        title: '.QuestionHeader-title, .Post-Title',
        author: '.AuthorInfo, .UserLink',
        date: '.ContentItem-time, time'
      },
      type: 'unknown' // article, answer, question
    };
    
    // 判断内容类型
    const pathname = url.pathname.toLowerCase();
    if (pathname.includes('/p/')) {
      result.type = 'article'; // 知乎文章
    } else if (pathname.includes('/question/') && pathname.includes('/answer/')) {
      result.type = 'answer'; // 知乎回答
    } else if (pathname.includes('/question/')) {
      result.type = 'question'; // 知乎问题
    }
    
    // 提取标题
    if (result.type === 'article') {
      // 文章页面
      result.title = document.querySelector('.Post-Title')?.textContent?.trim() ||
                    document.querySelector('h1')?.textContent?.trim() ||
                    document.title.replace(' - 知乎', '').trim();
    } else if (result.type === 'answer' || result.type === 'question') {
      // 回答或问题页面
      result.title = document.querySelector('.QuestionHeader-title')?.textContent?.trim() ||
                    document.querySelector('h1')?.textContent?.trim() ||
                    document.title.replace(' - 知乎', '').trim();
    }
    
    // 提取作者
    const authorElement = document.querySelector('.AuthorInfo') ||
                         document.querySelector('.UserLink') ||
                         document.querySelector('.AuthorInfo-name');
    result.author = authorElement?.textContent?.trim() || '';
    
    // 提取日期
    const dateElement = document.querySelector('.ContentItem-time') ||
                       document.querySelector('time') ||
                       document.querySelector('.PostIndex-header .ContentItem-time');
    result.date = dateElement?.getAttribute('datetime') || 
                 dateElement?.textContent?.trim() || '';
    
    // 提取描述
    const descriptionElement = document.querySelector('meta[name="description"]') ||
                             document.querySelector('meta[property="og:description"]');
    result.description = descriptionElement?.getAttribute('content')?.trim() || '';
    
    // 提取主要内容
    let contentElement = null;
    
    if (result.type === 'article') {
      // 文章内容
      contentElement = document.querySelector('.Post-RichText') ||
                      document.querySelector('.RichText');
    } else if (result.type === 'answer') {
      // 回答内容
      contentElement = document.querySelector('.AnswerItem .RichText') ||
                      document.querySelector('.RichContent');
    } else if (result.type === 'question') {
      // 问题描述（可能包含多个回答）
      contentElement = document.querySelector('.QuestionHeader-detail .RichText');
    }
    
    if (contentElement) {
      // 清理知乎特定的元素
      cleanupZhihuContent(contentElement);
      result.content = contentElement.innerHTML;
    } else {
      // 回退到通用提取
      result.content = document.body.innerHTML;
    }
    
    // 如果是回答，添加回答者信息
    if (result.type === 'answer' && result.author) {
      result.content = `<blockquote>作者：${result.author}</blockquote>\n\n${result.content}`;
    }
    
    return result;
  },
  
  /**
   * 清理知乎特定的元素
   */
  cleanup: (html) => {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // 移除知乎的特定元素
    const unwantedSelectors = [
      // 投票和互动
      '.VoteButton',
      '.ContentItem-actions',
      '.ContentItem-actionsInner',
      '.Button--withIcon',
      '.ContentItem-action',
      
      // 评论和回复
      '.Comments-container',
      '.CommentList',
      '.ReplyList',
      '.CommentItem',
      
      // 推荐和广告
      '.Recommendations',
      '.Recommendations-Main',
      '.Pc-card',
      '.Advert',
      '.Marketing',
      
      // 页脚和导航
      '.Footer',
      '.GlobalSideBar',
      '.Question-sideColumn',
      '.Sticky',
      
      // 折叠内容
      '.CollapsedAnswers',
      '.CollapsedComment',
      
      // 知乎特定的样式和脚本
      '.ztext-math',
      '.z-ico',
      '.LinkCard',
      '.VideoCard'
    ];
    
    unwantedSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // 清理图片的知乎特定属性
    document.querySelectorAll('img').forEach(img => {
      // 移除 data-actualsrc，使用 src
      if (img.getAttribute('data-actualsrc')) {
        img.src = img.getAttribute('data-actualsrc');
        img.removeAttribute('data-actualsrc');
      }
      
      // 移除 data-original
      if (img.getAttribute('data-original')) {
        img.src = img.getAttribute('data-original');
        img.removeAttribute('data-original');
      }
      
      // 移除知乎的图片类名
      img.classList.remove('origin_image', 'content_image', 'lazy');
    });
    
    // 清理链接的知乎特定属性
    document.querySelectorAll('a').forEach(link => {
      link.removeAttribute('data-draft-node');
      link.removeAttribute('data-draft-type');
      link.removeAttribute('data-za-detail-view-element_name');
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
 * 清理知乎内容元素
 */
function cleanupZhihuContent(element) {
  if (!element) return;
  
  // 移除折叠按钮
  element.querySelectorAll('.CollapseButton, .ToggleButton').forEach(el => el.remove());
  
  // 移除「查看全部」按钮
  element.querySelectorAll('.Button--plain').forEach(button => {
    if (button.textContent.includes('查看全部') || button.textContent.includes('展开阅读')) {
      button.remove();
    }
  });
  
  // 处理折叠内容（展开它们）
  element.querySelectorAll('.CollapsedAnswer, .CollapsedComment').forEach(collapsed => {
    const expandButton = collapsed.querySelector('.ExpandButton');
    if (expandButton) {
      // 模拟点击展开（实际上移除折叠类并显示内容）
      collapsed.classList.remove('CollapsedAnswer', 'CollapsedComment');
      const content = collapsed.querySelector('.RichContent');
      if (content) {
        content.style.display = 'block';
      }
    }
  });
  
  // 移除水印
  element.querySelectorAll('.watermark').forEach(el => el.remove());
}

// 需要在模块中导入 JSDOM
const { JSDOM } = require('jsdom');
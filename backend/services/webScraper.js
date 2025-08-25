const axios = require('axios');
const cheerio = require('cheerio');
const TurndownService = require('turndown');
const { v4: uuidv4 } = require('uuid');

class WebScraper {
  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    
    // Configure turndown to clean up HTML better
    this.turndown.addRule('removeScripts', {
      filter: ['script', 'style', 'nav', 'footer', 'header', 'aside'],
      replacement: () => ''
    });
  }

  /**
   * Scrape content from a single URL
   * @param {string} url - The URL to scrape
   * @param {Object} options - Scraping options
   * @returns {Promise<Object>} Scraped content and metadata
   */
  async scrapeUrl(url, options = {}) {
    const {
      timeout = 10000,
      userAgent = 'Mozilla/5.0 (compatible; Chatbot-AI/1.0)',
      maxContentLength = 50000
    } = options;

    try {
      console.log(`🌐 Scraping URL: ${url}`);
      
      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }

      // Make HTTP request
      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        maxContentLength: maxContentLength * 3 // Allow larger download, we'll trim later
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse HTML content
      const $ = cheerio.load(response.data);
      
      // Extract metadata
      const title = $('title').text().trim() || 
                   $('h1').first().text().trim() || 
                   'Untitled Page';
      
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || 
                         '';

      // Remove unwanted elements
      $('script, style, nav, footer, header, aside, .nav, .navigation, .sidebar, .advertisement, .ads').remove();
      
      // Extract main content (try various selectors)
      let content = this.extractMainContent($);
      
      if (!content || content.length < 50) {
        throw new Error('Insufficient content extracted from page');
      }

      // Convert HTML to clean markdown
      const markdown = this.turndown.turndown(content);
      
      // Clean up the markdown
      let cleanContent = this.cleanContent(markdown);
      
      // If content is too long, try to extract the most important parts
      if (cleanContent.length > maxContentLength) {
        console.log(`⚠️ Content too long (${cleanContent.length} chars), extracting key sections...`);
        cleanContent = this.extractKeyContent(cleanContent, maxContentLength);
        console.log(`✂️ Content optimized to ${cleanContent.length} characters`);
      }

      const result = {
        url,
        title,
        description,
        content: cleanContent.substring(0, maxContentLength),
        contentLength: cleanContent.length,
        scrapedAt: new Date(),
        status: 'success'
      };

      console.log(`✅ Successfully scraped ${url} - ${result.contentLength} characters`);
      return result;

    } catch (error) {
      console.error(`❌ Failed to scrape ${url}:`, error.message);
      
      return {
        url,
        title: 'Error',
        description: '',
        content: '',
        contentLength: 0,
        scrapedAt: new Date(),
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Extract main content from the page
   * @param {Object} $ - Cheerio instance
   * @returns {string} Extracted content
   */
  extractMainContent($) {
    // Remove unwanted elements first
    $('script, style, nav, footer, header, aside, .nav, .navigation, .sidebar, .advertisement, .ads, .social-share, .comments, .related-posts, iframe, embed, object').remove();
    
    // Try various common content selectors in order of preference
    const contentSelectors = [
      'main article',
      'main .content',
      'main',
      '[role="main"]',
      '.main-content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content-area',
      'article .content',
      'article',
      '.page-content',
      '#content',
      '.content'
    ];

    let bestContent = '';
    let maxLength = 0;

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text.length > maxLength && text.length > 200) {
          maxLength = text.length;
          bestContent = element.html();
        }
      }
    }

    // If no good content found, try to extract meaningful paragraphs
    if (!bestContent || maxLength < 500) {
      const paragraphs = $('p').filter((i, el) => {
        const text = $(el).text().trim();
        return text.length > 50 && !text.match(/^(cookie|privacy|terms|subscribe|follow|share)/i);
      });
      
      if (paragraphs.length > 0) {
        bestContent = paragraphs.slice(0, 10).map((i, el) => $(el).html()).get().join('\n');
      }
    }

    // Final fallback: get body content but clean it up
    if (!bestContent) {
      $('head, script, style, nav, footer, header, aside').remove();
      bestContent = $('body').html() || '';
    }

    return bestContent;
  }

  /**
   * Extract key content when the full content is too long
   * @param {string} content - Full content
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Optimized content
   */
  extractKeyContent(content, maxLength) {
    const lines = content.split('\n');
    const keyParts = [];
    let currentLength = 0;
    
    // Priority order for content types
    const priorities = [
      // Headers (most important)
      /^#{1,3}\s+/,
      // Lists and key points
      /^[\*\-\+]\s+/,
      /^\d+\.\s+/,
      // Important text patterns
      /^>\s+/,
      // Code blocks
      /^```/,
      // Regular paragraphs with important keywords
      /(api|method|function|class|example|tutorial|guide|how to|step|important|note)/i
    ];
    
    // First pass: collect high-priority content
    for (const priority of priorities) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 10 && priority.test(trimmed)) {
          if (currentLength + trimmed.length + 1 < maxLength * 0.8) {
            keyParts.push(trimmed);
            currentLength += trimmed.length + 1;
          }
        }
      }
    }
    
    // Second pass: fill remaining space with the longest meaningful paragraphs
    const remainingSpace = maxLength - currentLength;
    const paragraphs = lines
      .filter(line => line.trim().length > 50 && !keyParts.includes(line.trim()))
      .sort((a, b) => b.length - a.length);
    
    for (const paragraph of paragraphs) {
      if (currentLength + paragraph.length + 1 < maxLength) {
        keyParts.push(paragraph.trim());
        currentLength += paragraph.length + 1;
      } else {
        break;
      }
    }
    
    return keyParts.join('\n');
  }

  /**
   * Clean and normalize content
   * @param {string} content - Raw content
   * @returns {string} Cleaned content
   */
  cleanContent(content) {
    return content
      // Remove extra whitespace and line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s+/g, '\n')
      // Remove markdown artifacts and empty elements
      .replace(/\[(\s*)\]/g, '')
      .replace(/!\[\]/g, '')
      .replace(/\(\s*\)/g, '')
      // Remove repeated dashes/underscores/equals
      .replace(/[-_=]{4,}/g, '')
      // Remove excessive punctuation
      .replace(/\.{3,}/g, '...')
      .replace(/!{2,}/g, '!')
      .replace(/\?{2,}/g, '?')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove lines that are just whitespace or single characters
      .replace(/\n\s*[.,-]\s*\n/g, '\n')
      .replace(/\n\s*\n/g, '\n')
      // Remove excessive spacing
      .trim();
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} Whether URL is valid
   */
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if domain is allowed
   * @param {string} url - URL to check
   * @param {Array} allowedDomains - List of allowed domains
   * @param {Array} blockedDomains - List of blocked domains
   * @returns {boolean} Whether domain is allowed
   */
  isDomainAllowed(url, allowedDomains = [], blockedDomains = []) {
    try {
      const domain = new URL(url).hostname;
      
      // Check blocked domains first
      if (blockedDomains.length > 0 && blockedDomains.some(blocked => domain.includes(blocked))) {
        return false;
      }
      
      // Check allowed domains if specified
      if (allowedDomains.length > 0) {
        return allowedDomains.some(allowed => domain.includes(allowed));
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Scrape multiple URLs
   * @param {Array} urls - URLs to scrape
   * @param {Object} options - Scraping options
   * @returns {Promise<Array>} Array of scraped results
   */
  async scrapeMultiple(urls, options = {}) {
    const { concurrent = 3 } = options;
    const results = [];
    
    // Process URLs in batches to avoid overwhelming servers
    for (let i = 0; i < urls.length; i += concurrent) {
      const batch = urls.slice(i, i + concurrent);
      const batchPromises = batch.map(url => this.scrapeUrl(url, options));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            url: batch[index],
            title: 'Error',
            content: '',
            status: 'error',
            error: result.reason.message
          });
        }
      });

      // Small delay between batches
      if (i + concurrent < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

module.exports = WebScraper;

interface FetchedContent {
  url: string;
  title: string;
  text: string;
  summary: string;
  success: boolean;
  error?: string;
  isPasted?: boolean;
}

// Try multiple CORS proxies for better reliability
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

export function normalizeURL(input: string): string {
  let url = input.trim();
  
  // Remove any leading/trailing whitespace
  url = url.trim();
  
  // If it doesn't start with http:// or https://, add https://
  if (!url.match(/^https?:\/\//i)) {
    url = 'https://' + url;
  }
  
  // If it doesn't have www and doesn't have a subdomain, try adding www
  // This helps with common sites like "bbc.com" -> "www.bbc.com"
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const parts = hostname.split('.');
    
    // If it's just domain.tld (2 parts), try adding www
    if (parts.length === 2 && !hostname.startsWith('www.')) {
      urlObj.hostname = 'www.' + hostname;
      url = urlObj.toString();
    }
  } catch (e) {
    // If URL parsing fails, return as-is
  }
  
  return url;
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function tryFetchWithProxy(normalizedUrl: string, proxyUrl: string): Promise<string> {
  const isAllOrigins = proxyUrl.includes('allorigins');
  const isCodeTabs = proxyUrl.includes('codetabs');
  const fullUrl = proxyUrl + encodeURIComponent(normalizedUrl);
  
  const response = await fetchWithTimeout(fullUrl, 10000);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  if (isAllOrigins) {
    // allorigins returns JSON with contents.contents
    const json = await response.json();
    return json.contents || '';
  } else if (isCodeTabs) {
    // codetabs returns raw HTML
    return await response.text();
  } else {
    // Other proxies return raw HTML
    return await response.text();
  }
}

function getUserFriendlyError(error: Error, url: string): string {
  const message = error.message.toLowerCase();
  
  // Timeout errors
  if (message.includes('aborted') || message.includes('timeout')) {
    return "This website is taking too long to respond. The site may be blocking automated access. Try pasting the article text directly instead.";
  }
  
  // Network errors
  if (message.includes('failed to fetch') || message.includes('network')) {
    return "Connection failed. This could be due to your internet connection or the website blocking access. Try pasting the article text directly.";
  }
  
  // Invalid URL
  if (message.includes('invalid url')) {
    return "This doesn't look like a valid web address. Please check the link and try again.";
  }
  
  // HTTP errors
  if (message.includes('http 403') || message.includes('http 401')) {
    return "This website is blocking automated access. Please try pasting the article text directly using the 'Paste Article Text' option below.";
  }
  
  if (message.includes('http 404')) {
    return "We couldn't find this page. The article may have been moved or removed. Try a different link.";
  }
  
  if (message.includes('http 5')) {
    return "The website's servers are having issues. This is common with news sites that block automated access. Try pasting the article text directly instead.";
  }
  
  // Content extraction errors
  if (message.includes('extract meaningful content')) {
    return "We couldn't read the article content from this page. Try pasting the article text directly.";
  }
  
  // Generic fallback with helpful suggestion
  return "We're having trouble accessing this article. Many news sites block automated access. Try using the 'Paste Article Text' option below instead.";
}

export async function fetchArticleContent(url: string): Promise<FetchedContent> {
  try {
    // Normalize the URL first
    const normalizedUrl = normalizeURL(url);
    
    // Validate URL
    try {
      new URL(normalizedUrl);
    } catch {
      throw new Error('Invalid URL');
    }
    
    let html = '';
    let lastError: Error | null = null;
    
    // Try each proxy in sequence with shorter timeouts
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      try {
        html = await tryFetchWithProxy(normalizedUrl, CORS_PROXIES[i]);
        if (html && html.length > 100) {
          break; // Success!
        }
      } catch (error) {
        console.warn(`Proxy ${i + 1}/${CORS_PROXIES.length} failed:`, error);
        lastError = error as Error;
        
        // If not the last proxy, wait a bit before trying the next one
        if (i < CORS_PROXIES.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    if (!html || html.length < 100) {
      throw lastError || new Error('Unable to fetch content - all proxies failed');
    }

    // Extract content from HTML
    const extracted = extractContentFromHTML(html);
    
    if (!extracted.text || extracted.text.length < 50) {
      throw new Error('Could not extract meaningful content from this page');
    }
    
    // Generate summary
    const summary = generateSummary(extracted.text);
    
    return {
      url: normalizedUrl,
      title: extracted.title,
      text: extracted.text,
      summary,
      success: true,
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    
    const errorMessage = error instanceof Error 
      ? getUserFriendlyError(error, url)
      : "We're having trouble reading this article. Try pasting the article text directly.";
    
    return {
      url,
      title: '',
      text: '',
      summary: '',
      success: false,
      error: errorMessage,
    };
  }
}

export async function processArticleText(text: string, title?: string): Promise<FetchedContent> {
  try {
    if (!text || text.trim().length < 100) {
      throw new Error('Please provide at least 100 characters of article text');
    }

    const cleanedText = text.trim();
    const summary = generateSummary(cleanedText);

    return {
      url: 'pasted-content',
      title: title || 'Pasted Article',
      text: cleanedText,
      summary,
      success: true,
      isPasted: true,
    };
  } catch (error) {
    return {
      url: 'pasted-content',
      title: '',
      text: '',
      summary: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unable to process article text',
    };
  }
}

function extractContentFromHTML(html: string): { title: string; text: string } {
  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extract title
  let title = '';
  const titleElement = doc.querySelector('title');
  if (titleElement) {
    title = titleElement.textContent || '';
  }
  
  // Try meta og:title as fallback
  if (!title) {
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      title = ogTitle.getAttribute('content') || '';
    }
  }
  
  // Try h1 as last resort
  if (!title) {
    const h1 = doc.querySelector('h1');
    if (h1) {
      title = h1.textContent || '';
    }
  }
  
  // Extract main content text
  let text = '';
  
  // Try common article selectors
  const contentSelectors = [
    'article',
    '[role="main"]',
    'main',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.story-body',
    '.article-body',
    '.content',
    '#content',
  ];
  
  for (const selector of contentSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      text = extractTextFromElement(element);
      if (text.length > 200) break; // Found substantial content
    }
  }
  
  // Fallback: get all paragraph text
  if (text.length < 200) {
    const paragraphs = doc.querySelectorAll('p');
    const paragraphTexts: string[] = [];
    paragraphs.forEach(p => {
      const pText = p.textContent?.trim();
      if (pText && pText.length > 50) {
        paragraphTexts.push(pText);
      }
    });
    text = paragraphTexts.join(' ');
  }
  
  // Clean up text
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
    .substring(0, 5000); // Limit to first 5000 chars for analysis
  
  return { title: title.trim(), text };
}

function extractTextFromElement(element: Element): string {
  // Remove script and style elements
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement').forEach(el => el.remove());
  
  return clone.textContent?.trim() || '';
}

function generateSummary(text: string): string {
  if (!text || text.length < 100) {
    return 'Unable to generate summary from article content.';
  }
  
  // Split into sentences
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200); // Filter out very short or very long sentences
  
  if (sentences.length === 0) {
    return text.substring(0, 200) + '...';
  }
  
  // Take first 2-3 meaningful sentences
  const summaryLength = Math.min(3, sentences.length);
  const summary = sentences.slice(0, summaryLength).join('. ');
  
  // Ensure it ends with punctuation
  return summary + (summary.endsWith('.') ? '' : '.');
}

export function isValidURL(urlString: string): boolean {
  try {
    const normalized = normalizeURL(urlString);
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
}
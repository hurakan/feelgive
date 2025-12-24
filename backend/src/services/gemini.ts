import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { webSearchService } from './web-search.js';
import { responseCacheService } from './response-cache.js';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface ArticleContext {
  articleTitle: string;
  articleText: string;
  articleSummary: string;
  articleUrl?: string;
  classification: {
    cause: string;
    geoName: string;
    severity: string;
    identified_needs: string[];
    affectedGroups: string[];
  };
  matchedCharities: Array<{
    name: string;
    description: string;
    trustScore: number;
  }>;
}

interface GenerateResponseParams {
  message: string;
  context: ArticleContext;
  history: ChatMessage[];
  enableWebSearch?: boolean;
}

interface GenerateResponseResult {
  message: string;
  sources: Array<{
    title: string;
    url: string;
  }>;
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY or GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Use the model specified in env or default to gemini-1.5-flash
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Constructs the system prompt with article context and guidelines
   */
  private constructSystemPrompt(context: ArticleContext, webSearchResults?: string, webSearchAttempted: boolean = false): string {
    const charitiesList = context.matchedCharities
      .map(charity => `- ${charity.name}: ${charity.description} (Trust Score: ${charity.trustScore})`)
      .join('\n');

    const needsList = context.classification.identified_needs.join(', ');
    const affectedGroupsList = context.classification.affectedGroups.join(', ');

    return `ROLE:
You are "Hope", an empathetic and knowledgeable crisis response assistant for the FeelGive platform.
Your goal is to help users understand the crisis described in the provided article and inspire them to donate to the suggested charities.

CONTEXT:
Article Title: ${context.articleTitle}
Primary Location: ${context.classification.geoName}
Severity: ${context.classification.severity}
Cause: ${context.classification.cause}
Identified Needs: ${needsList}
Affected Groups: ${affectedGroupsList}

Article Summary: ${context.articleSummary}

Full Article Content:
"""
${context.articleText}
"""

MATCHED CHARITIES:
${charitiesList}

${webSearchResults ? `ADDITIONAL WEB SEARCH RESULTS:
${webSearchResults}
` : ''}
GUIDELINES:
1. BREVITY: Keep responses concise (2-4 paragraphs max). Be direct and focused. Avoid lengthy explanations unless specifically asked.
2. ACCURACY: Prioritize information from the provided Article Content. ${webSearchResults ? 'Use the web search results above to provide current, up-to-date information. You have access to recent web search results, so answer questions about current developments, latest updates, and recent news confidently using these sources.' : webSearchAttempted ? 'Web search was attempted but no additional results were found. Answer based on the article content and your general knowledge. If you can provide helpful information about current events or general context related to the crisis, do so confidently. Only mention the article age if you truly cannot answer the question.' : 'Focus on the article content provided. If asked about very recent developments or information not in the article, politely explain that you are working with the article information and suggest they enable web search for the most current updates.'} Do not make up facts.
3. GEOGRAPHIC CONTEXT: The "Primary Location" field indicates the main subject of the crisis, not just any location mentioned. When discussing the crisis, focus on this primary location. Other locations mentioned in the article may be comparisons or references, not the crisis location itself.
4. EMPATHY: Use a compassionate, serious, but hopeful tone.
5. ACTION-ORIENTED: When appropriate, subtly mention how the matched charities can help with the specific needs mentioned in the article.
6. FORMAT: Use Markdown. Keep responses focused and relevant. Always complete your sentences - never end mid-sentence.
7. SAFETY: Do not answer questions unrelated to the crisis, charity, or humanitarian aid.
8. RELEVANCE: If a question is off-topic, politely redirect the user back to the crisis and how they can help.
9. KNOWLEDGE SCOPE: You can answer questions about:
   - The crisis described in the article
   - General information about the affected region
   - How humanitarian aid works in these situations
   - The matched charities and their work
   - How donations help in crisis situations
   - General crisis response and humanitarian principles`;
  }

  /**
   * Generates a response using Google Gemini API
   */
  async generateResponse({ message, context, history, enableWebSearch = false }: GenerateResponseParams): Promise<GenerateResponseResult> {
    try {
      // Check cache first (only for non-web-search queries to keep cache simple)
      if (!enableWebSearch) {
        const cached = responseCacheService.get(message, {
          articleTitle: context.articleTitle,
          cause: context.classification.cause,
          geoName: context.classification.geoName
        });

        if (cached) {
          return {
            message: cached.response,
            sources: cached.sources
          };
        }
      }

      let webSearchResults: string | undefined;
      const sources: Array<{ title: string; url: string }> = [];

      // Always include the original article as a source if we have a URL
      if (context.articleUrl) {
        sources.push({
          title: context.articleTitle,
          url: context.articleUrl
        });
      }

      // Perform web search if enabled and available
      if (enableWebSearch && webSearchService.isAvailable()) {
        try {
          console.log('Web search enabled, generating search query...');
          const searchQuery = webSearchService.generateSearchQuery(message, {
            articleTitle: context.articleTitle,
            geoName: context.classification.geoName,
            cause: context.classification.cause,
          });

          const searchResponse = await webSearchService.search(searchQuery);
          webSearchResults = webSearchService.formatResultsForPrompt(searchResponse);
          
          // Add web search results as sources
          searchResponse.results.forEach(result => {
            sources.push({
              title: result.title,
              url: result.link
            });
          });
          
          console.log('Web search completed successfully');
        } catch (searchError) {
          console.error('Web search failed, continuing without it:', searchError);
          // Continue without web search results - graceful degradation
        }
      }

      // Construct the system prompt
      const systemPrompt = this.constructSystemPrompt(context, webSearchResults, enableWebSearch);

      // Build the conversation history for Gemini
      const chatHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Start a chat session with history
      const chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I am Hope, your empathetic crisis response assistant. I will help you understand this crisis and how you can make a difference through the matched charities. What would you like to know?' }],
          },
          ...chatHistory,
        ],
        generationConfig: {
          maxOutputTokens: 800, // Reduced from 2048 to save on rate limits
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });

      // Send the user's message
      const geminiResult = await chat.sendMessage(message);
      const response = geminiResult.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      const finalResult = {
        message: text,
        sources
      };

      // Cache the response (only for non-web-search queries)
      if (!enableWebSearch) {
        responseCacheService.set(
          message,
          {
            articleTitle: context.articleTitle,
            cause: context.classification.cause,
            geoName: context.classification.geoName
          },
          text,
          sources
        );
      }

      return finalResult;
    } catch (error) {
      console.error('Error generating response from Gemini:', error);
      
      // Provide a graceful fallback message
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('API configuration error. Please contact support.');
        }
        if (error.message.includes('quota') || error.message.includes('rate limit')) {
          throw new Error('Service temporarily unavailable due to high demand. Please try again in a moment.');
        }
      }
      
      throw new Error('I\'m having trouble connecting right now. Please consider donating to the matched charities to help with this crisis.');
    }
  }

  /**
   * Generates follow-up question suggestions based on the context
   */
  generateSuggestions(context: ArticleContext): string[] {
    const suggestions: string[] = [];

    // Add context-aware suggestions
    if (context.matchedCharities.length > 0) {
      suggestions.push(`How can ${context.matchedCharities[0].name} help with this crisis?`);
    }

    if (context.classification.identified_needs.length > 0) {
      suggestions.push(`What are the most urgent needs in ${context.classification.geoName}?`);
    }

    suggestions.push('How can I make the biggest impact with my donation?');

    return suggestions.slice(0, 3);
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
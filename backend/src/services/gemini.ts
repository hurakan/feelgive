import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { webSearchService } from './web-search.js';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface ArticleContext {
  articleTitle: string;
  articleText: string;
  articleSummary: string;
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
  private constructSystemPrompt(context: ArticleContext, webSearchResults?: string): string {
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
Location: ${context.classification.geoName}
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

${webSearchResults ? `\n${webSearchResults}\n` : ''}
GUIDELINES:
1. ACCURACY: Answer ONLY based on the provided Article Content and your general knowledge of the crisis region. Do not make up facts.
2. EMPATHY: Use a compassionate, serious, but hopeful tone.
3. ACTION-ORIENTED: When appropriate, subtly mention how the matched charities can help with the specific needs mentioned in the article.
4. FORMAT: Use Markdown. Keep answers concise (under 150 words) unless asked for detail.
5. SAFETY: Do not answer questions unrelated to the crisis, charity, or humanitarian aid.
6. RELEVANCE: If a question is off-topic, politely redirect the user back to the crisis and how they can help.`;
  }

  /**
   * Generates a response using Google Gemini API
   */
  async generateResponse({ message, context, history, enableWebSearch = false }: GenerateResponseParams): Promise<string> {
    try {
      let webSearchResults: string | undefined;

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
          console.log('Web search completed successfully');
        } catch (searchError) {
          console.error('Web search failed, continuing without it:', searchError);
          // Continue without web search results - graceful degradation
        }
      }

      // Construct the system prompt
      const systemPrompt = this.constructSystemPrompt(context, webSearchResults);

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
          maxOutputTokens: 500,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });

      // Send the user's message
      const result = await chat.sendMessage(message);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      return text;
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
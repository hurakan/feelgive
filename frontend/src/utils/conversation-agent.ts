import { Classification, Charity, ChatMessage, ChatContext } from '@/types';
import { getCauseLabel } from './classification';
import { sendChatMessageWithRetry } from './rag-api';

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  quickReplies?: string[];
  sources?: Array<{
    title: string;
    url: string;
  }>;
}

export interface ConversationContext {
  classification: Classification;
  matchedCharities: Charity[];
  articleSummary: string;
  articleText?: string; // Full article text for RAG context
  articleTitle?: string;
  articleUrl?: string; // Article URL for source attribution
}

export class ConversationAgent {
  private context: ConversationContext;
  private conversationHistory: Message[] = [];
  private ragHistory: ChatMessage[] = [];
  private enableWebSearch: boolean = false;

  constructor(context: ConversationContext, enableWebSearch: boolean = false) {
    this.context = context;
    this.enableWebSearch = enableWebSearch;
  }

  setWebSearchEnabled(enabled: boolean): void {
    this.enableWebSearch = enabled;
  }

  isWebSearchEnabled(): boolean {
    return this.enableWebSearch;
  }

  getGreeting(): Message {
    const { classification } = this.context;
    
    const greeting = `I've analyzed the article about ${getCauseLabel(classification.cause).toLowerCase()} in ${classification.geoName}. I can help you understand the situation and make an informed decision about how to help. What would you like to know?`;

    return {
      id: this.generateId(),
      role: 'agent',
      content: greeting,
      timestamp: Date.now(),
      quickReplies: [
        "What happened?",
        "How bad is it?",
        "Who needs help?",
        "How can I help?"
      ]
    };
  }

  async processMessage(userMessage: string): Promise<Message> {
    // Add user message to history
    this.conversationHistory.push({
      id: this.generateId(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    });

    try {
      // Prepare context for RAG API
      const chatContext: ChatContext = {
        articleTitle: this.context.articleTitle || this.context.classification.articleTitle || 'Crisis Article',
        articleText: this.context.articleText || this.context.articleSummary,
        articleSummary: this.context.articleSummary,
        articleUrl: this.context.articleUrl || this.context.classification.articleUrl,
        classification: {
          cause: this.context.classification.cause,
          geoName: this.context.classification.geoName,
          severity: this.context.classification.severityAssessment.level,
          identified_needs: this.context.classification.identified_needs,
          affectedGroups: this.context.classification.affectedGroups,
        },
        matchedCharities: this.context.matchedCharities.map(charity => ({
          name: charity.name,
          description: charity.description,
          trustScore: charity.trustScore,
        })),
      };

      // Call RAG API with web search option
      const response = await sendChatMessageWithRetry({
        message: userMessage,
        context: chatContext,
        history: this.ragHistory,
        enableWebSearch: this.enableWebSearch,
      });

      if (!response.success) {
        // Handle error with fallback message
        const errorMessage: Message = {
          id: this.generateId(),
          role: 'agent',
          content: this.getFallbackMessage('error' in response ? response.error : 'Unknown error'),
          timestamp: Date.now(),
          quickReplies: [
            "What happened?",
            "How bad is it?",
            "How can I help?"
          ]
        };
        
        this.conversationHistory.push(errorMessage);
        return errorMessage;
      }

      // Update RAG history for context continuity
      this.ragHistory.push(
        { role: 'user', content: userMessage },
        { role: 'model', content: response.data.message }
      );

      // Keep only last 10 messages to prevent token overflow
      if (this.ragHistory.length > 20) {
        this.ragHistory = this.ragHistory.slice(-20);
      }

      // Create response message with suggestions as quick replies and sources
      const agentMessage: Message = {
        id: this.generateId(),
        role: 'agent',
        content: response.data.message,
        timestamp: Date.now(),
        quickReplies: response.data.suggestions || [],
        sources: response.data.sources || []
      };

      this.conversationHistory.push(agentMessage);
      return agentMessage;

    } catch (error) {
      console.error('Error processing message:', error);
      
      // Fallback error message
      const errorMessage: Message = {
        id: this.generateId(),
        role: 'agent',
        content: "I'm having trouble connecting right now. However, I can tell you that the organizations we've matched are ready to help with this crisis. Would you like to proceed with a donation?",
        timestamp: Date.now(),
        quickReplies: [
          "Tell me about the organizations",
          "I'm ready to donate"
        ]
      };
      
      this.conversationHistory.push(errorMessage);
      return errorMessage;
    }
  }

  private getFallbackMessage(error: string): string {
    // Provide context-aware fallback messages based on error type
    if (error.includes('Too many requests') || error.includes('rate limit') || error.includes('quota')) {
      return "⏳ **Rate Limit Reached**\n\nI've reached my daily question limit. Please wait about 30 seconds and try again, or proceed directly to donation.\n\nThe organizations we've matched are verified and ready to help with this crisis.";
    }
    
    if (error.includes('temporarily unavailable') || error.includes('high demand')) {
      return "⏳ **Service Temporarily Busy**\n\nI'm experiencing high demand right now. Please wait a moment (about 30 seconds) and try your question again.\n\nIn the meantime, the organizations we've matched specialize in this type of crisis and are ready to help. Would you like to proceed with a donation?";
    }
    
    if (error.includes('connect')) {
      return "🔌 **Connection Issue**\n\nI'm having trouble connecting right now. However, the organizations we've matched are vetted and ready to help.\n\nWould you like to learn more about them or proceed with a donation?";
    }
    
    // Generic fallback
    return "⚠️ **Temporary Issue**\n\nI'm having a brief issue, but I'm here to help. The organizations we've matched are trusted and ready to assist with this crisis.\n\nWhat would you like to know?";
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getHistory(): Message[] {
    return this.conversationHistory;
  }

  // Method to update context if article text becomes available
  updateContext(updates: Partial<ConversationContext>): void {
    this.context = { ...this.context, ...updates };
  }
}
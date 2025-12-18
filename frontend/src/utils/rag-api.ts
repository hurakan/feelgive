/**
 * RAG API Client for Chat Functionality
 * Handles communication with the backend RAG endpoint
 */

import { ChatRequest, ChatResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

interface RagApiError {
  error: string;
  success: false;
}

interface RagApiSuccess {
  data: ChatResponse;
  success: true;
}

type RagApiResponse = RagApiSuccess | RagApiError;

/**
 * Send a chat message to the RAG backend
 * @param request - The chat request containing message, context, and history
 * @returns Promise with the chat response or error
 */
export async function sendChatMessage(request: ChatRequest): Promise<RagApiResponse> {
  try {
    const url = `${API_BASE_URL}/chat/message`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 429) {
        return {
          error: 'Too many requests. Please wait a moment and try again.',
          success: false,
        };
      }
      
      if (response.status === 503) {
        return {
          error: 'The chat service is temporarily unavailable. Please try again in a moment.',
          success: false,
        };
      }

      return {
        error: data.error || `Request failed with status ${response.status}`,
        success: false,
      };
    }

    return {
      data: data as ChatResponse,
      success: true,
    };
  } catch (error) {
    console.error('RAG API request failed:', error);
    
    // Network error or other unexpected error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        error: 'Unable to connect to the chat service. Please check your internet connection.',
        success: false,
      };
    }

    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      success: false,
    };
  }
}

/**
 * Check if the chat service is available
 * @returns Promise<boolean> indicating if the service is healthy
 */
export async function checkChatHealth(): Promise<boolean> {
  try {
    const url = `${API_BASE_URL}/chat/health`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Retry a failed request with exponential backoff
 * @param request - The chat request to retry
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns Promise with the chat response or error
 */
export async function sendChatMessageWithRetry(
  request: ChatRequest,
  maxRetries: number = 2
): Promise<RagApiResponse> {
  let lastError: RagApiError = {
    error: 'Failed to send message after multiple attempts',
    success: false,
  };
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await sendChatMessage(request);
    
    if (response.success) {
      return response;
    }
    
    // Type guard: we know response is RagApiError here
    const errorResponse = response as RagApiError;
    lastError = errorResponse;
    
    // Don't retry on rate limit or validation errors
    if (errorResponse.error.includes('Too many requests') ||
        errorResponse.error.includes('validation')) {
      break;
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return lastError;
}
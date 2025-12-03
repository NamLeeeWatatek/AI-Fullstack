/**
 * AI Models API
 * API client for AI provider management
 */

import { fetchAPI } from '../api'
import type {
  GetModelsResponse,
  GetDefaultModelResponse,
  ChatRequest,
  PostChatResponse,
  ChatWithHistoryRequest,
  PostChatWithHistoryResponse,
} from '../types/ai-models'

/**
 * Get all available AI models grouped by provider
 */
export async function getAIModels(): Promise<GetModelsResponse> {
  return fetchAPI('/ai-models/models')
}

/**
 * Get default AI model
 */
export async function getDefaultAIModel(): Promise<GetDefaultModelResponse> {
  return fetchAPI('/ai-models/models/default')
}

/**
 * Chat with AI model
 */
export async function chatWithAI(data: ChatRequest): Promise<PostChatResponse> {
  return fetchAPI('/ai-models/chat', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Chat with conversation history
 */
export async function chatWithAIHistory(data: ChatWithHistoryRequest): Promise<PostChatWithHistoryResponse> {
  return fetchAPI('/ai-models/chat/history', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

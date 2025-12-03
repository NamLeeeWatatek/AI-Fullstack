/**
 * Conversations API
 * API client for bot conversations and AI chat sessions
 */

import { fetchAPI } from '../api'
import type {
  // Bot Conversations
  GetConversationsResponse,
  GetConversationResponse,
  CreateConversationDto,
  CreateConversationResponse,
  GetMessagesResponse,
  CreateMessageDto,
  AddMessageResponse,
  // AI Conversations
  GetAiConversationsResponse,
  GetAiConversationResponse,
  CreateAiConversationDto,
  CreateAiConversationResponse,
  UpdateAiConversationDto,
  UpdateAiConversationResponse,
  DeleteAiConversationResponse,
  AddAiMessageDto,
  AddAiMessageResponse,
} from '../types/conversations'

// ============================================================================
// Bot Conversations (External users via channels)
// ============================================================================

/**
 * Get all bot conversations
 */
export async function getBotConversations(botId?: string): Promise<GetConversationsResponse> {
  const params = botId ? `?botId=${botId}` : ''
  return fetchAPI(`/conversations${params}`)
}

/**
 * Get conversation by ID
 */
export async function getBotConversation(id: string): Promise<GetConversationResponse> {
  return fetchAPI(`/conversations/${id}`)
}

/**
 * Create conversation
 */
export async function createBotConversation(data: CreateConversationDto): Promise<CreateConversationResponse> {
  return fetchAPI('/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Get messages in conversation
 */
export async function getBotConversationMessages(conversationId: string): Promise<GetMessagesResponse> {
  return fetchAPI(`/conversations/${conversationId}/messages`)
}

/**
 * Add message to conversation
 */
export async function addBotConversationMessage(conversationId: string, data: CreateMessageDto): Promise<AddMessageResponse> {
  return fetchAPI(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ============================================================================
// AI Conversations (Internal users - AI chat sessions)
// ============================================================================

/**
 * Get all AI conversations
 */
export async function getAIConversations(): Promise<GetAiConversationsResponse> {
  return fetchAPI('/ai-conversations')
}

/**
 * Get AI conversation by ID
 */
export async function getAIConversation(id: string): Promise<GetAiConversationResponse> {
  return fetchAPI(`/ai-conversations/${id}`)
}

/**
 * Create AI conversation
 */
export async function createAIConversation(data: CreateAiConversationDto): Promise<CreateAiConversationResponse> {
  return fetchAPI('/ai-conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update AI conversation
 */
export async function updateAIConversation(id: string, data: UpdateAiConversationDto): Promise<UpdateAiConversationResponse> {
  return fetchAPI(`/ai-conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * Delete AI conversation
 */
export async function deleteAIConversation(id: string): Promise<DeleteAiConversationResponse> {
  return fetchAPI(`/ai-conversations/${id}`, {
    method: 'DELETE',
  })
}

/**
 * Add message to AI conversation
 */
export async function addAIConversationMessage(id: string, data: AddAiMessageDto): Promise<AddAiMessageResponse> {
  return fetchAPI(`/ai-conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

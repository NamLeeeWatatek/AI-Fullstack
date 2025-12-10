/**
 * Node Management API
 * API calls for managing node types
 */
import { axiosClient } from '../axios-client'
import type { NodeType, NodeCategory, CreateNodeTypeDto, UpdateNodeTypeDto } from '../types/node'

/**
 * Fetch all node types
 */
export async function getNodeTypes(category?: string): Promise<NodeType[]> {
  const url = category ? `/node-types/?category=${category}` : '/node-types/'
  return axiosClient.get(url)
}

/**
 * Fetch single node type
 */
export async function getNodeType(id: string): Promise<NodeType> {
  return axiosClient.get(`/node-types/${id}`)
}

/**
 * Create new node type
 */
export async function createNodeType(data: CreateNodeTypeDto): Promise<NodeType> {
  return axiosClient.post('/node-types/', data)
}

/**
 * Update node type using PATCH
 */
export async function updateNodeType(id: string, data: UpdateNodeTypeDto): Promise<NodeType> {
  return axiosClient.patch(`/node-types/${id}`, data)
}

/**
 * Delete node type
 */
export async function deleteNodeType(id: string): Promise<void> {
  await axiosClient.delete(`/node-types/${id}`)
}

/**
 * Fetch node categories
 */
export async function getNodeCategories(): Promise<NodeCategory[]> {
  return axiosClient.get('/node-types/categories')
}


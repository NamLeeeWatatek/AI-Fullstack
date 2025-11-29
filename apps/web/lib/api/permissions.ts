/**
 * Permissions API Client
 */
import axiosClient from '@/lib/axios-client'
import type {
  UserCapabilities,
  PermissionCheckRequest,
  PermissionCheckResponse,
  WidgetConfig,
  RoleInfo,
  ResourcePermissions,
  ResourceType
} from '@/lib/types/permissions'

export const permissionsApi = {
  /**
   * Get current user's capabilities and permissions
   */
  getMyCapabilities: async (): Promise<UserCapabilities> => {
    return axiosClient.get('/permissions/me/capabilities')
  },

  /**
   * Check if user has specific permissions
   */
  checkPermissions: async (permissions: string[]): Promise<PermissionCheckResponse> => {
    return axiosClient.post('/permissions/check', { permissions })
  },

  /**
   * Get all available roles (admin only)
   */
  getAllRoles: async (): Promise<RoleInfo[]> => {
    // TODO: Implement backend endpoint
    return Promise.resolve([
      { id: 'admin', name: 'Admin', description: 'Full access' },
      { id: 'user', name: 'User', description: 'Standard user' },
    ] as RoleInfo[])
    // return axiosClient.get('/permissions/roles')
  },

  /**
   * Get available widgets for current user
   */
  getAvailableWidgets: async (): Promise<WidgetConfig[]> => {
    // TODO: Implement backend endpoint
    return Promise.resolve([] as WidgetConfig[])
    // return axiosClient.get('/permissions/widgets')
  },

  /**
   * Get permissions for a specific resource type
   */
  getResourcePermissions: async (resourceType: ResourceType): Promise<ResourcePermissions> => {
    // TODO: Implement backend endpoint
    return Promise.resolve({
      resourceType,
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: false,
    } as ResourcePermissions)
    // return axiosClient.get(`/permissions/resources/${resourceType}`)
  }
}

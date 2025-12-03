
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import {
  setCurrentWorkspace,
  setWorkspaces,
  switchWorkspace,
  addWorkspace,
  updateWorkspace,
  removeWorkspace,
  setLoading,
  setError,
} from '@/lib/store/slices/workspaceSlice';
import { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto } from '@/lib/types/workspace';
import { useAuth } from './useAuth';
import { useCallback, useEffect } from 'react';
import { axiosClient } from '@/lib/axios-client';

export function useWorkspace() {
  const dispatch = useAppDispatch();
  const { accessToken } = useAuth();

  const currentWorkspace = useAppSelector((state) => state.workspace.currentWorkspace);
  const workspaces = useAppSelector((state) => state.workspace.workspaces);
  const isLoading = useAppSelector((state) => state.workspace.isLoading);
  const error = useAppSelector((state) => state.workspace.error);




  const fetchWorkspaces = useCallback(async () => {
    if (!accessToken) return;

    try {
      dispatch(setLoading(true));
      const response = await axiosClient.get('/workspaces', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      dispatch(setWorkspaces(response.data));
      dispatch(setError(null));
    } catch (err: any) {

      dispatch(setError(err.message || 'Failed to fetch workspaces'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [accessToken, dispatch]);


  const fetchCurrentWorkspace = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await axiosClient.get('/workspaces/current', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      dispatch(setCurrentWorkspace(response.data));
    } catch (err: any) {

    }
  }, [accessToken, dispatch]);


  const createWorkspace = useCallback(async (data: CreateWorkspaceDto) => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      dispatch(setLoading(true));
      const response = await axiosClient.post('/workspaces', data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      dispatch(addWorkspace(response.data));
      dispatch(setError(null));
      return response.data;
    } catch (err: any) {

      dispatch(setError(err.message || 'Failed to create workspace'));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [accessToken, dispatch]);


  const updateWorkspaceData = useCallback(async (id: string, data: UpdateWorkspaceDto) => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      dispatch(setLoading(true));
      const response = await axiosClient.patch(`/workspaces/${id}`, data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      dispatch(updateWorkspace(response.data));
      dispatch(setError(null));
      return response.data;
    } catch (err: any) {

      dispatch(setError(err.message || 'Failed to update workspace'));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [accessToken, dispatch]);


  const deleteWorkspace = useCallback(async (id: string) => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      dispatch(setLoading(true));
      await axiosClient.delete(`/workspaces/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      dispatch(removeWorkspace(id));
      dispatch(setError(null));
    } catch (err: any) {

      dispatch(setError(err.message || 'Failed to delete workspace'));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [accessToken, dispatch]);


  const switchToWorkspace = useCallback((workspaceId: string) => {
    dispatch(switchWorkspace(workspaceId));
  }, [dispatch]);


  useEffect(() => {
    if (typeof window !== 'undefined' && workspaces.length > 0 && !currentWorkspace) {
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
      if (savedWorkspaceId) {
        const workspace = workspaces.find(w => w.id === savedWorkspaceId);
        if (workspace) {
          dispatch(setCurrentWorkspace(workspace));
        }
      }
    }
  }, [workspaces, currentWorkspace, dispatch]);

  return {
    currentWorkspace,
    workspaces,
    isLoading,
    error,
    fetchWorkspaces,
    fetchCurrentWorkspace,
    createWorkspace,
    updateWorkspace: updateWorkspaceData,
    deleteWorkspace,
    switchWorkspace: switchToWorkspace,
  };
}

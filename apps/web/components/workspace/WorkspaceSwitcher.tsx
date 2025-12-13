'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/lib/hooks/use-workspace'
import { useSession } from 'next-auth/react'
import axiosClient from '@/lib/axios-client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import { FiPlus } from 'react-icons/fi'

interface Workspace {
  id: string
  name: string
  slug: string
  plan: string
}

export function WorkspaceSwitcher() {
  const { data: session } = useSession()
  const workspace = useWorkspace()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)

  // Safe access to workspace context
  const currentWorkspaceId = workspace?.currentWorkspaceId || null
  const setCurrentWorkspaceId = workspace?.setCurrentWorkspaceId || (() => { })

  useEffect(() => {
    // Only fetch once
    if (hasFetched) {
      setLoading(false)
      return
    }

    let isMounted = true

    async function fetchWorkspaces() {
      // If no session yet, wait
      if (!session) {
        return
      }

      // If no accessToken, use session workspace
      if (!session?.accessToken) {
        if (isMounted) {
          setHasFetched(true)
          setLoading(false)
          // Set default workspace from session if available
          if (session?.workspace) {
            setWorkspaces([session.workspace])
          }
        }
        return
      }

      setHasFetched(true)

      try {
        const response = await axiosClient.get('/workspaces')
        if (isMounted) {
          const fetchedWorkspaces = response || []
          setWorkspaces(fetchedWorkspaces)

          // If no workspaces from API but session has workspace, use it
          if (fetchedWorkspaces.length === 0 && session?.workspace) {
            setWorkspaces([session.workspace])
          }
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error)
        // Fallback to session workspaces
        if (isMounted) {
          if (session?.workspaces && session.workspaces.length > 0) {
            setWorkspaces(session.workspaces)
          } else if (session?.workspace) {
            setWorkspaces([session.workspace])
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchWorkspaces()

    return () => {
      isMounted = false
    }
  }, [session, hasFetched])

  const handleWorkspaceChange = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId)
  }

  // Get workspace name from session or workspaces
  const getCurrentWorkspace = () => {
    if (workspaces.length > 0) {
      return workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0]
    }
    if (session?.workspace) {
      return session.workspace
    }
    return { name: 'My Workspace', plan: 'Free', id: 'default', slug: 'default' }
  }

  const currentWorkspace = getCurrentWorkspace()

  // Helper to get initials
  const getInitials = (name: string) => {
    return name?.substring(0, 1).toUpperCase() || 'W'
  }

  if (loading) {
    return (
      <div className="flex w-full items-center gap-2 rounded-xl border border-border/50 bg-muted/50 p-2">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-muted-foreground/20" />
        <div className="space-y-1">
          <div className="h-3 w-20 animate-pulse rounded bg-muted-foreground/20" />
          <div className="h-2 w-12 animate-pulse rounded bg-muted-foreground/20" />
        </div>
      </div>
    )
  }

  // Common render for the workspace card content
  const renderWorkspaceDisplay = (ws: Partial<Workspace>, isTrigger = false) => (
    <div className="flex items-center gap-3 text-left">
      <div className={cn(
        "flex aspect-square items-center justify-center rounded-lg border border-white/10 shadow-inner",
        isTrigger ? "size-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" : "size-8 border bg-background"
      )}>
        <span className={cn("font-bold", isTrigger ? "text-white" : "text-foreground")}>
          {getInitials(ws.name || '')}
        </span>
      </div>
      <div className="grid flex-1 gap-0.5 leading-none">
        <span className="truncate font-semibold tracking-tight">
          {ws.name}
        </span>
        <span className="truncate text-xs font-medium text-muted-foreground/80">
          {ws.plan || 'Free'} Plan
        </span>
      </div>
    </div>
  )

  // Show current workspace name if user only has one workspace
  if (workspaces.length === 1) {
    return (
      <div className="w-full rounded-xl border border-border/40 bg-card/50 p-2 shadow-sm backdrop-blur-sm transition-all hover:bg-card/80 hover:shadow-md">
        {renderWorkspaceDisplay(workspaces[0], true)}
      </div>
    )
  }

  return (
    <Select value={currentWorkspaceId || undefined} onValueChange={handleWorkspaceChange}>
      <SelectTrigger
        className={cn(
          "h-14 w-full rounded-xl border-border/40 bg-card/50 p-2 shadow-sm backdrop-blur-sm hover:bg-card/80 hover:shadow-md focus:ring-0 data-[state=open]:bg-card"
        )}
      >
        {renderWorkspaceDisplay(currentWorkspace, true)}
      </SelectTrigger>
      <SelectContent
        className="w-[--radix-select-trigger-width] min-w-56 rounded-xl border-border/50 bg-popover/95 p-1 backdrop-blur-xl"
        align="start"
      >
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Select Workspace
        </div>
        {workspaces.map((ws) => (
          <SelectItem
            key={ws.id}
            value={ws.id}
            className="rounded-lg p-2 focus:bg-accent focus:text-accent-foreground data-[state=checked]:bg-accent/50"
          >
            {renderWorkspaceDisplay(ws, false)}
          </SelectItem>
        ))}

        {/* Optional: Add New Workspace Action */}
        <div className="mt-1 border-t border-border/50 pt-1">
          <button
            className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg p-2 text-sm text-muted-foreground opacity-50 hover:bg-accent hover:text-foreground"
            disabled
          >
            <div className="flex size-8 items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-background">
              <FiPlus className="size-4" />
            </div>
            <span className="font-medium">Create Workspace</span>
            <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground/50">Soon</span>
          </button>
        </div>
      </SelectContent>
    </Select>
  )
}


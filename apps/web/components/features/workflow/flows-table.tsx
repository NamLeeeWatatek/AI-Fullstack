'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FiPlay,
  FiEdit,
  FiCopy,
  FiArchive,
  FiTrash2,
  FiMoreVertical,
} from 'react-icons/fi'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppDispatch } from '@/lib/store/hooks'
import { updateFlow, deleteFlow, duplicateFlow, archiveFlow } from '@/lib/store/slices/flowsSlice'
import toast from 'react-hot-toast'

interface Flow {
  id: number
  name: string
  description?: string
  status: string
  updated_at?: string
  version?: number
  executions?: number
  successRate?: number
}

interface FlowsTableProps {
  flows: Flow[]
  onUpdate: () => void
  onRun: (flowId: number) => void
}

export function FlowsTable({ flows, onUpdate, onRun }: FlowsTableProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const isAllSelected = flows.length > 0 && selectedIds.length === flows.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < flows.length

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(flows.map(f => f.id))
    }
  }

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return

    toast((t) => (
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-semibold">Delete {selectedIds.length} workflow(s)?</p>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => toast.dismiss(t.id)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-red-500 hover:bg-red-600"
            onClick={async () => {
              toast.dismiss(t.id)
              const promises = selectedIds.map(id => dispatch(deleteFlow(id)).unwrap())
              
              toast.promise(Promise.all(promises), {
                loading: `Deleting ${selectedIds.length} workflow(s)...`,
                success: () => {
                  setSelectedIds([])
                  onUpdate()
                  return `${selectedIds.length} workflow(s) deleted!`
                },
                error: 'Failed to delete some workflows'
              })
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    ), { duration: Infinity })
  }

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return

    const promises = selectedIds.map(id => dispatch(archiveFlow(id)).unwrap())
    
    toast.promise(Promise.all(promises), {
      loading: `Archiving ${selectedIds.length} workflow(s)...`,
      success: () => {
        setSelectedIds([])
        onUpdate()
        return `${selectedIds.length} workflow(s) archived!`
      },
      error: 'Failed to archive some workflows'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success'
      case 'draft': return 'warning'
      case 'archived': return 'default'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkArchive}
          >
            <FiArchive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkDelete}
            className="text-red-500 hover:text-red-600"
          >
            <FiTrash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected
                  }}
                  onChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Executions</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flows.map((flow) => (
              <TableRow
                key={flow.id}
                data-state={selectedIds.includes(flow.id) ? 'selected' : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(flow.id)}
                    onChange={() => handleSelectOne(flow.id)}
                  />
                </TableCell>
                <TableCell>
                  <Link href={`/flows/${flow.id}`} className="block hover:underline">
                    <div className="font-medium">{flow.name}</div>
                    {flow.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {flow.description}
                      </div>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(flow.status) as any} className="capitalize">
                    {flow.status}
                  </Badge>
                </TableCell>
                <TableCell>{flow.executions || 0}</TableCell>
                <TableCell>
                  <span className="text-green-500">{flow.successRate || 0}%</span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {flow.updated_at ? new Date(flow.updated_at).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRun(flow.id)}
                    >
                      <FiPlay className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <FiMoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/flows/${flow.id}/edit`)}>
                          <FiEdit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              const dup = await dispatch(duplicateFlow(flow.id)).unwrap()
                              toast.success('Flow duplicated!')
                              router.push(`/flows/${dup.id}/edit`)
                            } catch {
                              toast.error('Failed to duplicate')
                            }
                          }}
                        >
                          <FiCopy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              await dispatch(archiveFlow(flow.id)).unwrap()
                              toast.success('Flow archived!')
                              onUpdate()
                            } catch {
                              toast.error('Failed to archive')
                            }
                          }}
                        >
                          <FiArchive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            toast((t) => (
                              <div className="flex flex-col gap-3">
                                <div>
                                  <p className="font-semibold">Delete "{flow.name}"?</p>
                                  <p className="text-sm text-muted-foreground">
                                    This action cannot be undone.
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => toast.dismiss(t.id)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={async () => {
                                      toast.dismiss(t.id)
                                      try {
                                        await dispatch(deleteFlow(flow.id)).unwrap()
                                        toast.success('Flow deleted!')
                                        onUpdate()
                                      } catch {
                                        toast.error('Failed to delete')
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ), { duration: Infinity })
                          }}
                          className="text-destructive"
                        >
                          <FiTrash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

import { FiChevronRight, FiHome } from 'react-icons/fi'
import { cn } from '@/lib/utils'

interface Breadcrumb {
    id: string | null
    name: string
}

interface KBBreadcrumbsProps {
    rootName: string
    breadcrumbs: Breadcrumb[]
    onNavigate: (index: number) => void
    onDrop?: (folderId: string | null) => void
    dragOverId?: string | null
}

export function KBBreadcrumbs({ 
    rootName, 
    breadcrumbs, 
    onNavigate,
    onDrop,
    dragOverId,
}: KBBreadcrumbsProps) {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    return (
        <div className="flex items-center gap-2 mb-4 text-sm flex-wrap">
            <button
                onClick={() => onNavigate(-1)}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                    e.preventDefault()
                    onDrop?.(null)
                }}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all",
                    "text-muted-foreground hover:text-foreground hover:bg-muted",
                    dragOverId === null && "bg-primary/10 ring-2 ring-primary"
                )}
            >
                <FiHome className="w-4 h-4" />
                {rootName}
            </button>
            {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id || index} className="flex items-center gap-2">
                    <FiChevronRight className="w-4 h-4 text-muted-foreground" />
                    <button
                        onClick={() => onNavigate(index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                            e.preventDefault()
                            onDrop?.(crumb.id)
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-md transition-all",
                            "text-muted-foreground hover:text-foreground hover:bg-muted",
                            dragOverId === crumb.id && "bg-primary/10 ring-2 ring-primary"
                        )}
                    >
                        {crumb.name}
                    </button>
                </div>
            ))}
        </div>
    )
}


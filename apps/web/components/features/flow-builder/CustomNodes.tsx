import { Handle, Position } from 'reactflow'

interface CustomNodeProps {
    data: {
        label: string
        description?: string
    }
    type: string
}

export function CustomNode({ data }: CustomNodeProps) {
    return (
        <div className="glass px-4 py-3 rounded-lg border border-border/40 min-w-[150px] shadow-sm hover:shadow-md transition-shadow">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary border-2 border-background" />

            <div>
                <p className="text-sm font-medium">{data.label}</p>
                {data.description && (
                    <p className="text-[10px] text-muted-foreground">{data.description}</p>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary border-2 border-background" />
        </div>
    )
}


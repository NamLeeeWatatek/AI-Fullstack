import { Card } from '@/components/ui/Card'
import { FiFile, FiDatabase, FiCpu, FiSettings } from 'react-icons/fi'
import type { KnowledgeBaseStats } from '@/lib/types/knowledge-base'

interface KBStatsCardsProps {
    stats: KnowledgeBaseStats
}

export function KBStatsCards({ stats }: KBStatsCardsProps) {
    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
                <div className="flex items-center gap-3">
                    <FiFile className="w-5 h-5 text-blue-500" />
                    <div>
                        <p className="text-sm text-muted-foreground">Documents</p>
                        <p className="text-xl font-bold">{stats.totalDocuments}</p>
                    </div>
                </div>
            </Card>
            <Card className="p-4">
                <div className="flex items-center gap-3">
                    <FiDatabase className="w-5 h-5 text-green-500" />
                    <div>
                        <p className="text-sm text-muted-foreground">Total Size</p>
                        <p className="text-xl font-bold">{stats.totalSize}</p>
                    </div>
                </div>
            </Card>
            <Card className="p-4">
                <div className="flex items-center gap-3">
                    <FiCpu className="w-5 h-5 text-purple-500" />
                    <div>
                        <p className="text-sm text-muted-foreground">Embedding Model</p>
                        <p className="text-sm font-medium truncate">{stats.embeddingModel}</p>
                    </div>
                </div>
            </Card>
            <Card className="p-4">
                <div className="flex items-center gap-3">
                    <FiSettings className="w-5 h-5 text-orange-500" />
                    <div>
                        <p className="text-sm text-muted-foreground">Chunk Size</p>
                        <p className="text-xl font-bold">{stats.chunkSize}</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}


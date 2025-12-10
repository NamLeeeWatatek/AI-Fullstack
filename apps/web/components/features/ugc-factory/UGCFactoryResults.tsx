'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'

interface UGCFactoryResultsProps {
    status: 'idle' | 'running' | 'completed' | 'failed'
    executionId: string | null
    result: any
    error: string | null
    flowId?: string
    onStartNew: () => void
}

const UGCFactoryResults = React.memo<UGCFactoryResultsProps>(({
    status,
    executionId,
    result,
    error,
    flowId,
    onStartNew
}) => {
    const router = useRouter()

    if (status === 'idle' || status === 'running') {
        return null
    }

    if (status === 'completed') {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        âœ“ Execution Completed!
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-200">
                        Execution ID: {executionId}
                    </p>
                </div>

                <Card className="p-4">
                    <h3 className="font-semibold mb-3">Result</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm max-h-96">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </Card>

                <div className="flex gap-2">
                    <Button onClick={onStartNew}>
                        Start New
                    </Button>
                    {flowId && (
                        <Button variant="outline" onClick={() => router.push(`/flows/${flowId}`)}>
                            View Flow Details
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    if (status === 'failed') {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        âœ— Execution Failed
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-200">
                        {error || 'An error occurred during execution'}
                    </p>
                    {executionId && (
                        <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                            Execution ID: {executionId}
                        </p>
                    )}
                </div>

                <Button onClick={onStartNew}>
                    Try Again
                </Button>
            </div>
        )
    }

    return null
})

UGCFactoryResults.displayName = 'UGCFactoryResults'

export { UGCFactoryResults }

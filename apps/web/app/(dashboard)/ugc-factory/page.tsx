'use client'

import { useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import type { RootState } from '@/lib/store/index'
import { fetchFlows } from '@/lib/store/slices/flowsSlice'
import { useRouter } from 'next/navigation'
import { UGCFactoryFlowGrid } from '@/components/features/ugc-factory/UGCFactoryFlowGrid'

// Inline selector for flows state
const selectFlows = (state: RootState) => state.flows.items
const selectFlowLoading = (state: RootState) => state.flows.loading

export default function UGCFactoryPage() {
    const dispatch = useAppDispatch()
    const router = useRouter()

    // Redux state
    const allFlows = useAppSelector(selectFlows)
    const flowLoading = useAppSelector(selectFlowLoading)

    useEffect(() => {
        dispatch(fetchFlows({}))
    }, [dispatch])

    // Debug logging
    useEffect(() => {
        console.log('All Flows:', allFlows)
        console.log('All Flows length:', allFlows.length)
        console.log('Loading state:', flowLoading)
    }, [allFlows, flowLoading])

    const handleFlowSelect = (flowId: string) => {
        // Navigate to individual flow page
        router.push(`/ugc-factory/${flowId}`)
    }

    if (flowLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spinner className="w-8 h-8" />
            </div>
        )
    }

    return (
        <div className="h-full p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">UGC Factory</h1>
                    <p className="text-muted-foreground">
                        Create content using AI-powered workflows
                    </p>
                </div>

                {allFlows.length === 0 ? (
                    <Card className="p-8 text-center">
                        <CardTitle className="mb-2">No Flows Available</CardTitle>
                        <CardDescription>
                            Create your first workflow to get started.
                        </CardDescription>
                    </Card>
                ) : (
                    <UGCFactoryFlowGrid
                        flows={allFlows}
                        onFlowSelect={handleFlowSelect}
                    />
                )}
            </div>
        </div>
    )
}


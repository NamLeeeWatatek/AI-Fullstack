'use client';

import { useState } from 'react';
import { Plus, History, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WidgetVersionsList } from '@/components/widget/widget-versions-list';
import { WidgetDeploymentHistory } from '@/components/widget/widget-deployment-history';
import { WidgetEmbedCode } from '@/components/widget/widget-embed-code';
import { CreateVersionDialog } from '@/components/widget/create-version-dialog';
import { useWidgetVersions, useWidgetDeployments } from '@/lib/hooks/use-widget-versions';

export default function WidgetPage({ params }: { params: { id: string } }) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const { versions, isLoading: versionsLoading, mutate: mutateVersions } = useWidgetVersions(params.id);
    const { deployments, isLoading: deploymentsLoading } = useWidgetDeployments(params.id);

    // Get active version
    const activeVersion = versions?.find(v => v.isActive && v.status === 'published');

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Widget Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage widget versions and deployments
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Version
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="embed" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="embed">
                        <Code className="w-4 h-4 mr-2" />
                        Embed Code
                    </TabsTrigger>
                    <TabsTrigger value="versions">Versions</TabsTrigger>
                    <TabsTrigger value="history">
                        <History className="w-4 h-4 mr-2" />
                        Deployment History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="embed" className="space-y-4">
                    <WidgetEmbedCode
                        botId={params.id}
                        activeVersion={activeVersion}
                    />
                </TabsContent>

                <TabsContent value="versions" className="space-y-4">
                    <WidgetVersionsList
                        botId={params.id}
                        versions={versions}
                        isLoading={versionsLoading}
                        onRefresh={mutateVersions}
                    />
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <WidgetDeploymentHistory
                        deployments={deployments}
                        isLoading={deploymentsLoading}
                    />
                </TabsContent>
            </Tabs>

            {/* Create Version Dialog */}
            <CreateVersionDialog
                botId={params.id}
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={() => {
                    mutateVersions();
                    setShowCreateDialog(false);
                }}
            />
        </div>
    );
}

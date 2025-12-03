'use client';

import { useState } from 'react';
import { Copy, Check, Code, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Props {
    botId: string;
    activeVersion?: {
        id: string;
        version: string;
        cdnUrl?: string;
    };
}

export function WidgetEmbedCode({ botId, activeVersion }: Props) {
    const [copiedScript, setCopiedScript] = useState(false);
    const [copiedReact, setCopiedReact] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const widgetUrl = `${baseUrl}/widget/${botId}`;

    // Script embed code
    const scriptCode = `<!-- Chat Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ChatWidget']=o;w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments) };
    js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = o; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', 'cw', '${widgetUrl}/widget.js'));
  cw('init', { botId: '${botId}' });
</script>`;

    // React component code
    const reactCode = `import { ChatWidget } from '@your-package/chat-widget';

function App() {
  return (
    <div>
      <ChatWidget 
        botId="${botId}"
        position="bottom-right"
      />
    </div>
  );
}`;

    // iframe embed code
    const iframeCode = `<iframe
  src="${widgetUrl}"
  width="400"
  height="600"
  frameborder="0"
  allow="microphone"
  style="border: none; border-radius: 8px;"
></iframe>`;

    const copyToClipboard = async (text: string, type: 'script' | 'react' | 'iframe') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'script') {
                setCopiedScript(true);
                setTimeout(() => setCopiedScript(false), 2000);
            } else if (type === 'react') {
                setCopiedReact(true);
                setTimeout(() => setCopiedReact(false), 2000);
            }
            toast.success('Copied to clipboard!');
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    if (!activeVersion) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Embed Code</CardTitle>
                    <CardDescription>
                        No active version published yet. Publish a version to get the embed code.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Active Version Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code className="w-5 h-5" />
                        Embed Your Chat Widget
                    </CardTitle>
                    <CardDescription>
                        Active Version: <span className="font-semibold">{activeVersion.version}</span>
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Embed Options */}
            <Tabs defaultValue="script" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="script">Script Tag</TabsTrigger>
                    <TabsTrigger value="react">React Component</TabsTrigger>
                    <TabsTrigger value="iframe">iFrame</TabsTrigger>
                </TabsList>

                {/* Script Tag */}
                <TabsContent value="script" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">HTML Script Tag</CardTitle>
                            <CardDescription>
                                Add this code before the closing &lt;/body&gt; tag of your website
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                    <code>{scriptCode}</code>
                                </pre>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyToClipboard(scriptCode, 'script')}
                                >
                                    {copiedScript ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    <strong>Note:</strong> The widget will appear as a floating chat button on the bottom-right corner of your website.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* React Component */}
                <TabsContent value="react" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">React Component</CardTitle>
                            <CardDescription>
                                Use this if you're building a React application
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                    <code>{reactCode}</code>
                                </pre>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyToClipboard(reactCode, 'react')}
                                >
                                    {copiedReact ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                                <p className="text-sm text-amber-900 dark:text-amber-100">
                                    <strong>Coming Soon:</strong> React package is under development. Use the Script Tag method for now.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* iFrame */}
                <TabsContent value="iframe" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">iFrame Embed</CardTitle>
                            <CardDescription>
                                Embed the chat widget as an iframe in your page
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                    <code>{iframeCode}</code>
                                </pre>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyToClipboard(iframeCode, 'iframe')}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Note:</strong> You can customize the width, height, and styling of the iframe to fit your needs.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Test Widget */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Test Your Widget</CardTitle>
                    <CardDescription>
                        Open the widget in a new tab to test it
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        onClick={() => window.open(widgetUrl, '_blank')}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Widget Preview
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

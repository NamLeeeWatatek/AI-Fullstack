import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Spinner } from '@/components/ui/Spinner'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { FiGlobe, FiFileText, FiAlertCircle } from 'react-icons/fi'
import { toast } from 'sonner'
import { axiosClient } from '@/lib/axios-client'
import { handleFormError } from '@/lib/utils/form-errors'

const websiteFormSchema = z.object({
    url: z.string().url('Please enter a valid URL'),
    maxPages: z.number().min(1).max(500),
    maxDepth: z.number().min(1).max(10),
    followLinks: z.boolean(),
})

const sitemapFormSchema = z.object({
    sitemapUrl: z.string().url('Please enter a valid sitemap URL'),
    maxPages: z.number().min(1).max(1000),
})

interface CrawlerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    knowledgeBaseId: string
    onSuccess?: () => void
}

export function KBCrawlerDialog({
    open,
    onOpenChange,
    knowledgeBaseId,
    onSuccess
}: CrawlerDialogProps) {
    const [loading, setLoading] = useState(false)

    const websiteForm = useForm<z.infer<typeof websiteFormSchema>>({
        resolver: zodResolver(websiteFormSchema),
        defaultValues: {
            url: '',
            maxPages: 50,
            maxDepth: 3,
            followLinks: true,
        },
    })

    const sitemapForm = useForm<z.infer<typeof sitemapFormSchema>>({
        resolver: zodResolver(sitemapFormSchema),
        defaultValues: {
            sitemapUrl: '',
            maxPages: 100,
        },
    })

    const handleCrawlWebsite = async (values: z.infer<typeof websiteFormSchema>) => {
        setLoading(true)
        try {
            const result = await axiosClient.post('/knowledge-bases/crawl/website', {
                ...values,
                knowledgeBaseId,
            })

            toast.success(`Crawled ${result.documentsCreated} pages successfully!`)

            if (result.errors?.length > 0) {
                toast.warning(`${result.errors.length} pages failed to crawl`)
            }

            websiteForm.reset()
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            handleFormError(error, websiteForm)
        } finally {
            setLoading(false)
        }
    }

    const handleCrawlSitemap = async (values: z.infer<typeof sitemapFormSchema>) => {
        setLoading(true)
        try {
            const result = await axiosClient.post('/knowledge-bases/crawl/sitemap', {
                ...values,
                knowledgeBaseId,
            })

            toast.success(`Crawled ${result.documentsCreated} pages from sitemap!`)

            if (result.errors?.length > 0) {
                toast.warning(`${result.errors.length} pages failed to crawl`)
            }

            sitemapForm.reset()
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            handleFormError(error, sitemapForm)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Crawl Website</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="website" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="website">
                            <FiGlobe className="w-4 h-4 mr-2" />
                            Website
                        </TabsTrigger>
                        <TabsTrigger value="sitemap">
                            <FiFileText className="w-4 h-4 mr-2" />
                            Sitemap
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="website" className="space-y-4">
                        <Form {...websiteForm}>
                            <form onSubmit={websiteForm.handleSubmit(handleCrawlWebsite)} className="space-y-4">
                                {websiteForm.formState.errors.root && (
                                    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-sm text-destructive">
                                        <span className="font-medium">Error:</span>
                                        {websiteForm.formState.errors.root.message}
                                    </div>
                                )}
                                <FormField
                                    control={websiteForm.control}
                                    name="url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={websiteForm.control}
                                        name="maxPages"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Max Pages</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={websiteForm.control}
                                        name="maxDepth"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Max Depth</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={websiteForm.control}
                                    name="followLinks"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel>Follow Links</FormLabel>
                                                <FormDescription>
                                                    Automatically crawl linked pages
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                    <FiAlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                    <p className="text-xs text-muted-foreground">
                                        The crawler will start from the URL and follow links within the same domain.
                                        This may take several minutes depending on the number of pages.
                                    </p>
                                </div>

                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? (
                                        <>
                                            <Spinner className="w-4 h-4 mr-2" />
                                            Crawling...
                                        </>
                                    ) : (
                                        'Start Crawling'
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="sitemap" className="space-y-4">
                        <Form {...sitemapForm}>
                            <form onSubmit={sitemapForm.handleSubmit(handleCrawlSitemap)} className="space-y-4">
                                {sitemapForm.formState.errors.root && (
                                    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-sm text-destructive">
                                        <span className="font-medium">Error:</span>
                                        {sitemapForm.formState.errors.root.message}
                                    </div>
                                )}
                                <FormField
                                    control={sitemapForm.control}
                                    name="sitemapUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sitemap URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://example.com/sitemap.xml" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={sitemapForm.control}
                                    name="maxPages"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Max Pages</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Maximum number of pages to crawl from sitemap
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                    <FiAlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                    <p className="text-xs text-muted-foreground">
                                        The crawler will fetch all URLs from the sitemap and crawl them.
                                        This is faster than website crawling but requires a valid sitemap.xml file.
                                    </p>
                                </div>

                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? (
                                        <>
                                            <Spinner className="w-4 h-4 mr-2" />
                                            Crawling...
                                        </>
                                    ) : (
                                        'Crawl from Sitemap'
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}


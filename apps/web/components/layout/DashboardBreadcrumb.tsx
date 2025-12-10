'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb'
import {
    FiLayout,
    FiGitMerge,
    FiGrid,
    FiRadio,
    FiSettings,
    FiDatabase,
    FiHome,
} from 'react-icons/fi'
import { RiRobot2Line } from "react-icons/ri"
import { TiMessages } from "react-icons/ti"
import { IconType } from 'react-icons'

interface NavigationItem {
    name: string
    href?: string
    icon: IconType
    children?: Array<{
        name: string
        href: string
    }>
}

const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: FiLayout },
    { name: 'UGC Factory', href: '/ugc-factory', icon: FiGrid },
    { name: 'Conversations', href: '/conversations', icon: FiGrid },
    {
        name: 'Workflows',
        icon: FiGitMerge,
        children: [
            { name: 'All Workflows', href: '/flows' },
            { name: 'Create New', href: '/flows/new?mode=edit' }
        ]
    },
    { name: 'Channels', href: '/channels', icon: FiRadio },
    { name: 'Knowledge Base', href: '/knowledge-base/collections', icon: FiDatabase },
    { name: 'Bots', href: '/bots', icon: RiRobot2Line },
    { name: 'Chat AI', href: '/chat', icon: TiMessages },
    { name: 'Settings', href: '/settings', icon: FiSettings },
]

export const DashboardBreadcrumb = React.memo(() => {
    const pathname = usePathname()

    const breadcrumbItems = useMemo(() => {
        if (pathname === '/dashboard') {
            return null // No breadcrumb for dashboard
        }

        const currentPage = navigation.find(item => item.href === pathname)
        const parentWithChild = navigation.find(item =>
            item.children?.some(child => child.href === pathname)
        )
        const currentChild = parentWithChild?.children?.find(child => child.href === pathname)

        if (currentChild && parentWithChild) {
            return (
                <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="#" className="flex items-center gap-2">
                                <parentWithChild.icon className="w-4 h-4" />
                                <span>{parentWithChild.name}</span>
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="flex items-center gap-2">
                            {currentChild.name}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </>
            )
        }

        if (currentPage) {
            return (
                <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="flex items-center gap-2">
                            <currentPage.icon className="w-4 h-4" />
                            <span>{currentPage.name}</span>
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </>
            )
        }

        // Handle dynamic routes (edit/new pages)
        const pathSegments = pathname.split('/').filter(Boolean)

        if (pathSegments.length > 1) {
            const baseSegment = pathSegments[0]
            const basePage = navigation.find(item =>
                item.href?.includes(`/${baseSegment}`) ||
                item.children?.some(child => child.href?.includes(`/${baseSegment}`))
            )

            if (basePage) {
                const isEdit = pathSegments.includes('edit')
                const isNew = pathSegments.includes('new')
                const actionText = isEdit ? 'Edit' : isNew ? 'Create New' : 'View'

                return (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={basePage.href || `/${baseSegment}`} className="flex items-center gap-2">
                                    <basePage.icon className="w-4 h-4" />
                                    <span>{basePage.name}</span>
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="flex items-center gap-2">
                                {actionText}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                )
            }
        }

        // Fallback for unknown routes
        return (
            <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>
                        {pathSegments[pathSegments.length - 1]?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </BreadcrumbPage>
                </BreadcrumbItem>
            </>
        )
    }, [pathname])

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <FiHome className="w-4 h-4" />
                            <span>Home</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbItems}
            </BreadcrumbList>
        </Breadcrumb>
    )
})

DashboardBreadcrumb.displayName = 'DashboardBreadcrumb'

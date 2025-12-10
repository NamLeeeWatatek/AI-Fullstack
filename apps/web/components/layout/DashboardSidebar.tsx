'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { RoleBadge } from '@/components/auth/RoleBadge'
import {
    FiLayout,
    FiGitMerge,
    FiGrid,
    FiRadio,
    FiSettings,
    FiDatabase,
    FiChevronDown,
    FiLogOut,
} from 'react-icons/fi'
import { TiMessages } from "react-icons/ti"
import { RiRobot2Line } from "react-icons/ri"
import { MdAutoAwesome } from 'react-icons/md'
import { IconType } from 'react-icons'
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher'

interface NavigationItem {
    name: string
    href?: string
    icon: IconType
    children?: Array<{
        name: string
        href: string
    }>
}

interface DashboardSidebarProps {
    expandedSections: string[]
    onToggleSection: (section: string) => void
    onSignOutConfirm: () => void
    sidebarOpen: boolean
    onCloseSidebar?: () => void
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

export const DashboardSidebar = React.memo<DashboardSidebarProps>(({
    expandedSections,
    onToggleSection,
    onSignOutConfirm,
    sidebarOpen,
    onCloseSidebar
}) => {
    const pathname = usePathname()
    const { user } = useAuth()
    const { capabilities } = usePermissions()

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href
        return pathname.startsWith(href)
    }

    const getUserName = () => {
        if (!user) return 'Loading...'
        return user.name || user.email || 'User'
    }

    const getUserEmail = () => {
        if (!user) return ''
        return user.email || ''
    }

    const getUserInitial = () => {
        const name = getUserName()
        return name.charAt(0).toUpperCase()
    }

    return (
        <aside className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
            w-64 border-r border-border/40 flex flex-col bg-background
            transition-transform duration-300 ease-in-out
        `}>
            {/* Header */}
            <div className="h-16 border-b border-border/40 flex items-center px-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-wata flex items-center justify-center mr-3 shadow-md">
                    <MdAutoAwesome className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">WataOmi</span>
            </div>

            {/* Workspace Switcher */}
            <div className="p-4 border-b border-border/40">
                <WorkspaceSwitcher />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const active = item.href ? isActive(item.href) : false
                    const isExpanded = expandedSections.includes(item.name.toLowerCase())
                    const hasChildren = item.children && item.children.length > 0

                    return (
                        <div key={item.name} className="space-y-1">
                            {hasChildren ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => onToggleSection(item.name.toLowerCase())}
                                    className="w-full justify-between h-auto px-3 py-2"
                                >
                                    <div className="flex items-center space-x-3">
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    <FiChevronDown
                                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </Button>
                            ) : (
                                <Link
                                    href={item.href!}
                                    onClick={onCloseSidebar}
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${active
                                        ? 'bg-gradient-wata text-white shadow-lg shadow-slate-700/20'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            )}

                            {hasChildren && isExpanded && (
                                <div className="pl-11 space-y-1">
                                    {item.children!.map((child) => {
                                        const isChildActive = isActive(child.href)
                                        return (
                                            <Link
                                                key={child.name}
                                                href={child.href}
                                                onClick={onCloseSidebar}
                                                className={`block px-3 py-2 rounded-lg text-sm transition-all ${isChildActive
                                                    ? 'text-primary bg-primary/10 font-medium'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                                    }`}
                                            >
                                                {child.name}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-border/40">
                <div className="rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm p-4 hover:bg-card/80 transition-all duration-200">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-wata flex items-center justify-center shadow-md flex-shrink-0">
                            <span className="text-white font-semibold">
                                {getUserInitial()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate mb-0.5">{getUserName()}</p>
                            {capabilities && <RoleBadge className="mb-1.5" />}
                            <p className="text-xs text-muted-foreground truncate">{getUserEmail()}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={onSignOutConfirm}
                    >
                        <FiLogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </aside>
    )
})

DashboardSidebar.displayName = 'DashboardSidebar'

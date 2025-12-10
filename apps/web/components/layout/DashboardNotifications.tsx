'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import {
    selectRecentNotifications,
    selectUnreadCount,
    selectHasUnreadNotifications,
} from '@/lib/store/selectors/notifications'
import {
    markAsRead,
    markAllAsRead,
    removeNotification
} from '@/lib/store/slices/notificationsSlice'
import { FiBell, FiCheck, FiX } from 'react-icons/fi'

interface DashboardNotificationsProps {
    showNotifications: boolean
    onToggle: () => void
}

export const DashboardNotifications = React.memo<DashboardNotificationsProps>(({
    showNotifications,
    onToggle
}) => {
    const dispatch = useAppDispatch()
    const notifications = useAppSelector(selectRecentNotifications)
    const unreadCount = useAppSelector(selectUnreadCount)
    const hasUnread = useAppSelector(selectHasUnreadNotifications)

    const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch(markAsRead(id))
    }

    const handleMarkAllAsRead = () => {
        dispatch(markAllAsRead())
    }

    const handleRemoveNotification = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch(removeNotification(id))
    }

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="relative"
            >
                <FiBell className="w-5 h-5" />
                {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </Button>

            {showNotifications && (
                <div className="absolute right-0 top-12 w-80 rounded-xl border border-border bg-popover shadow-xl z-50">
                    <div className="p-3 border-b border-border/40 flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
                        {hasUnread && (
                            <Button
                                variant="link"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="h-auto p-0 text-xs"
                            >
                                Mark all as read
                            </Button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-3 border-b border-border/20 hover:bg-muted/30 transition-colors ${!notification.read ? 'bg-primary/5' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.type === 'success' ? 'bg-green-500 dark:bg-green-400' :
                                            notification.type === 'warning' ? 'bg-yellow-500 dark:bg-yellow-400' :
                                                notification.type === 'error' ? 'bg-red-500 dark:bg-red-400' :
                                                    'bg-blue-500 dark:bg-blue-400'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{notification.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {notification.message}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            {!notification.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                    className="h-6 w-6"
                                                    title="Mark as read"
                                                >
                                                    <FiCheck className="w-3 h-3" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => handleRemoveNotification(notification.id, e)}
                                                className="h-6 w-6 text-muted-foreground"
                                                title="Dismiss"
                                            >
                                                <FiX className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
})

DashboardNotifications.displayName = 'DashboardNotifications'

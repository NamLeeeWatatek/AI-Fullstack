import { formatDistanceToNow as formatDistanceToNowFn } from 'date-fns';

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
    return formatDistanceToNowFn(new Date(date), {
        addSuffix: true,
    });
}

/**
 * Format date to locale string
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    return new Date(date).toLocaleDateString('vi-VN', options);
}

/**
 * Format date to locale date and time string
 */
export function formatDateTime(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    return new Date(date).toLocaleString('vi-VN', options);
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
    const today = new Date();
    const checkDate = new Date(date);
    return (
        checkDate.getDate() === today.getDate() &&
        checkDate.getMonth() === today.getMonth() &&
        checkDate.getFullYear() === today.getFullYear()
    );
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: string | Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const checkDate = new Date(date);
    return (
        checkDate.getDate() === yesterday.getDate() &&
        checkDate.getMonth() === yesterday.getMonth() &&
        checkDate.getFullYear() === yesterday.getFullYear()
    );
}

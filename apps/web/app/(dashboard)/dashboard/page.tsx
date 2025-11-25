"use client"

import { useEffect, useState } from "react"
import { Button } from "@wataomi/ui"
import { FiActivity, FiCreditCard, FiDollarSign, FiUsers } from "react-icons/fi"
import { fetchAPI } from "@/lib/api"

interface DashboardStats {
    total_flows: number
    active_bots: number
    total_conversations: number
    messages_today: number
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await fetchAPI("/stats/dashboard")
                setStats(data)
            } catch (error) {
                console.error("Error fetching stats:", error)
                setStats(null)
            } finally {
                setIsLoading(false)
            }
        }

        loadStats()
    }, [])

    if (isLoading) return <div className="p-8">Loading dashboard...</div>

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button>Download</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Flows */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                        <h3 className="tracking-tight text-sm font-medium">Total Flows</h3>
                        <FiDollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{stats?.total_flows || 0}</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </div>
                </div>

                {/* Active Bots */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                        <h3 className="tracking-tight text-sm font-medium">Active Bots</h3>
                        <FiUsers className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{stats?.active_bots || 0}</div>
                        <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                    </div>
                </div>

                {/* Total Conversations */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                        <h3 className="tracking-tight text-sm font-medium">Total Conversations</h3>
                        <FiCreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{stats?.total_conversations || 0}</div>
                        <p className="text-xs text-muted-foreground">+19% from last month</p>
                    </div>
                </div>

                {/* Messages Today */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                        <h3 className="tracking-tight text-sm font-medium">Messages Today</h3>
                        <FiActivity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{stats?.messages_today || 0}</div>
                        <p className="text-xs text-muted-foreground">+201 since last hour</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="font-semibold leading-none tracking-tight">Overview</h3>
                    </div>
                    <div className="p-6 pt-0 pl-2">
                        {/* Placeholder for Overview Chart */}
                        <div className="h-[350px] w-full bg-muted/20 flex items-center justify-center text-muted-foreground">
                            Chart Placeholder
                        </div>
                    </div>
                </div>
                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="font-semibold leading-none tracking-tight">Recent Sales</h3>
                        <p className="text-sm text-muted-foreground">You made 265 sales this month.</p>
                    </div>
                    <div className="p-6 pt-0">
                        {/* Placeholder for Recent Sales */}
                        <div className="space-y-8">
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Olivia Martin</p>
                                    <p className="text-sm text-muted-foreground">olivia.martin@email.com</p>
                                </div>
                                <div className="ml-auto font-medium">+$1,999.00</div>
                            </div>
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Jackson Lee</p>
                                    <p className="text-sm text-muted-foreground">jackson.lee@email.com</p>
                                </div>
                                <div className="ml-auto font-medium">+$39.00</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

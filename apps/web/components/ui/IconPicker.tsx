"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover"
import { Input } from "@/components/ui/Input"
import { ScrollArea } from "./ScrollArea"
import * as Icons from 'react-icons/fi'
import { cn } from "@/lib/utils"

interface IconPickerProps {
    value?: string
    onChange: (icon: string) => void
    className?: string
}

const commonIcons = [
    'FiFolder',
    'FiFile',
    'FiFileText',
    'FiBook',
    'FiBookOpen',
    'FiDatabase',
    'FiArchive',
    'FiBox',
    'FiBriefcase',
    'FiClipboard',
    'FiCode',
    'FiCoffee',
    'FiCpu',
    'FiCreditCard',
    'FiDollarSign',
    'FiGlobe',
    'FiGrid',
    'FiHardDrive',
    'FiHash',
    'FiHeart',
    'FiHome',
    'FiImage',
    'FiInbox',
    'FiLayers',
    'FiLayout',
    'FiLifeBuoy',
    'FiList',
    'FiLock',
    'FiMail',
    'FiMap',
    'FiMessageSquare',
    'FiMonitor',
    'FiMusic',
    'FiPackage',
    'FiPaperclip',
    'FiPieChart',
    'FiSettings',
    'FiShoppingBag',
    'FiShoppingCart',
    'FiStar',
    'FiTag',
    'FiTarget',
    'FiTool',
    'FiTrendingUp',
    'FiTruck',
    'FiTv',
    'FiUser',
    'FiUsers',
    'FiVideo',
    'FiZap',
]

export function IconPicker({ value, onChange, className }: IconPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const filteredIcons = commonIcons.filter(icon =>
        icon.toLowerCase().includes(search.toLowerCase())
    )

    const SelectedIcon = value && (Icons as any)[value] ? (Icons as any)[value] : Icons.FiFolder

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-start", className)}
                >
                    <SelectedIcon className="w-4 h-4 mr-2" />
                    {value || "Select icon..."}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-2 border-b">
                    <Input
                        placeholder="Search icons..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <ScrollArea className="h-72">
                    <div className="grid grid-cols-6 gap-2 p-2">
                        {filteredIcons.map((iconName) => {
                            const IconComponent = (Icons as any)[iconName]
                            return (
                                <button
                                    key={iconName}
                                    onClick={() => {
                                        onChange(iconName)
                                        setOpen(false)
                                    }}
                                    className={cn(
                                        "p-3 rounded-md hover:bg-accent transition-colors flex items-center justify-center",
                                        value === iconName && "bg-accent"
                                    )}
                                    title={iconName}
                                >
                                    <IconComponent className="w-5 h-5" />
                                </button>
                            )
                        })}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}


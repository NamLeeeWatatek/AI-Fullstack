"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import * as Icons from 'react-icons/fi';
import { FiSearch } from 'react-icons/fi';
import type { IconPickerProps } from '@/lib/types';

const POPULAR_ICONS = [
  'FiFolder', 'FiFile', 'FiZap', 'FiStar', 'FiHeart',
  'FiMessageCircle', 'FiMail', 'FiPhone', 'FiHeadphones',
  'FiShoppingCart', 'FiDollarSign', 'FiTrendingUp', 'FiBarChart',
  'FiCpu', 'FiDatabase', 'FiServer', 'FiCode',
  'FiUsers', 'FiUser', 'FiSettings', 'FiGrid',
  'FiCalendar', 'FiClock', 'FiMap', 'FiGlobe'
];

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const SelectedIcon = value ? (Icons as any)[value] || Icons.FiFolder : Icons.FiFolder;

  const filteredIcons = POPULAR_ICONS.filter(icon =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          type="button"
        >
          <SelectedIcon className="size-4" />
          <span className="text-sm">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {filteredIcons.map((iconName) => {
              const IconComponent = (Icons as any)[iconName];
              const isSelected = value === iconName;
              
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                  }}
                  className={`p-3 rounded-lg hover:bg-muted transition-colors ${
                    isSelected ? 'bg-primary/20 text-primary' : ''
                  }`}
                  title={iconName}
                >
                  <IconComponent className="size-5 mx-auto" />
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

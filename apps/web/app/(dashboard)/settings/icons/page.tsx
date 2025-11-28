"use client";

import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FiSearch,
  FiImage,
  FiStar,
  FiHeart
} from 'react-icons/fi';
import * as Icons from 'react-icons/fi';

interface Icon {
  id: number;
  name: string;
  library: string;
  category: string;
  tags: string[];
  is_favorite: boolean;
  usage_count: number;
}

export default function IconsPage() {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const loadIcons = async () => {
    try {
      const data = await fetchAPI('/metadata/icons');
      setIcons(data);
    } catch (error) {
      console.error('Failed to load icons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIcons();
  }, []);

  const toggleFavorite = async (icon: Icon) => {
    try {
      await fetchAPI(`/metadata/icons/${icon.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_favorite: !icon.is_favorite })
      });
      setIcons(icons.map(i => 
        i.id === icon.id ? { ...i, is_favorite: !i.is_favorite } : i
      ));
    } catch (error) {
      console.error('Failed to update icon:', error);
    }
  };

  const categories = ['all', ...Array.from(new Set(icons.map(i => i.category)))];

  const filteredIcons = icons.filter(icon => {
    const matchesSearch = search === '' || 
      icon.name.toLowerCase().includes(search.toLowerCase()) ||
      icon.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = activeCategory === 'all' || icon.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FiImage className="text-primary" />
              Icon Library
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse and manage icons for your content
            </p>
          </div>
          <Badge variant="default">
            {icons.length} Icons
          </Badge>
        </div>
      </header>

      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search icons by name or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
        <TabsList>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
        {filteredIcons.map((icon) => {
          const IconComponent = (Icons as any)[icon.name];
          
          return (
            <Card 
              key={icon.id} 
              className="relative p-4 hover:shadow-lg transition-all hover:scale-105 cursor-pointer group"
              title={icon.name}
            >
              <button
                onClick={() => toggleFavorite(icon)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {icon.is_favorite ? (
                  <FiHeart className="size-3 text-red-400 fill-red-400" />
                ) : (
                  <FiHeart className="size-3 text-muted-foreground" />
                )}
              </button>
              
              <div className="flex flex-col items-center gap-2">
                {IconComponent && (
                  <IconComponent className="size-6 text-foreground" />
                )}
                <span className="text-[10px] text-muted-foreground text-center truncate w-full">
                  {icon.name.replace('Fi', '')}
                </span>
              </div>
              
              {icon.usage_count > 0 && (
                <div className="absolute bottom-1 left-1">
                  <Badge variant="default" className="text-[8px] px-1 py-0">
                    {icon.usage_count}
                  </Badge>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredIcons.length === 0 && (
        <div className="text-center py-12">
          <FiImage className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No icons found
          </p>
        </div>
      )}
    </div>
  );
}

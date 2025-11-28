"use client";

import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2,
  FiFolder
} from 'react-icons/fi';
import * as Icons from 'react-icons/fi';
import { CategoryDialog } from '@/components/features/settings/category-dialog';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  color: string;
  description?: string;
  entity_type: string;
  usage_count: number;
  is_system: boolean;
  order: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState('workflow');

  const loadCategories = async () => {
    try {
      const data = await fetchAPI('/metadata/categories');
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await fetchAPI(`/metadata/categories/${id}`, { method: 'DELETE' });
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Cannot delete this category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleSave = () => {
    loadCategories();
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const getCategoriesByType = (type: string) => {
    return categories
      .filter(c => c.entity_type === type)
      .sort((a, b) => a.order - b.order);
  };

  const renderCategoryCard = (category: Category) => {
    const IconComponent = category.icon ? (Icons as any)[category.icon] : FiFolder;
    
    return (
      <Card key={category.id} className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${category.color}20` }}
            >
              {IconComponent && (
                <IconComponent 
                  className="size-5" 
                  style={{ color: category.color }}
                />
              )}
            </div>
            <div>
              <h3 className="font-medium">{category.name}</h3>
              <code className="text-xs text-muted-foreground">{category.slug}</code>
            </div>
          </div>
          
          {!category.is_system && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(category)}
              >
                <FiEdit2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(category.id)}
              >
                <FiTrash2 className="size-4 text-red-400" />
              </Button>
            </div>
          )}
          
          {category.is_system && (
            <Badge variant="default" className="text-xs">System</Badge>
          )}
        </div>
        
        {category.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {category.description}
          </p>
        )}
        
        <div className="text-xs text-muted-foreground">
          Used {category.usage_count} times
        </div>
      </Card>
    );
  };

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
              <FiFolder className="text-primary" />
              Categories
            </h1>
            <p className="text-muted-foreground mt-1">
              Organize your content with categories
            </p>
          </div>
          <Button onClick={handleCreate}>
            <FiPlus className="mr-2" />
            Create Category
          </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="workflow">Workflows</TabsTrigger>
          <TabsTrigger value="template">Templates</TabsTrigger>
          <TabsTrigger value="bot">Bots</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getCategoriesByType('workflow').map(renderCategoryCard)}
          </div>
        </TabsContent>

        <TabsContent value="template">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getCategoriesByType('template').map(renderCategoryCard)}
          </div>
        </TabsContent>

        <TabsContent value="bot">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getCategoriesByType('bot').map(renderCategoryCard)}
          </div>
        </TabsContent>
      </Tabs>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        entityType={activeTab}
        onSave={handleSave}
      />
    </div>
  );
}

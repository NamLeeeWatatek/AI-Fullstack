"use client";

import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch,
  FiTag
} from 'react-icons/fi';
import { TagDialog } from '@/components/features/settings/tag-dialog';

interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
  usage_count: number;
  created_at: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const loadTags = async () => {
    try {
      const data = await fetchAPI('/metadata/tags');
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    
    try {
      await fetchAPI(`/metadata/tags/${id}`, { method: 'DELETE' });
      setTags(tags.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingTag(null);
    setDialogOpen(true);
  };

  const handleSave = () => {
    loadTags();
    setDialogOpen(false);
    setEditingTag(null);
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

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
              <FiTag className="text-primary" />
              Tags
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage tags for workflows, templates, and bots
            </p>
          </div>
          <Button onClick={handleCreate}>
            <FiPlus className="mr-2" />
            Create Tag
          </Button>
        </div>
      </header>

      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTags.map((tag) => (
          <Card key={tag.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <Badge 
                style={{ 
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderColor: tag.color
                }}
                className="border"
              >
                {tag.name}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(tag)}
                >
                  <FiEdit2 className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(tag.id)}
                >
                  <FiTrash2 className="size-4 text-red-400" />
                </Button>
              </div>
            </div>
            
            {tag.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {tag.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Used {tag.usage_count} times</span>
              <span 
                className="w-6 h-6 rounded-full border-2"
                style={{ backgroundColor: tag.color, borderColor: tag.color }}
              />
            </div>
          </Card>
        ))}
      </div>

      {filteredTags.length === 0 && (
        <div className="text-center py-12">
          <FiTag className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search ? 'No tags found' : 'No tags yet. Create your first tag!'}
          </p>
        </div>
      )}

      <TagDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tag={editingTag}
        onSave={handleSave}
      />
    </div>
  );
}

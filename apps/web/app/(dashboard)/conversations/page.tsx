'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Clock,
  CheckCircle2,
  Circle,
  MoreVertical,
  Archive,
  Trash2
} from 'lucide-react';
import { 
  FiFacebook, 
  FiInstagram, 
  FiMail,
  FiMessageCircle 
} from 'react-icons/fi';
import { FaWhatsapp, FaTelegram, FaFacebookMessenger } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { ChatInterface } from '@/components/chat/chat-interface';
import { fetchAPI } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  externalId: string;
  channelId: string;
  channelType: string;
  channelName: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: 'open' | 'pending' | 'closed';
  assignedTo?: string;
  metadata?: any;
}

export default function ConversationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  
  const selectedId = searchParams.get('id');

  useEffect(() => {
    loadConversations();
  }, [statusFilter, sourceFilter]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      
      const data = await fetchAPI(`/conversations?${params.toString()}`);
      
      // Handle different response formats
      let rawConversations: any[] = [];
      if (Array.isArray(data)) {
        rawConversations = data;
      } else if (data?.items && Array.isArray(data.items)) {
        rawConversations = data.items;
      } else if (data?.conversations && Array.isArray(data.conversations)) {
        rawConversations = data.conversations;
      } else if (data?.data && Array.isArray(data.data)) {
        rawConversations = data.data;
      }
      
      // Map backend fields to frontend format
      const mappedConversations = rawConversations.map((conv: any) => {
        // Get last message from metadata or messages array
        let lastMessage = 'No messages yet';
        if (conv.metadata?.lastMessage) {
          lastMessage = conv.metadata.lastMessage;
        } else if (conv.messages && conv.messages.length > 0) {
          const lastMsg = conv.messages[conv.messages.length - 1];
          lastMessage = lastMsg.content || lastMsg.text || 'No messages yet';
        }

        return {
          id: conv.id,
          externalId: conv.externalId || conv.external_id || '',
          channelId: conv.channelId || conv.channel_id || '',
          channelType: conv.channelType || conv.channel_type || 'web',
          channelName: conv.channelName || conv.channel_name || conv.channelType || 'Unknown',
          customerName: conv.customerName || conv.contactName || conv.contact_name || 'Unknown',
          customerAvatar: conv.customerAvatar || conv.contactAvatar || conv.contact_avatar,
          lastMessage,
          lastMessageAt: conv.lastMessageAt || conv.last_message_at || new Date().toISOString(),
          unreadCount: conv.unreadCount || conv.unread_count || 0,
          status: conv.status === 'active' ? 'open' : conv.status || 'open',
          assignedTo: conv.assignedTo || conv.assigned_to,
          metadata: conv.metadata || {},
        };
      });
      
      setConversations(mappedConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      facebook: <FiFacebook className="w-4 h-4" />,
      messenger: <FaFacebookMessenger className="w-4 h-4" />,
      instagram: <FiInstagram className="w-4 h-4" />,
      whatsapp: <FaWhatsapp className="w-4 h-4" />,
      telegram: <FaTelegram className="w-4 h-4" />,
      email: <FiMail className="w-4 h-4" />,
      webchat: <FiMessageCircle className="w-4 h-4" />,
    };
    return icons[type] || <MessageSquare className="w-4 h-4" />;
  };

  const getChannelColor = (type: string) => {
    const colors: Record<string, string> = {
      facebook: 'text-blue-500',
      messenger: 'text-blue-500',
      instagram: 'text-pink-500',
      whatsapp: 'text-green-500',
      telegram: 'text-sky-500',
      email: 'text-red-500',
      webchat: 'text-cyan-500',
    };
    return colors[type] || 'text-gray-500';
  };

  const filteredConversations = Array.isArray(conversations) 
    ? conversations.filter(conv =>
        conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectConversation = (id: string) => {
    router.push(`/conversations/${id}`);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar - Conversations List */}
      <div className="w-96 border-r flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Inbox</h1>
            <Button variant="ghost" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Source Filter */}
          <Tabs value={sourceFilter} onValueChange={setSourceFilter}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="channel" className="flex-1">Channels</TabsTrigger>
              <TabsTrigger value="widget" className="flex-1">Widget</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Status Filter */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
              <TabsTrigger value="closed" className="flex-1">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Spinner className="w-6 h-6" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    'w-full p-4 text-left hover:bg-muted/50 transition-colors',
                    selectedId === conv.id && 'bg-muted'
                  )}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={conv.customerAvatar} />
                      <AvatarFallback>
                        {conv.customerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {conv.customerName}
                          </h3>
                          <div className={cn('shrink-0', getChannelColor(conv.channelType))}>
                            {getChannelIcon(conv.channelType)}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {conv.lastMessage}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={conv.status} />
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="h-5 px-2">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Content - Chat Area */}
      <div className="flex-1 flex flex-col bg-muted/20">
        {selectedId ? (
          <ConversationChat conversationId={selectedId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    open: { icon: Circle, label: 'Open', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    pending: { icon: Clock, label: 'Pending', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    closed: { icon: CheckCircle2, label: 'Closed', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  };

  const { icon: Icon, label, className } = config[status as keyof typeof config] || config.open;

  return (
    <Badge variant="outline" className={cn('h-5 px-2 gap-1', className)}>
      <Icon className="w-3 h-3" />
      <span className="text-xs">{label}</span>
    </Badge>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString();
}

// Conversation Chat Component
function ConversationChat({ conversationId }: { conversationId: string }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI(`/conversations/${conversationId}`);
      setConversation(data);
    } catch (error) {
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      await fetchAPI(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, sender: 'agent' }),
      });
    } catch (err) {
      toast.error('Failed to send message');
      throw err;
    }
  };

  const handleLoadMore = async (before: string) => {
    try {
      const data = await fetchAPI(
        `/conversations/${conversationId}/messages?before=${before}&limit=50`
      );
      return Array.isArray(data) ? data : data.messages || [];
    } catch (error) {
      toast.error('Failed to load more messages');
      return [];
    }
  };

  const getChannelIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      facebook: <FiFacebook className="w-5 h-5" />,
      messenger: <FaFacebookMessenger className="w-5 h-5" />,
      instagram: <FiInstagram className="w-5 h-5" />,
      whatsapp: <FaWhatsapp className="w-5 h-5" />,
      telegram: <FaTelegram className="w-5 h-5" />,
      email: <FiMail className="w-5 h-5" />,
      webchat: <FiMessageCircle className="w-5 h-5" />,
    };
    return icons[type] || <MessageSquare className="w-5 h-5" />;
  };

  const getChannelColor = (type: string) => {
    const colors: Record<string, string> = {
      facebook: 'text-blue-500 bg-blue-500/10',
      messenger: 'text-blue-500 bg-blue-500/10',
      instagram: 'text-pink-500 bg-pink-500/10',
      whatsapp: 'text-green-500 bg-green-500/10',
      telegram: 'text-sky-500 bg-sky-500/10',
      email: 'text-red-500 bg-red-500/10',
      webchat: 'text-cyan-500 bg-cyan-500/10',
    };
    return colors[type] || 'text-gray-500 bg-gray-500/10';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="border-b px-6 py-4 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={conversation.customerAvatar} />
              <AvatarFallback>
                {conversation.customerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-semibold text-lg">{conversation.customerName}</h2>
                <div className={cn('p-1.5 rounded-lg', getChannelColor(conversation.channelType))}>
                  {getChannelIcon(conversation.channelType)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {conversation.channelName} • {conversation.channelType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={conversation.status} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden bg-background">
        <ChatInterface
          conversationId={conversationId}
          botName={conversation.customerName}
          onSendMessage={handleSendMessage}
          onLoadMore={handleLoadMore}
        />
      </div>
    </>
  );
}

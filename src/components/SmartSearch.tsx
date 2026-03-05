import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTickets, statusLabels, priorityLabels, Ticket } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, BookOpen, Clock, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TicketProgressTracker } from './TicketProgressTracker';

interface SmartSearchProps {
  onTicketClick: (ticket: Ticket) => void;
  className?: string;
}

interface KBArticle {
  id: string;
  title: string;
  category: string;
  content: string;
}

export function SmartSearch({ onTicketClick, className }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['kb-search', query],
    queryFn: async () => {
      if (!query.trim() || query.length < 2) return [];
      const { data } = await supabase
        .from('knowledge_base_articles')
        .select('id, title, category, content')
        .eq('is_published', true)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(5);
      return (data || []) as KBArticle[];
    },
    enabled: query.length >= 2,
  });

  const filteredTickets = query.length >= 2
    ? tickets.filter(t =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.code?.toLowerCase().includes(query.toLowerCase()) ||
        t.description?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const hasResults = filteredTickets.length > 0 || articles.length > 0;
  const showDropdown = focused && query.length >= 2;

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    open: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    in_progress: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
    waiting_on_customer: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
    resolved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    closed: 'bg-muted text-muted-foreground',
    reopened: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder="بحث في التذاكر وقاعدة المعرفة..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          className="pr-9 pl-9 rounded-xl bg-muted/50 border-muted-foreground/10 focus:bg-background transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border bg-popover shadow-xl overflow-hidden"
          >
            <ScrollArea className="max-h-[400px]">
              {!hasResults && !articlesLoading && (
                <div className="p-6 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد نتائج لـ "{query}"</p>
                </div>
              )}

              {filteredTickets.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />
                    تذاكر ({filteredTickets.length})
                  </div>
                  {filteredTickets.map(ticket => (
                    <button
                      key={ticket.id}
                      onClick={() => { onTicketClick(ticket); setFocused(false); setQuery(''); }}
                      className="w-full text-right px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{ticket.code}</span>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-0", statusColors[ticket.status])}>
                          {statusLabels[ticket.status]}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{ticket.title}</p>
                      <TicketProgressTracker status={ticket.status} compact className="mt-2" />
                    </button>
                  ))}
                </div>
              )}

              {articles.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" />
                    قاعدة المعرفة ({articles.length})
                  </div>
                  {articles.map(article => (
                    <a
                      key={article.id}
                      href="/knowledge-base"
                      className="block w-full text-right px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">{article.category}</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{article.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {article.content.substring(0, 100)}...
                      </p>
                    </a>
                  ))}
                </div>
              )}

              {articlesLoading && (
                <div className="p-4 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

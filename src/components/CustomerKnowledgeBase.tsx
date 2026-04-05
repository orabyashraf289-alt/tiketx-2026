import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, Eye, ThumbsUp, ThumbsDown, Loader2, ChevronRight, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { toast } from '@/hooks/use-toast';

interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_published: boolean;
  views_count: number;
  helpful_count: number;
  service_id: string | null;
  created_at: string;
}

const categories = ['general', 'how-to', 'troubleshooting', 'faq', 'policy'];

export function CustomerKnowledgeBase() {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [votedArticles, setVotedArticles] = useState<Record<string, 'up' | 'down'>>({});

  const categoryLabels: Record<string, string> = {
    general: t.admin.categoryLabels.general,
    'how-to': t.admin.categoryLabels.howTo,
    troubleshooting: t.admin.categoryLabels.troubleshooting,
    faq: t.admin.categoryLabels.faq,
    policy: t.admin.categoryLabels.policy,
  };

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['customer-kb-articles', search],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_base_articles')
        .select('*')
        .eq('is_published', true)
        .order('helpful_count', { ascending: false });
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as KBArticle[];
    },
  });

  // Group articles by category
  const filtered = articles.filter(a => catFilter === 'all' || a.category === catFilter);
  const groupedByCategory = filtered.reduce<Record<string, KBArticle[]>>((acc, article) => {
    const cat = article.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(article);
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{t.admin.customerKB}</h2>
          <p className="text-sm text-muted-foreground">{t.portal.kbDescription}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
        <Input
          placeholder={t.admin.searchArticles}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`${isRTL ? 'pr-11' : 'pl-11'} h-12 rounded-2xl text-base border-border/40 focus:border-primary/40`}
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCatFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${catFilter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        >
          {t.common.all}
        </button>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${catFilter === c ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            {categoryLabels[c]}
          </button>
        ))}
      </div>

      {/* Articles */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 opacity-30" />
          </div>
          <p className="font-medium">{t.admin.noArticles}</p>
        </div>
      ) : catFilter === 'all' ? (
        // Grouped view
        <div className="space-y-8">
          {Object.entries(groupedByCategory).map(([cat, arts]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">{categoryLabels[cat] || cat}</h3>
                <Badge variant="secondary" className="text-[10px]">{arts.length}</Badge>
              </div>
              <div className="grid gap-3">
                {arts.map((article, i) => (
                  <ArticleCard key={article.id} article={article} index={i} categoryLabels={categoryLabels} onClick={() => setSelectedArticle(article)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((article, i) => (
            <ArticleCard key={article.id} article={article} index={i} categoryLabels={categoryLabels} onClick={() => setSelectedArticle(article)} />
          ))}
        </div>
      )}

      {/* Article Detail Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
          {selectedArticle && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedArticle.title}</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 mb-4 flex-wrap">
                <Badge variant="secondary" className="rounded-lg">{categoryLabels[selectedArticle.category] || selectedArticle.category}</Badge>
                {selectedArticle.tags?.map(tg => <Badge key={tg} variant="outline" className="rounded-lg">{tg}</Badge>)}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {selectedArticle.views_count} {t.admin.views}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant={votedArticles[selectedArticle.id] === 'up' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1.5 rounded-xl"
                    disabled={!!votedArticles[selectedArticle.id]}
                    onClick={async () => {
                      await supabase.rpc('increment_helpful' as any, { article_id: selectedArticle.id });
                      setVotedArticles(v => ({ ...v, [selectedArticle.id]: 'up' }));
                      setSelectedArticle(prev => prev ? { ...prev, helpful_count: prev.helpful_count + 1 } : null);
                      queryClient.invalidateQueries({ queryKey: ['customer-kb-articles'] });
                      toast({ title: t.common.success });
                    }}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" /> {t.admin.helpful} ({selectedArticle.helpful_count})
                  </Button>
                  <Button
                    variant={votedArticles[selectedArticle.id] === 'down' ? 'destructive' : 'outline'}
                    size="sm"
                    className="gap-1.5 rounded-xl"
                    disabled={!!votedArticles[selectedArticle.id]}
                    onClick={async () => {
                      await supabase.rpc('decrement_helpful' as any, { article_id: selectedArticle.id });
                      setVotedArticles(v => ({ ...v, [selectedArticle.id]: 'down' }));
                      setSelectedArticle(prev => prev ? { ...prev, helpful_count: Math.max(prev.helpful_count - 1, 0) } : null);
                      queryClient.invalidateQueries({ queryKey: ['customer-kb-articles'] });
                      toast({ title: t.common.success });
                    }}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" /> {isRTL ? 'غير مفيد' : 'Not helpful'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function ArticleCard({ article, index, categoryLabels, onClick }: { article: KBArticle; index: number; categoryLabels: Record<string, string>; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card
        className="group cursor-pointer rounded-2xl border-border/40 hover:shadow-card-hover hover:border-primary/20 transition-all duration-300 overflow-hidden"
        onClick={onClick}
      >
        <div className="h-0.5 w-0 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-500" />
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200">{article.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.content.slice(0, 120)}...</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-[10px] rounded-lg">{categoryLabels[article.category] || article.category}</Badge>
                {article.tags?.slice(0, 2).map(tag => <Badge key={tag} variant="outline" className="text-[10px] rounded-lg">{tag}</Badge>)}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{article.helpful_count}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors rtl:rotate-180" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

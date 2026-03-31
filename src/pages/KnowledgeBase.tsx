import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { BookOpen, Search, Plus, Eye, ThumbsUp, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/i18n';

interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_published: boolean;
  views_count: number;
  helpful_count: number;
  author_id: string;
  service_id: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchArticles(search?: string) {
  let query = supabase
    .from('knowledge_base_articles')
    .select('*')
    .order('created_at', { ascending: false });
  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as KBArticle[];
}

const categories = ['general', 'how-to', 'troubleshooting', 'faq', 'policy'];

export default function KnowledgeBase() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const { t, isRTL } = useLanguage();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', tags: '' });

  const categoryLabels: Record<string, string> = {
    general: t.admin.categoryLabels.general,
    'how-to': t.admin.categoryLabels.howTo,
    troubleshooting: t.admin.categoryLabels.troubleshooting,
    faq: t.admin.categoryLabels.faq,
    policy: t.admin.categoryLabels.policy,
  };

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['kb-articles', search],
    queryFn: () => fetchArticles(search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: async (article: typeof form) => {
      const { error } = await supabase.from('knowledge_base_articles').insert({
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags.split(',').map(t => t.trim()).filter(Boolean),
        author_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] });
      setShowCreate(false);
      setForm({ title: '', content: '', category: 'general', tags: '' });
      toast({ title: t.common.success });
    },
    onError: () => toast({ title: t.common.error, variant: 'destructive' }),
  });

  const markHelpful = async (id: string) => {
    await supabase.rpc('increment_helpful' as any, { article_id: id }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] });
    });
  };

  const filtered = articles.filter(a => catFilter === 'all' || a.category === catFilter);
  const canCreate = role === 'admin' || role === 'agent';

  return (
    <PageLayout>
      <PageHeader
        title={t.admin.knowledgeBaseTitle}
        icon={<BookOpen className="h-5 w-5" />}
        actions={
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 gap-3 shrink-0 no-print sticky top-0 z-30"
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">{t.admin.knowledgeBaseTitle}</h1>
            </div>
            <div className="flex gap-2 items-center">
              <NotificationsPopover />
              {canCreate && (
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gradient-accent text-accent-foreground gap-1.5">
                      <Plus className="h-4 w-4" /> {t.admin.addArticle}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
                    <DialogHeader><DialogTitle>{t.admin.addArticle}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Input placeholder={t.admin.articleTitle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                      <select
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}
                      </select>
                      <Input placeholder={t.admin.articleTags} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                      <Textarea rows={8} placeholder={t.admin.articleContent} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
                      <Button
                        className="w-full"
                        disabled={!form.title || !form.content || createMutation.isPending}
                        onClick={() => createMutation.mutate(form)}
                      >
                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.submit}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </motion.header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                <Input
                  placeholder={t.admin.searchArticles}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`${isRTL ? 'pr-11' : 'pl-11'} h-12 rounded-2xl text-base`}
                />
              </div>

              {/* Category filter */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setCatFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${catFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{t.common.all}</button>
                {categories.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${catFilter === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {categoryLabels[c]}
                  </button>
                ))}
              </div>

              {/* Articles */}
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{t.admin.noArticles}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filtered.map((article, i) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-card-hover transition-all group"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <CardContent className="pt-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{article.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.content.slice(0, 150)}...</p>
                              <div className="flex items-center gap-3 mt-3">
                                <Badge variant="secondary" className="text-[10px]">{categoryLabels[article.category] || article.category}</Badge>
                                {article.tags?.map(tag => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.views_count}</span>
                              <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{article.helpful_count}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Article Detail Dialog */}
            <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
                {selectedArticle && (
                  <>
                    <DialogHeader>
                      <DialogTitle>{selectedArticle.title}</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-2 mb-4">
                      <Badge variant="secondary">{categoryLabels[selectedArticle.category]}</Badge>
                      {selectedArticle.tags?.map(tg => <Badge key={tg} variant="outline">{tg}</Badge>)}
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {selectedArticle.views_count} {t.admin.views}
                      </span>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => markHelpful(selectedArticle.id)}>
                        <ThumbsUp className="h-3.5 w-3.5" /> {t.admin.helpful} ({selectedArticle.helpful_count})
                      </Button>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

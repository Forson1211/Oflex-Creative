import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, User, ArrowRight, Share2, Tag, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    author: string;
    image_url: string | null;
    read_time: string;
    tags: string[];
    is_published: boolean;
    is_featured: boolean;
    views_count: number;
    created_at: string;
    updated_at: string;
    published_at: string | null;
}

const Blog = () => {
    const { getSetting } = useSiteSettings();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // Fetch published blog posts from database
    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['blog-posts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('blog_posts' as any)
                .select('*')
                .eq('is_published', true)
                .order('published_at', { ascending: false });

            if (error) throw error;
            return (data || []) as unknown as BlogPost[];
        },
    });

    const categories = ['All', 'Innovation', 'Tutorial', 'Studio News', 'Guide', 'Marketing', 'Design', 'Technology'];

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const featuredPost = posts.find(p => p.is_featured) || posts[0];

    return (
        <Layout>
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <Badge variant="outline" className="px-4 py-1 border-primary/30 text-primary mb-6 uppercase tracking-[0.2em] font-bold">
                            Journal & Insights
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                            {getSetting('blog_title', 'The Creative Chronicles')}
                        </h1>
                        <p className="text-xl text-muted-foreground/80 leading-relaxed mb-10">
                            {getSetting('blog_description', 'Explorations into the future of design, AI prompt strategies, and exclusive creative resources.')}
                        </p>

                        <div className="relative max-w-xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <Input
                                placeholder="Search articles, guides, news..."
                                className="pl-12 h-14 rounded-full border-white/10 bg-white/5 backdrop-blur-xl focus:ring-primary shadow-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Featured Post */}
            {!searchQuery && activeCategory === 'All' && !isLoading && featuredPost && (
                <section className="pb-20">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <GlassCard className="p-0 border-white/10 overflow-hidden group">
                                <div className="grid lg:grid-cols-2 gap-0">
                                    <div className="relative aspect-video lg:aspect-auto overflow-hidden">
                                        <OptimizedImage
                                            src={featuredPost.image_url || '/placeholder.svg'}
                                            alt={featuredPost.title}
                                            className="w-full h-full"
                                            imageClassName="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute top-6 left-6">
                                            <Badge className="bg-primary/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full border-none shadow-xl">
                                                Featured Story
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                                        <div className="flex items-center gap-4 text-xs font-bold text-primary tracking-widest uppercase mb-6">
                                            <span>{featuredPost.category}</span>
                                            <span className="w-1 h-1 bg-primary/30 rounded-full" />
                                            <span>{featuredPost.read_time} Read</span>
                                        </div>
                                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight group-hover:text-primary transition-colors duration-300">
                                            {featuredPost.title}
                                        </h2>
                                        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                                            {featuredPost.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                    <User className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground">{featuredPost.author}</span>
                                                    <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">
                                                        {featuredPost.published_at ? new Date(featuredPost.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link to={`/blog/${featuredPost.slug}`}>
                                                <Button variant="ghost" className="rounded-full group/btn">
                                                    Read Story
                                                    <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Categories & Grid */}
            <section className="pb-32">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
                        {categories.map((cat, idx) => (
                            <motion.button
                                key={cat}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 border ${activeCategory === cat
                                    ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                                    : 'bg-white/5 border-white/5 text-muted-foreground hover:border-white/10 hover:text-foreground'
                                    }`}
                            >
                                {cat}
                            </motion.button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading articles...</p>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <h3 className="text-xl font-bold mb-2">No articles found</h3>
                            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                            <Button variant="link" onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="mt-4 text-primary">
                                View all stories
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence mode="popLayout">
                                {filteredPosts.map((post, idx) => (
                                    <motion.div
                                        key={post.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Link to={`/blog/${post.slug}`} className="block h-full">
                                            <GlassCard className="p-0 border-white/5 overflow-hidden flex flex-col h-full group">
                                                <div className="relative aspect-[16/10] overflow-hidden">
                                                    <OptimizedImage
                                                        src={post.image_url || '/placeholder.svg'}
                                                        alt={post.title}
                                                        className="w-full h-full"
                                                        imageClassName="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute bottom-4 left-4">
                                                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-[10px] py-0 px-2.5 h-6">
                                                            {post.category}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="p-6 flex flex-col flex-1">
                                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-widest mb-4">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                                        </div>
                                                        <span className="w-1 h-1 bg-white/10 rounded-full" />
                                                        <span>{post.read_time} Read</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold mb-4 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                        {post.title}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                                                        {post.excerpt}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                <User className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-[11px] font-bold uppercase tracking-wider">{post.author}</span>
                                                        </div>
                                                        <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10">
                                                            <Share2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        </Link>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </section>

            {/* Newsletter / CTA */}
            <section className="pb-32">
                <div className="container mx-auto px-4">
                    <GlassCard className="p-12 md:p-20 relative overflow-hidden text-center border-primary/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Stay Ahead of the Curve</h2>
                            <p className="text-lg text-muted-foreground mb-10">
                                Join our creative community and get the latest design tips, AI strategies, and exclusive templates delivered to your inbox weekly.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                                <Input
                                    placeholder="Enter your email"
                                    className="rounded-full h-12 bg-white/5 border-white/10 px-6"
                                />
                                <Button className="rounded-full h-12 px-8 font-bold shadow-lg shadow-primary/20">
                                    Subscribe Now
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-6 opacity-50">
                                No spam. Unsubscribe any time.
                            </p>
                        </div>
                    </GlassCard>
                </div>
            </section>
        </Layout>
    );
};

export default Blog;

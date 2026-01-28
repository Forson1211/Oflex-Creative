import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Clock, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { BLOG_POSTS } from '@/data/blog-posts';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const BlogPostDetail = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const post = BLOG_POSTS.find(p => p.id === id);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!post) {
        return (
            <Layout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold mb-4">Post not found</h2>
                    <Button asChild>
                        <Link to="/blog">Back to Blog</Link>
                    </Button>
                </div>
            </Layout>
        );
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast({
            title: "Link copied!",
            description: "Article link copied to clipboard.",
        });
    };

    const relatedPosts = BLOG_POSTS.filter(p => p.id !== post.id && p.category === post.category).slice(0, 2);

    return (
        <Layout>
            {/* Post Header / Hero */}
            <article className="pt-24 pb-32">
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* Breadcrumbs */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
                    >
                        <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-foreground font-medium truncate">{post.title}</span>
                    </motion.div>

                    <Button variant="ghost" className="mb-8 group" asChild>
                        <Link to="/blog">
                            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Blog
                        </Link>
                    </Button>

                    <header className="mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 hover:bg-primary/20 uppercase tracking-widest font-bold px-4 py-1">
                                {post.category}
                            </Badge>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 tracking-tight leading-[1.1]">
                                {post.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-muted-foreground border-b border-white/5 pb-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{post.author}</p>
                                        <p className="text-[10px] uppercase tracking-tighter">Author</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {post.date}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {post.readTime} Read
                                    </div>
                                </div>

                                <div className="ml-auto flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-white/5 border-white/10 hover:bg-blue-500/10 hover:text-blue-500">
                                        <Twitter className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-white/5 border-white/10 hover:bg-primary/10 hover:text-primary" onClick={handleCopyLink}>
                                        <LinkIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </header>

                    {/* Main Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-16"
                    >
                        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                            <OptimizedImage
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full"
                                imageClassName="object-cover"
                                priority
                            />
                        </div>
                    </motion.div>

                    {/* Post Content */}
                    <div className="grid lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8">
                            <div
                                className="prose prose-invert prose-primary max-w-none 
                prose-headings:font-bold prose-headings:tracking-tight 
                prose-p:text-muted-foreground/90 prose-p:leading-relaxed prose-p:text-lg
                prose-strong:text-foreground prose-strong:font-bold
                prose-blockquote:border-l-primary prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:italic
                prose-img:rounded-2xl"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />

                            {/* Tags */}
                            {post.tags && (
                                <div className="mt-16 flex flex-wrap gap-2 pt-8 border-t border-white/5">
                                    {post.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors uppercase text-[10px] tracking-widest px-3 py-1">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Share Bottom */}
                            <div className="mt-8 flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5">
                                <span className="font-bold text-sm">Did you enjoy this article?</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Share:</span>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="icon" className="rounded-full w-9 h-9">
                                            <Facebook className="w-4 h-4" />
                                        </Button>
                                        <Button variant="secondary" size="icon" className="rounded-full w-9 h-9">
                                            <Twitter className="w-4 h-4" />
                                        </Button>
                                        <Button variant="secondary" size="icon" className="rounded-full w-9 h-9">
                                            <Linkedin className="w-4 h-4" />
                                        </Button>
                                        <Button variant="secondary" size="icon" className="rounded-full w-9 h-9" onClick={handleCopyLink}>
                                            <LinkIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="lg:col-span-4 space-y-12">
                            <div className="sticky top-32">
                                <GlassCard className="p-8 border-primary/20 mb-12">
                                    <h4 className="text-xl font-bold mb-4">Newsletter</h4>
                                    <p className="text-sm text-muted-foreground mb-6">Get our best content sent directly to your inbox every week.</p>
                                    <div className="space-y-3">
                                        <input
                                            type="email"
                                            placeholder="Email address"
                                            className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                                        />
                                        <Button className="w-full rounded-full font-bold">Subscribe</Button>
                                    </div>
                                </GlassCard>

                                {relatedPosts.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-widest mb-6 border-l-2 border-primary pl-4">Related Stories</h4>
                                        <div className="space-y-6">
                                            {relatedPosts.map(rp => (
                                                <Link key={rp.id} to={`/blog/${rp.id}`} className="group block">
                                                    <div className="flex gap-4 items-start">
                                                        <div className="w-20 h-20 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                                                            <OptimizedImage
                                                                src={rp.image}
                                                                alt={rp.title}
                                                                className="w-full h-full"
                                                                imageClassName="object-cover transition-transform group-hover:scale-110"
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h5 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-1">
                                                                {rp.title}
                                                            </h5>
                                                            <p className="text-[10px] text-muted-foreground uppercase">{rp.date}</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </article>

            {/* Recommended CTA */}
            <section className="pb-32">
                <div className="container mx-auto px-4">
                    <GlassCard className="p-12 md:p-16 text-center border-white/5 bg-gradient-to-br from-primary/5 to-purple-500/5">
                        <h2 className="text-3xl font-bold mb-6">Ready to start your next project?</h2>
                        <p className="text-muted-foreground mb-10 max-w-xl mx-auto">From AI-driven branding to custom digital products, we help creative pioneers build the future.</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button size="lg" className="rounded-full px-8 shadow-xl shadow-primary/20" asChild>
                                <Link to="/contact">Work With Us</Link>
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                                <Link to="/portfolio">View Portfolio</Link>
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            </section>
        </Layout>
    );
};

export default BlogPostDetail;

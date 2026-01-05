import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, X, ArrowRight, Eye } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';

const categories = ['All', 'Prompts', 'Templates', 'Branding', 'UI Kits', 'Mockups'];

const products = [
  { id: 1, title: 'AI Art Prompt Pack Vol. 1', price: 29, category: 'Prompts', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop', description: '100+ premium AI art prompts for Midjourney, DALL-E, and Stable Diffusion' },
  { id: 2, title: 'Social Media Templates', price: 49, category: 'Templates', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop', description: '50 customizable templates for Instagram, Twitter, and LinkedIn' },
  { id: 3, title: 'Brand Guidelines Kit', price: 79, category: 'Branding', image: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=300&fit=crop', description: 'Complete brand identity template with guidelines and assets' },
  { id: 4, title: 'Dashboard UI Kit', price: 99, category: 'UI Kits', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', description: 'Modern dashboard components for Figma and Sketch' },
  { id: 5, title: 'Device Mockup Bundle', price: 39, category: 'Mockups', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop', description: '30+ device mockups including phones, tablets, and laptops' },
  { id: 6, title: 'Cyberpunk Prompts', price: 24, category: 'Prompts', image: 'https://images.unsplash.com/photo-1614850715649-1d0106293bd1?w=400&h=300&fit=crop', description: '75 cyberpunk-themed prompts for futuristic art generation' },
  { id: 7, title: 'Pitch Deck Template', price: 59, category: 'Templates', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop', description: 'Professional pitch deck with 40+ slides for startups' },
  { id: 8, title: 'Logo Template Pack', price: 69, category: 'Branding', image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop', description: '25 customizable logo templates in vector format' },
  { id: 9, title: 'Mobile App UI Kit', price: 89, category: 'UI Kits', image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&h=300&fit=crop', description: 'Complete mobile app design system with 100+ components' },
];

const Store = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(product => product.category === activeCategory);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              Digital Store
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Premium Digital Products
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover our collection of premium digital assets, templates, and AI prompts 
              to supercharge your creative workflow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-12"
          >
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </motion.div>

          {/* Products Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard className="overflow-hidden p-0 group">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="icon">
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>
                      <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-background text-foreground text-sm font-bold shadow-lg">
                        ${product.price}
                      </span>
                    </div>
                    <div className="p-5">
                      <span className="text-xs text-primary font-medium uppercase tracking-wide">
                        {product.category}
                      </span>
                      <h3 className="font-semibold text-foreground mt-1 mb-2">{product.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      <Button className="w-full mt-4" size="sm">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl w-full bg-card border border-border rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10"
                onClick={() => setSelectedProduct(null)}
              >
                <X className="w-5 h-5" />
              </Button>
              
              <div className="grid md:grid-cols-2">
                <div className="aspect-square">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <span className="text-xs text-primary font-medium uppercase tracking-wide">
                    {selectedProduct.category}
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mt-2 mb-4">
                    {selectedProduct.title}
                  </h2>
                  <p className="text-muted-foreground mb-6">{selectedProduct.description}</p>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-3xl font-bold text-foreground">${selectedProduct.price}</span>
                    <span className="text-sm text-muted-foreground">One-time purchase</span>
                  </div>
                  <Button size="lg" className="w-full">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
              Need Something Custom?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Can't find what you're looking for? Let's create something unique for your needs.
            </p>
            <Button size="lg" asChild>
              <Link to="/contact">
                Get Custom Quote
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Store;

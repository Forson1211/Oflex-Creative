import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Palette, Code, Zap, Layers, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';

const services = [
  {
    icon: Sparkles,
    title: 'Creative Prompt Engineering',
    description: 'Custom AI prompts crafted for stunning image generation. Perfect for artists, marketers, and content creators looking to elevate their visual output.',
    features: ['Custom prompt templates', 'Style-specific prompts', 'Negative prompt optimization', 'Multi-platform compatibility'],
  },
  {
    icon: Palette,
    title: 'Digital Product Design',
    description: 'Premium digital products including templates, mockups, and design assets. Ready-to-use resources that save time and enhance your projects.',
    features: ['Social media templates', 'Presentation decks', 'Marketing materials', 'Print-ready designs'],
  },
  {
    icon: Layers,
    title: 'Branding & Visual Design',
    description: 'Complete brand identity packages including logos, color systems, and brand guidelines. Build a cohesive visual presence that stands out.',
    features: ['Logo design', 'Brand guidelines', 'Color palettes', 'Typography systems'],
  },
  {
    icon: Code,
    title: 'UI/UX Design',
    description: 'User-centered interface design for web and mobile applications. Beautiful, functional designs that convert visitors into customers.',
    features: ['Web app interfaces', 'Mobile app design', 'Design systems', 'Prototyping'],
  },
  {
    icon: Zap,
    title: 'AI Automation Consulting',
    description: 'Optimize your creative workflow with AI-powered solutions. From content generation to design automation, we help you work smarter.',
    features: ['Workflow analysis', 'Tool integration', 'Process automation', 'Training & support'],
  },
  {
    icon: Wand2,
    title: 'Custom Design Solutions',
    description: 'Bespoke design services tailored to your unique needs. Whether it\'s a one-off project or ongoing support, we\'ve got you covered.',
    features: ['Custom illustrations', 'Motion graphics', 'Print design', 'Packaging design'],
  },
];

const Services = () => {
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
              Our Services
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Creative Solutions for Every Need
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              From AI-powered prompts to complete brand identities, we offer comprehensive 
              creative services to elevate your brand and streamline your workflow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="h-full">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <service.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xl text-foreground mb-3">{service.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge="Our Process"
            title="How We Work"
            description="A streamlined approach to deliver exceptional results"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Discovery', description: 'Understanding your needs, goals, and vision' },
              { step: '02', title: 'Strategy', description: 'Creating a tailored plan for your project' },
              { step: '03', title: 'Creation', description: 'Bringing your vision to life with precision' },
              { step: '04', title: 'Delivery', description: 'Final review and handover of your assets' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Let's discuss your project and find the perfect solution for your needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/contact">
                  Start a Project
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/store">Browse Products</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'hello@oflexcreative.com' },
  { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567' },
  { icon: MapPin, label: 'Location', value: 'San Francisco, CA' },
];

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success('Message sent successfully! We\'ll get back to you soon.');
    
    // Reset form after animation
    setTimeout(() => {
      setIsSubmitted(false);
      (e.target as HTMLFormElement).reset();
    }, 3000);
  };

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
              Contact Us
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Let's Work Together
            </h1>
            <p className="text-lg text-muted-foreground">
              Have a project in mind? We'd love to hear from you. 
              Send us a message and we'll respond as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Get In Touch</h2>
                <p className="text-muted-foreground">
                  Ready to start your project? Contact us through any of these channels.
                </p>
              </div>

              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <GlassCard hover={false} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{info.label}</p>
                      <p className="font-medium text-foreground">{info.value}</p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="font-semibold text-foreground mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {['Instagram', 'Twitter', 'LinkedIn'].map((social) => (
                    <a
                      key={social}
                      href="#"
                      className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
                    >
                      {social}
                    </a>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <GlassCard hover={false} className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="What's this about?"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your project..."
                      rows={6}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full md:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                        />
                        Sending...
                      </>
                    ) : isSubmitted ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Sent!
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <SectionHeading
            badge="FAQ"
            title="Common Questions"
            description="Quick answers to questions you might have"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { q: 'What is your typical response time?', a: 'We typically respond within 24 hours during business days.' },
              { q: 'Do you offer custom design services?', a: 'Yes! We offer bespoke design solutions tailored to your specific needs.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards and PayPal for digital products.' },
              { q: 'Can I request revisions?', a: 'Absolutely. We work with you until you\'re completely satisfied.' },
            ].map((faq, index) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard hover={false}>
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm">{faq.a}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;

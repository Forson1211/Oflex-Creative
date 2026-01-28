-- ============================================
-- IMPORT EXISTING BLOG POSTS TO DATABASE
-- Run this script in your Supabase SQL Editor
-- This will make your static blog posts editable in the Admin Dashboard
-- ============================================

INSERT INTO public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  category,
  author,
  image_url,
  read_time,
  tags,
  is_published,
  is_featured,
  views_count,
  published_at
) VALUES
(
  'How AI is Revolutionizing Digital Design in 2026',
  'how-ai-is-revolutionizing-digital-design-in-2026',
  'The intersection of artificial intelligence and creative craft is producing results we never thought possible. Explore the future of automated aesthetics.',
  '<p>The landscape of digital design has shifted dramatically over the past few years. By 2026, artificial intelligence is no longer just a tool—it''s a creative partner. At Oflex Creative Studio, we''ve integrated these advancements into every layer of our workflow, from initial concept to final polish.</p>

<h2>The Rise of Algorithmic Aesthetics</h2>
<p>Iterative design used to take weeks. Now, with generative models trained on vast design systems, we can explore hundreds of creative directions in minutes. This doesn''t replace the designer; it liberates them to focus on the high-level strategy and emotional resonance that machines still can''t replicate.</p>

<blockquote>"Design is not just what it looks like and feels like. Design is how it works. And AI is helping us make it work smarter."</blockquote>

<h2>What This Means for You</h2>
<p>For our clients, this means faster turnaround times without sacrificing the bespoke quality we''re known for. We''re now building interfaces that adapt in real-time to user behavior, creating a "living" brand experience that stays relevant as long as it''s online.</p>

<p>Stay tuned as we continue to push the boundaries of what''s possible in the age of automation.</p>',
  'Innovation',
  'Admin',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
  '5 min',
  ARRAY['AI', 'Design', 'Future', 'Tech'],
  true,
  true,
  0,
  '2026-01-24T00:00:00Z'
),
(
  'The Secret to High-Converting Canva Templates',
  'the-secret-to-high-converting-canva-templates',
  'Consistency and psychological triggers are the backbone of any template that sells. Learn our top 5 tips for viral template design.',
  '<p>Why do some templates sell thousands of copies while others sit untouched? The answer lies in psychology and utility. In this guide, we''re pulling back the curtain on how we build our best-selling Canva assets.</p>

<h2>1. The Power of "Modular Design"</h2>
<p>A good template isn''t rigid. It should feel like a Lego set. Every element should be easily swappable without breaking the visual hierarchy. We spend hours testing our layouts with different text lengths to ensure they stay beautiful no matter what the user inputs.</p>

<h2>2. Color Theory for Conversion</h2>
<p>We don''t just pick colors that look pretty. We pick colors that evoke action. For social media templates, high-contrast pairings are essential to stop the scroll.</p>

<ul>
  <li><strong>Red:</strong> Urgency and passion. Great for sales.</li>
  <li><strong>Blue:</strong> Trust and reliability. Perfect for corporate brands.</li>
  <li><strong>Yellow:</strong> Positivity and warmth. Ideal for wellness content.</li>
</ul>

<h2>Conclusion</h2>
<p>Creating a high-converting template is about solving a problem for your customer before they even realize they have it. Keep it simple, keep it flexible, and keep the user''s end goal in mind.</p>',
  'Tutorial',
  'Creative Director',
  'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=800',
  '8 min',
  ARRAY['Canva', 'Templates', 'Marketing', 'Passive Income'],
  true,
  false,
  0,
  '2026-01-18T00:00:00Z'
),
(
  'Oflex Studio: Our Brand Evolution Journey',
  'oflex-studio-our-brand-evolution-journey',
  'Behind the scenes of our recent rebrand. Why we moved towards glassmorphism and high-performance digital aesthetics.',
  '<p>Evolution is the only constant. When we first started Oflex, our look was grounded in traditional minimalism. But as the world moved towards deep interaction and immersive visuals, we knew we had to evolve.</p>

<h2>The Glassmorphism Decision</h2>
<p>We wanted our brand to feel like "the future of clarity." Glassmorphism—with its blurs, transparency, and vibrant gradients—gave us the depth we were looking for. It suggests layers of intelligence and a "peek under the hood" transparency that clients love.</p>

<h2>Performance Meets Luxury</h2>
<p>A premium brand doesn''t just look good; it runs perfectly. Part of our rebrand involved a complete overhaul of our tech stack to ensure that even with heavy visual effects, our site loads in under a second on mobile. That''s the Oflex promise.</p>',
  'Studio News',
  'Founder',
  'https://images.unsplash.com/photo-1550745165-9bc0b252728f?auto=format&fit=crop&q=80&w=800',
  '4 min',
  ARRAY['Branding', 'Studio', 'Growth', 'Behind The Scenes'],
  true,
  false,
  0,
  '2026-01-12T00:00:00Z'
),
(
  'Mastering Prompt Engineering for Visual Artists',
  'mastering-prompt-engineering-for-visual-artists',
  'Words are the new brushes. A comprehensive guide on structuring prompts to get exactly what you visualize in AI image generators.',
  '<p>Prompt engineering is the new literacy for visual creators. If you can''t describe it, you can''t create it. Here is our master framework for getting elite results from tools like Midjourney and DALL-E 3.</p>

<h2>The "Scene-Style-Technical" Framework</h2>
<p>Never just type "a cool car." Be specific. Use our three-pillar approach:</p>

<ol>
  <li><strong>Scene:</strong> What is happening? The subject, the action, and the environment.</li>
  <li><strong>Style:</strong> What is the artistic vibe? Cyberpunk, film noir, 35mm photography, or 16-bit pixel art?</li>
  <li><strong>Technical:</strong> What are the camera settings? f/1.8 aperture, cinematic lighting, 8k resolution, or volumetric fog.</li>
</ol>

<p>By mastering this structure, you move from "hoping for something good" to "directing the machine" with surgical precision.</p>',
  'Guide',
  'Staff Architect',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
  '12 min',
  ARRAY['AI Prompting', 'Creative Guide', 'Art', 'Workflow'],
  true,
  false,
  0,
  '2026-01-05T00:00:00Z'
)
ON CONFLICT (slug) DO NOTHING;

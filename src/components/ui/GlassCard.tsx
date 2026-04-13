import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  hover?: boolean;
}

export const GlassCard = ({ className, hover = true, children, ...props }: GlassCardProps) => {
  return (
    <motion.div
      whileHover={hover ? { y: -8, scale: 1.01 } : undefined}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'glass-ios relative overflow-hidden p-6 rounded-[24px]',
        'shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]',
        'glass-noise transition-all duration-300',
        hover && 'hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)]',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

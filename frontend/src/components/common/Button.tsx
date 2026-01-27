import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '', 
  ...props 
}: ButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`btn-${variant} btn-${size} ${className}`}
      disabled={isLoading || props.disabled}
      style={{
        padding: size === 'md' ? '0.75rem 1.5rem' : '0.5rem 1rem',
        borderRadius: 'var(--radius)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        ...props.style
      } as React.CSSProperties}
      {...(props as HTMLMotionProps<'button'>)}
    >
      {isLoading ? (
        <span className="animate-spin">◌</span>
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;

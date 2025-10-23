import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ 
  children, 
  className = '', 
  delay = 0, 
  hover = true,
  onClick,
  ...props 
}) => {
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.9,
      rotateX: -15
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      rotateX: 0,
      transition: { 
        duration: 0.5, 
        delay,
        ease: "easeOut"
      }
    },
    hover: hover ? {
      scale: 1.05,
      y: -8,
      rotateX: 5,
      rotateY: 5,
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
      transition: { duration: 0.2 }
    } : {}
  };

  return (
    <motion.div
      className={`bg-gray-700/50 rounded-lg border border-gray-600 transition-all duration-300 ${className}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hover ? "hover" : {}}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;

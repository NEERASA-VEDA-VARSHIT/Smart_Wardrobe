import React from 'react';
import { motion } from 'framer-motion';

const StatusIndicator = ({ status, freshnessScore, wearCount, className = "" }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'fresh':
        return {
          emoji: '🟢',
          label: 'Fresh',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          description: 'Clean and ready to wear'
        };
      case 'worn_wearable':
        return {
          emoji: '🟡',
          label: 'Worn but Wearable',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          description: 'Can be worn again'
        };
      case 'needs_wash':
        return {
          emoji: '🟠',
          label: 'Needs Wash',
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
          description: 'Should be washed soon'
        };
      case 'in_laundry':
        return {
          emoji: '🔵',
          label: 'In Laundry',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          description: 'Currently in laundry bag'
        };
      default:
        return {
          emoji: '⚪',
          label: 'Unknown',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          description: 'Status unknown'
        };
    }
  };

  const config = getStatusConfig(status);
  const scoreColor = freshnessScore >= 80 ? 'text-green-400' : 
                     freshnessScore >= 60 ? 'text-yellow-400' : 
                     freshnessScore >= 40 ? 'text-orange-400' : 'text-red-400';

  return (
    <motion.div 
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color} ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-lg">{config.emoji}</span>
      <span>{config.label}</span>
      
      {/* Freshness Score */}
      {freshnessScore !== undefined && (
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-400">Freshness:</span>
          <span className={`text-xs font-bold ${scoreColor}`}>
            {freshnessScore}%
          </span>
        </div>
      )}
      
      {/* Wear Count */}
      {wearCount > 0 && (
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-400">Worn:</span>
          <span className="text-xs font-bold text-gray-300">
            {wearCount}x
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default StatusIndicator;

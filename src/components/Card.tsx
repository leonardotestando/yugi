import React from 'react';
import { motion } from 'motion/react';
import { GameCard } from '../types';

interface CardProps {
  key?: React.Key;
  card: GameCard | null;
  isHidden?: boolean;
  isSelected?: boolean;
  isTargetable?: boolean;
  onClick?: () => void;
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  size?: 'small' | 'large';
}

export function Card({ card, isHidden, isSelected, isTargetable, onClick, className = '', draggable, onDragStart, size = 'small' }: CardProps) {
  const sizeClasses = size === 'large' 
    ? 'w-48 h-72 sm:w-64 sm:h-96 text-sm sm:text-base p-2' 
    : 'w-full h-full text-[9px] sm:text-[10px] p-0.5';

  if (!card) {
    return null; // Zones handle the empty state now
  }
  
  if (isHidden || card.position === 'SET') {
    return (
      <motion.div 
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart}
        whileHover={onClick || draggable ? { scale: 1.05, y: -5 } : {}}
        whileTap={onClick || draggable ? { scale: 0.95 } : {}}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`${sizeClasses} bg-[#4a3b2c] border-[3px] border-[#2a1b0c] shadow-md bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] ${className} ${onClick || draggable ? 'cursor-pointer' : ''}`}
        style={{
          rotate: card.position === 'SET' ? 90 : 0
        }}
      >
        <div className="w-full h-full border border-black/50 flex items-center justify-center">
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-black/30 bg-black/20 flex items-center justify-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-black/20 bg-black/10" />
          </div>
        </div>
      </motion.div>
    );
  }
  
  const isMonster = card.type === 'MONSTER';
  const bgColor = isMonster ? 'bg-[#d4a373]' : 'bg-[#40916c]';
  
  return (
    <motion.div 
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      whileHover={onClick || draggable ? { scale: 1.05, y: -5, zIndex: 10 } : {}}
      whileTap={onClick || draggable ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isSelected ? 1.05 : 1,
        y: isSelected ? -10 : 0,
        boxShadow: isSelected 
          ? '0 0 20px rgba(250,204,21,0.8)' 
          : isTargetable 
            ? '0 0 20px rgba(239,68,68,0.8)' 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 20,
        boxShadow: {
          repeat: isTargetable ? Infinity : 0,
          repeatType: "reverse",
          duration: 0.5
        }
      }}
      className={`relative ${sizeClasses} ${bgColor} border-[3px] ${isSelected ? 'border-yellow-400 z-20' : isTargetable ? 'border-red-500 cursor-crosshair z-20' : 'border-[#5c4033]'} flex flex-col text-black ${onClick || draggable ? 'cursor-pointer' : ''} ${className}`}
      style={{
        rotate: card.position === 'DEFENSE' ? 90 : 0
      }}
    >
      {/* Card Name */}
      <div className={`font-bold truncate bg-white/60 border border-black/30 px-1 ${size === 'large' ? 'mb-1 text-lg' : 'mb-0.5 text-[8px] sm:text-[9px]'}`}>
        {card.name}
      </div>
      
      {/* Card Level/Type Indicator */}
      <div className={`flex justify-end ${size === 'large' ? 'mb-1' : 'mb-0.5'}`}>
        {isMonster && card.level && (
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(card.level, 12) }).map((_, i) => (
              <div key={i} className={`rounded-full bg-yellow-400 border border-orange-600 ${size === 'large' ? 'w-4 h-4' : 'w-1.5 h-1.5'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Card Image Placeholder */}
      <div className={`bg-zinc-200 border border-black/50 flex-1 flex items-center justify-center overflow-hidden ${size === 'large' ? 'mb-1' : 'mb-0.5'}`}>
        <div className="w-full h-full bg-gradient-to-br from-zinc-300 to-zinc-500 flex items-center justify-center">
          <span className="text-zinc-600 font-bold opacity-40 rotate-45 select-none">{card.type}</span>
        </div>
      </div>

      {/* Card Stats Box (Retro Style) */}
      <div className={`bg-[#fefae0] border border-black/50 flex flex-col ${size === 'large' ? 'h-24 p-1' : 'h-6 sm:h-8 p-0.5'}`}>
        {size === 'large' && (
          <div className="text-xs leading-tight overflow-hidden flex-1 mb-1">
            {card.description}
          </div>
        )}
        {isMonster && (
          <div className={`flex justify-between items-end font-mono font-bold w-full ${size === 'large' ? 'text-base mt-auto' : 'text-[7px] sm:text-[8px] mt-auto'}`}>
            <span className="text-red-700">ATK {card.atk}</span>
            <span className="text-blue-700">DEF {card.def}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

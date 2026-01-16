"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: number;
};

export function StarRating({ rating, onRatingChange, readOnly = false, size = 24 }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={cn(
            'transition-colors',
            readOnly ? '' : 'cursor-pointer',
            (hoverRating >= star || rating >= star) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'
          )}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          onClick={() => !readOnly && onRatingChange?.(star)}
        />
      ))}
    </div>
  );
}

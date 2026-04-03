'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  isNegative?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon, color = 'text-primary', isNegative = false, className }: StatCardProps) {
  const formattedValue = typeof value === 'number'
    ? isNegative
      ? `-${Math.abs(value).toLocaleString()}`
      : value.toLocaleString()
    : value;

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 25px -5px oklch(0.696 0.17 162.48 / 15%)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={cn('relative overflow-hidden', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-sm text-muted-foreground truncate">{title}</p>
              <p className={cn(
                'text-2xl font-bold tracking-tight truncate',
                isNegative ? 'text-red-500' : 'text-foreground'
              )}>
                {formattedValue}
              </p>
            </div>
            <div className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10',
              color
            )}>
              {icon}
            </div>
          </div>
        </CardContent>
        {/* Subtle gradient accent line at top */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      </Card>
    </motion.div>
  );
}

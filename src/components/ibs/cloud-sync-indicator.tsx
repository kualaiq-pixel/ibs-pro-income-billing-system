'use client';

import { useRealtimeStatus } from '@/lib/supabase-realtime';
import { Cloud, Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function CloudSyncIndicator() {
  const status = useRealtimeStatus();

  const config = {
    connecting: {
      icon: Loader2,
      label: 'Connecting...',
      className: 'bg-muted/50 text-muted-foreground border-border animate-pulse',
      iconClass: 'animate-spin',
    },
    connected: {
      icon: Cloud,
      label: 'Cloud Synced',
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      iconClass: '',
    },
    reconnecting: {
      icon: Loader2,
      label: 'Reconnecting...',
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      iconClass: 'animate-spin',
    },
    error: {
      icon: AlertTriangle,
      label: 'Offline',
      className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
      iconClass: '',
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 text-[10px] font-normal transition-colors duration-300 ${c.className}`}>
      <Icon className={`h-3 w-3 ${c.iconClass}`} />
      <span className="hidden sm:inline">{c.label}</span>
    </Badge>
  );
}

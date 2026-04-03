'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit2, Trash2 } from 'lucide-react';
import { EmptyState } from './empty-state';
import { FileText } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  maxHeight?: string;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  emptyMessage = 'No data available',
  onEdit,
  onDelete,
  actions,
  maxHeight = 'max-h-96',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-10 w-10 text-muted-foreground" />}
        title={emptyMessage}
      />
    );
  }

  return (
    <div className="rounded-lg border">
      <ScrollArea className={maxHeight}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground ${col.className ?? ''}`}
                >
                  {col.header}
                </TableHead>
              ))}
              {(onEdit || onDelete || actions) && (
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[100px] text-right">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => (
              <TableRow
                key={item.id ?? idx}
                className="animate-fade-in transition-colors hover:bg-muted/50"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </TableCell>
                ))}
                {(onEdit || onDelete || actions) && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {actions && actions(item)}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => onEdit(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

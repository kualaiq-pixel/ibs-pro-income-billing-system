import { supabase } from './supabase';
import { toCamelArray, parseJsonFields } from './supabase-helpers';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

type TableName =
  | 'incomes'
  | 'expenses'
  | 'customers'
  | 'bookings'
  | 'work_orders'
  | 'maintenance_certificates'
  | 'shk_links'
  | 'audit_logs';

type DataType =
  | 'incomes'
  | 'expenses'
  | 'customers'
  | 'bookings'
  | 'workOrders'
  | 'maintenanceCertificates'
  | 'shkLinks'
  | 'auditLogs';

const JSON_FIELDS: Record<string, string[]> = {
  incomes: ['services', 'customerDetails'],
  work_orders: ['partsUsed', 'customerDetails', 'serviceQualityCheck'],
  maintenance_certificates: ['inspectionItems'],
};

// Map from Supabase table name to store DataType
const TABLE_TO_STORE_TYPE: Record<TableName, DataType> = {
  incomes: 'incomes',
  expenses: 'expenses',
  customers: 'customers',
  bookings: 'bookings',
  work_orders: 'workOrders',
  maintenance_certificates: 'maintenanceCertificates',
  shk_links: 'shkLinks',
  audit_logs: 'auditLogs',
};

// ── Channel Manager ──────────────────────────────────────────────────────────

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error';

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private companyId: string | null = null;
  private storeRef: unknown = null;
  private active = false;
  private connectionStatus: ConnectionStatus = 'connecting';
  private statusCallbacks: Set<(status: ConnectionStatus) => void> = new Set();

  // Tables that belong to a company (have company_id column)
  private companyTables: TableName[] = [
    'incomes',
    'expenses',
    'customers',
    'bookings',
    'work_orders',
    'maintenance_certificates',
    'shk_links',
  ];

  // Tables without company_id (global data)
  private globalTables: TableName[] = [
    'audit_logs',
  ];

  /**
   * Start real-time subscriptions for all business tables.
   * Company-scoped tables are filtered by company_id.
   */
  start(companyId: string, storeSetData: (type: DataType, data: unknown[]) => void) {
    if (this.companyId === companyId && this.active) return;

    this.stop(); // clean up old channels
    this.companyId = companyId;
    this.storeRef = storeSetData;
    this.active = true;
    this.setStatus('connecting');

    for (const table of [...this.companyTables, ...this.globalTables]) {
      this.subscribe(table);
    }

    console.log('[Realtime] Subscribed to all tables for company', companyId);
  }

  /**
   * Stop all subscriptions and clean up.
   */
  stop() {
    for (const [name, channel] of this.channels) {
      supabase.removeChannel(channel);
      console.log('[Realtime] Removed channel:', name);
    }
    this.channels.clear();
    this.companyId = null;
    this.storeRef = null;
    this.active = false;
    this.setStatus('connecting');
  }

  /**
   * Check if realtime is currently active.
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Get the current connection status.
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Subscribe to connection status changes.
   * Returns an unsubscribe function.
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  private setStatus(status: ConnectionStatus) {
    if (this.connectionStatus === status) return;
    this.connectionStatus = status;
    console.log('[Realtime] Status:', status);
    for (const cb of this.statusCallbacks) {
      cb(status);
    }
  }

  /**
   * Subscribe to a single table's changes.
   * Company tables use a company_id filter; global tables listen to all changes.
   */
  private subscribe(table: TableName) {
    const channelName = `rt-${table}-${this.companyId}`;
    const storeType = TABLE_TO_STORE_TYPE[table];
    const jsonFields = JSON_FIELDS[table] || [];
    const isCompanyTable = this.companyTables.includes(table);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',       // INSERT, UPDATE, DELETE
          schema: 'public',
          table: table,
          filter: isCompanyTable && this.companyId
            ? `company_id=eq.${this.companyId}`
            : undefined,
        },
        async () => {
          if (!this.storeRef) return;
          // Re-fetch the full table data from Supabase to ensure consistency
          await this.refetchTable(table, storeType, jsonFields, isCompanyTable);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Subscribed:', channelName);
          this.setStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Error on:', channelName);
          this.setStatus('error');
          // Auto-retry after 3 seconds
          setTimeout(() => {
            if (this.active) {
              this.setStatus('reconnecting');
              this.subscribe(table);
            }
          }, 3000);
        } else if (status === 'TIMED_OUT') {
          this.setStatus('reconnecting');
        }
      });

    this.channels.set(channelName, channel);
  }

  /**
   * Re-fetch all data from a table and update the store.
   * This ensures data consistency across all devices.
   */
  private async refetchTable(table: TableName, storeType: DataType, jsonFields: string[], isCompanyTable: boolean) {
    try {
      let query = supabase.from(table).select('*').order('created_at', { ascending: false });

      // Apply company filter only for tables that have company_id
      if (isCompanyTable && this.companyId) {
        query = query.eq('company_id', this.companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[Realtime] Refetch error for ${table}:`, error.message);
        return;
      }

      // Convert snake_case to camelCase and parse JSON fields
      let processed = toCamelArray<Record<string, unknown>>((data || []) as unknown as Record<string, unknown>[]);

      if (jsonFields.length > 0) {
        processed = processed.map((row) => parseJsonFields<Record<string, unknown>>(row, jsonFields));
      }

      // Update the store
      const setData = this.storeRef as (type: DataType, data: unknown[]) => void;
      setData(storeType, processed);
    } catch (err) {
      console.error(`[Realtime] Failed to refetch ${table}:`, err);
    }
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

export const realtimeManager = new RealtimeManager();

// ── React Hook ──────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useAppStore, type DataType } from '@/store/app-store';

/**
 * useRealtimeSync - Hook that activates Supabase real-time subscriptions
 * for the current company. When any data changes in the cloud database,
 * the store is automatically updated, keeping all devices in sync.
 *
 * Usage: Call this once in the CompanyDashboard component.
 */
export function useRealtimeSync() {
  const currentUser = useAppStore((s) => s.currentUser);
  const setData = useAppStore((s) => s.setData);
  const companyId = currentUser?.companyId ?? null;

  useEffect(() => {
    if (!companyId) {
      // Not logged in or no company — stop subscriptions
      realtimeManager.stop();
      return;
    }

    // Start subscriptions (singleton manager prevents duplicates)
    realtimeManager.start(companyId, setData as (type: DataType, data: unknown[]) => void);

    return () => {
      // Clean up on unmount
      realtimeManager.stop();
    };
  }, [companyId, setData]);
}

/**
 * useRealtimeStatus - Hook that provides the current realtime connection status.
 * Useful for showing a cloud sync indicator in the UI.
 */
export function useRealtimeStatus() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'error'>(
    () => realtimeManager.getConnectionStatus()
  );

  useEffect(() => {
    const unsub = realtimeManager.onStatusChange(setStatus);
    return unsub;
  }, []);

  return status;
}

/**
 * Get the current realtime connection status (non-hook version).
 */
export function getConnectionStatus() {
  return realtimeManager.getConnectionStatus();
}

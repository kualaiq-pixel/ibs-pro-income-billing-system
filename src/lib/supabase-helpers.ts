import { supabase } from './supabase';

// Convert snake_case to camelCase (recursive for nested objects/arrays)
export function toCamel<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
          ? toCamel(item as Record<string, unknown>)
          : item
      );
    } else if (value !== null && typeof value === 'object') {
      result[camelKey] = toCamel(value as Record<string, unknown>);
    } else {
      result[camelKey] = value;
    }
  }
  return result as T;
}

export function toCamelArray<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map(row => toCamel<T>(row));
}

// Parse JSON fields stored as TEXT in Supabase
export function parseJsonFields<T>(row: Record<string, unknown>, fields: string[]): T {
  const result = { ...row };
  for (const field of fields) {
    if (typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field] as string);
      } catch {
        // keep as-is
      }
    }
  }
  return result as T;
}

// Stringify JSON fields for writing to Supabase
export function stringifyJsonFields(row: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const result = { ...row };
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null && typeof result[field] !== 'string') {
      result[field] = JSON.stringify(result[field]);
    } else if (result[field] === undefined || result[field] === null) {
      result[field] = fields.includes(field) && !field.includes('customer_details') ? '[]' : '';
    }
  }
  return result;
}

// Create audit log entry
export async function createAuditLog(userId: string | null, userName: string, description: string) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    user_name: userName,
    description,
  });
}

// Convert camelCase object to snake_case for Supabase insert/update
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

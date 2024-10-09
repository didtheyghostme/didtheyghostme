import { DBTableValues } from "@/lib/constants/dbTables";

type ErrorMessage<K> = K extends string ? `Error: '${K}' must be a const value in DBTable, e.g. using [DBTable.Company] -> returns company` : never;

/**
 * Defines the shape of the select fields for constructing a select query.
 *
 * @template T - The type representing the typing schema.
 */
export type SelectObject<T> = {
  [K in keyof T]: T[K] extends object ? (K extends DBTableValues ? SelectObject<T[K]> : ErrorMessage<K>) : boolean;
};

/**
 * Constructs a Supabase select query string based on the provided fields definition.
 * @type {SelectFrom< T >} - The select from definition e.g. SelectFrom< SelectedJobPosting >.
 * @returns {string} A string suitable for Supabase's select method.
 */
export function buildSelectString(obj: SelectObject<any>): string {
  const parts: string[] = [];

  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    if (value === true) {
      parts.push(key);
    } else if (typeof value === "object" && value !== null) {
      const nested = buildSelectString(value);

      parts.push(`${key} (${nested})`);
    }
  });

  return parts.join(", ");
}

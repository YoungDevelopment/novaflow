/**
 * Reusable ID Generator
 * Generates IDs like PREFIX-<number> (VDR-1, PRD-10, CUS-3, etc.)
 * Works for any table + any ID column.
 */

import { turso } from "@/lib/turso";

interface GenerateIdParams {
  tableName: string;
  idColumnName: string;
  prefix: string;
}

// This function should be called inside a transaction for safety.
export const generateCustomId = async ({
  tableName,
  idColumnName,
  prefix,
}: GenerateIdParams): Promise<string> => {
  const query = `
    SELECT ${idColumnName} AS id
    FROM ${tableName}
    WHERE ${idColumnName} LIKE ?
    ORDER BY
      CAST(SUBSTR(${idColumnName}, LENGTH(?) + 2) AS INTEGER) DESC
    LIMIT 1;
  `;

  const result = await turso.execute({
    sql: query,
    args: [`${prefix}-%`, prefix],
  });

  const lastId = result.rows.length > 0 ? (result.rows[0].id as string) : null;
  const nextNum = lastId ? parseInt(lastId.split("-")[1], 10) + 1 : 1;

  return `${prefix}-${nextNum}`;
};

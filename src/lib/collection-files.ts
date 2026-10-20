import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export type CollectionFile = { id: string; title: string; description: string | null; fileType: string };
/** No private storage path is returned to the client. */
export async function collectionFiles(collectionId: string): Promise<CollectionFile[]> {
  const query = await getDb().execute(sql`
    SELECT id::text AS id, title_it AS title, description_it AS description,
      file_type AS "fileType"
    FROM borsamia_private.collection_files
    WHERE collection_id = ${collectionId} AND visible = true
    ORDER BY display_order, title_it
  `);
  return query.rows.map(row => ({
    id: String(row.id), title: String(row.title),
    description: row.description === null ? null : String(row.description),
    fileType: String(row.fileType),
  }));
}

/** Private path is used only after the API route has verified the current entitlement. */
export async function collectionFilePath(collectionId: string, fileId: string): Promise<string | null> {
  const result = await getDb().execute(sql`
    SELECT storage_path FROM borsamia_private.collection_files
    WHERE id = ${fileId}::uuid AND collection_id = ${collectionId} AND visible = true LIMIT 1
  `);
  return result.rows.length ? String(result.rows[0].storage_path) : null;
}

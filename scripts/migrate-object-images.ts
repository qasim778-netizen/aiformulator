import fs from "fs/promises";
import path from "path";
import { sql } from "../server/db";
import { ObjectStorageService } from "../server/objectStorage";
import { LOCAL_UPLOAD_ROOT } from "../server/local-upload";

type ImageRecord = {
  table: "categories" | "formulations" | "blog_posts" | "sample_products" | "formulators";
  id: string;
  column: string;
  value: string;
};

const tableColumns: Array<{ table: ImageRecord["table"]; columns: string[] }> = [
  { table: "categories", columns: ["image"] },
  { table: "formulations", columns: ["image", "thumbnail"] },
  { table: "blog_posts", columns: ["featured_image"] },
  { table: "sample_products", columns: ["image"] },
  { table: "formulators", columns: ["photo_url"] },
];

function safeFilename(objectPath: string): string {
  const original = path.basename(objectPath).split("?")[0];
  return original
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150) || "image.jpg";
}

function extensionForContentType(contentType: string | undefined): string {
  switch (contentType) {
    case "image/png": return ".png";
    case "image/webp": return ".webp";
    case "image/gif": return ".gif";
    case "image/jpeg":
    case "image/jpg":
    default: return ".jpg";
  }
}

function filenameWithExtension(objectPath: string, contentType?: string): string {
  const filename = safeFilename(objectPath);
  return path.extname(filename)
    ? filename
    : `${filename}${extensionForContentType(contentType)}`;
}

function localFolder(table: ImageRecord["table"]): string {
  switch (table) {
    case "categories": return "categories";
    case "formulations": return "formulations";
    case "blog_posts": return "blog";
    case "sample_products": return "sample-products";
    case "formulators": return "formulators";
    default: return "general";
  }
}

async function findObjectImages(): Promise<ImageRecord[]> {
  const records: ImageRecord[] = [];
  for (const { table, columns } of tableColumns) {
    for (const column of columns) {
      const rows = await sql(
        `SELECT id, "${column}" AS value FROM "${table}" WHERE "${column}" LIKE $1`,
        ["/objects/%"],
      );
      for (const row of rows as Array<{ id: string; value: string }>) {
        if (row.value) records.push({ table, id: row.id, column, value: row.value });
      }
    }
  }
  return records;
}

async function main() {
  const service = new ObjectStorageService();
  const records = await findObjectImages();
  console.log(`Found ${records.length} object-storage image references.`);

  let migrated = 0;
  let failed = 0;

  for (const record of records) {
    try {
      const source = await service.getObjectEntityFile(record.value);
      const [metadata] = await source.getMetadata();
      const [buffer] = await source.download();
      const filename = filenameWithExtension(record.value, metadata.contentType);
      const folder = localFolder(record.table);
      const relativePath = `/uploads/${folder}/${filename}`;
      const destination = path.join(LOCAL_UPLOAD_ROOT, folder, filename);

      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, buffer);
      await sql(
        `UPDATE "${record.table}" SET "${record.column}" = $1 WHERE id = $2`,
        [relativePath, record.id],
      );

      console.log(`Migrated ${record.table}.${record.column}: ${record.value} -> ${relativePath} (${metadata.contentType || "unknown"})`);
      migrated++;
    } catch (error) {
      failed++;
      console.error(`Failed ${record.table}.${record.column} for ${record.id}:`, error);
    }
  }

  console.log(`Migration complete: ${migrated} migrated, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Image migration failed:", error);
  process.exitCode = 1;
});
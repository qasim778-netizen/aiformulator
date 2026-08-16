import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import sharp from "sharp";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set([
  "formulations",
  "categories",
  "sample-products",
  "blog",
  "formulators",
  "general",
]);

export const LOCAL_UPLOAD_ROOT = path.resolve(
  process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads"),
);

export const localImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith("image/"));
  },
});

function safeFolder(folder: unknown): string {
  const value = typeof folder === "string" ? folder : "general";
  return ALLOWED_FOLDERS.has(value) ? value : "general";
}

function safeFilename(filename: string): { base: string; extension: string } {
  const extension = path.extname(filename).toLowerCase() || ".jpg";
  const base = path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "image";

  const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
  return {
    base,
    extension: allowedExtensions.has(extension) ? extension : ".jpg",
  };
}

export async function saveLocalImage(
  file: Express.Multer.File,
  folderInput?: unknown,
): Promise<{
  objectPath: string;
  thumbnailPath: string;
  filename: string;
}> {
  const folder = safeFolder(folderInput);
  const { base, extension } = safeFilename(file.originalname);
  const suffix = crypto.randomBytes(4).toString("hex");
  const filename = `${base}-${suffix}${extension}`;
  const directory = path.join(LOCAL_UPLOAD_ROOT, folder);
  const filePath = path.join(directory, filename);
  const thumbnailFilename = `${base}-${suffix}-thumb.jpg`;
  const thumbnailPath = path.join(directory, thumbnailFilename);

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(filePath, file.buffer);

  try {
    await sharp(file.buffer)
      .resize(400, 300, { fit: "cover", position: "center" })
      .jpeg({ quality: 80, progressive: true })
      .toFile(thumbnailPath);
  } catch (error) {
    console.error("[LocalUpload] Thumbnail generation failed:", error);
    await fs.rm(filePath, { force: true });
    throw new Error("The uploaded image could not be processed");
  }

  return {
    objectPath: `/uploads/${folder}/${filename}`,
    thumbnailPath: `/uploads/${folder}/${thumbnailFilename}`,
    filename,
  };
}

export async function generateLocalThumbnail(imagePath: string): Promise<string | null> {
  if (!imagePath.startsWith("/uploads/")) return null;

  const relativePath = imagePath.slice("/uploads/".length);
  const sourcePath = path.resolve(LOCAL_UPLOAD_ROOT, relativePath);
  const rootWithSeparator = `${LOCAL_UPLOAD_ROOT}${path.sep}`;
  if (!sourcePath.startsWith(rootWithSeparator)) {
    throw new Error("Invalid local image path");
  }

  const extension = path.extname(sourcePath);
  const thumbnailPath = sourcePath.slice(0, -extension.length) + "-thumb.jpg";

  try {
    await sharp(sourcePath)
      .resize(400, 300, { fit: "cover", position: "center" })
      .jpeg({ quality: 80, progressive: true })
      .toFile(thumbnailPath);
    return `/uploads/${relativePath.slice(0, -extension.length)}-thumb.jpg`;
  } catch (error) {
    console.error("[LocalUpload] Thumbnail generation failed:", error);
    return null;
  }
}
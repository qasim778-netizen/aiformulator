import sharp from "sharp";
import { objectStorageClient, ObjectStorageService } from "./objectStorage";
import { setObjectAclPolicy } from "./objectAcl";

const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 300;

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return { bucketName, objectName };
}

export async function generateThumbnail(imagePath: string): Promise<string | null> {
  try {
    const objectStorageService = new ObjectStorageService();
    const objectFile = await objectStorageService.getObjectEntityFile(imagePath);

    const [buffer] = await objectFile.download();

    const thumbnailBuffer = await sharp(buffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();

    const thumbFilename = imagePath
      .replace("/objects/", "")
      .replace(/\.[^.]+$/, "-thumb.jpg");

    const privateObjectDir = objectStorageService.getPrivateObjectDir();
    let entityDir = privateObjectDir;
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const fullPath = `${entityDir}${thumbFilename}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const bucket = objectStorageClient.bucket(bucketName);
    const thumbFile = bucket.file(objectName);

    await thumbFile.save(thumbnailBuffer, {
      metadata: {
        contentType: "image/jpeg",
      },
    });

    await setObjectAclPolicy(thumbFile, {
      owner: "system",
      visibility: "public",
    });

    return `/objects/${thumbFilename}`;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return null;
  }
}

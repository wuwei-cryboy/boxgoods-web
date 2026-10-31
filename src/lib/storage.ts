// lib/storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const IS_R2 = process.env.STORAGE_PROVIDER === "r2";

/** 单例 S3 Client（标准 S3 API，Supabase Storage / R2 都兼容） */
export const s3Client = new S3Client({
  region: IS_R2 ? "auto" : "us-east-1",
  endpoint: IS_R2
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}.supabase.co/storage/v1/s3`,
  credentials: {
    accessKeyId: IS_R2
      ? process.env.R2_ACCESS_KEY_ID!
      : process.env.SUPABASE_STORAGE_ACCESS_KEY!,
    secretAccessKey: IS_R2
      ? process.env.R2_SECRET_ACCESS_KEY!
      : process.env.SUPABASE_STORAGE_SECRET_KEY!,
  },
});

/** 上传文件（Buffer/Blob/ReadableStream） */
export async function uploadFile({
  bucket,
  key,
  body,
  contentType,
  cacheControl = "public, max-age=31536000, immutable",
}: {
  bucket: string;
  key: string;
  body: Buffer | Blob | ReadableStream;
  contentType: string;
  cacheControl?: string;
}) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body as unknown as Blob | Buffer | ReadableStream,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );
  return key;
}

/** 获取私有文件的预签名下载 URL（默认 1 小时） */
export async function getPresignedDownloadUrl(
  bucket: string,
  key: string,
  expiresIn = 3600
) {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
}

/** 获取直传预签名 URL（前端直传到存储桶，绕过 Next.js Body 限制） */
export async function getPresignedUploadUrl({
  bucket,
  key,
  contentType,
  expiresIn = 3600,
  conditions = [],
}: {
  bucket: string;
  key: string;
  contentType: string;
  expiresIn?: number;
  conditions?: unknown[]; // 如 [{ "content-length-range": 0, 5_000_000 }]
}) {
  const _ = conditions; // conditions 保留参数签名，当前由 bucket policy 承载
  const url = await getSignedUrl(
    s3Client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn }
  );
  return { url, key };
}

/** 删除文件 */
export async function deleteFile(bucket: string, key: string) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** 生成对象键（按日期分目录，防单目录文件过多） */
export function generateObjectKey(prefix: string, originalName: string) {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 10);
  const ext = originalName.split(".").pop()?.toLowerCase() || "bin";
  return `${prefix}/${y}/${m}/${d}/${rand}.${ext}`;
}

/** 验证上传后的文件（HEAD 请求校验类型、大小、可选魔数） */
export interface VerifyUploadOptions {
  bucket: string;
  key: string;
  expectedContentType?: string; // 如 "image/jpeg"
  maxSize?: number;             // 最大字节数
  checkMagicBytes?: boolean;    // 是否下载前几字节校验文件头
}

export interface VerifyUploadResult {
  ok: boolean;
  contentType?: string;
  contentLength?: number;
  error?: string;
}

export async function verifyUploadedFile(options: VerifyUploadOptions): Promise<VerifyUploadResult> {
  const { bucket, key, expectedContentType, maxSize, checkMagicBytes } = options;

  try {
    // 1. HEAD 请求获取元数据
    const headCommand = new HeadObjectCommand({ Bucket: bucket, Key: key });
    const headResponse = await s3Client.send(headCommand);

    const contentType = headResponse.ContentType;
    const contentLength = headResponse.ContentLength;

    // 2. 校验 Content-Type
    if (expectedContentType && contentType !== expectedContentType) {
      return { ok: false, contentType, contentLength, error: `Content-Type mismatch: expected ${expectedContentType}, got ${contentType}` };
    }

    // 3. 校验大小
    if (maxSize && contentLength && contentLength > maxSize) {
      return { ok: false, contentType, contentLength, error: `File too large: ${contentLength} > ${maxSize}` };
    }

    // 4. 可选：魔数校验（下载前 12 字节）
    if (checkMagicBytes && contentType?.startsWith("image/")) {
      const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key, Range: "bytes=0-11" });
      const getResponse = await s3Client.send(getCommand);
      const body = getResponse.Body;
      if (body) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of body as unknown as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
        const header = Buffer.concat(chunks);
        const isValidImage = 
          // JPEG: FF D8 FF
          (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) ||
          // PNG: 89 50 4E 47 0D 0A 1A 0A
          (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) ||
          // WebP: 52 49 46 46 ... 57 45 42 50
          (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) ||
          // GIF: 47 49 46 38
          (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38);

        if (!isValidImage) {
          return { ok: false, contentType, contentLength, error: "Invalid image magic bytes" };
        }
      }
    }

    return { ok: true, contentType, contentLength };
  } catch (err: unknown) {
    // 文件不存在等
    const message = err instanceof Error ? err.message : undefined;
    return { ok: false, error: message || "Verification failed" };
  }
}
import { Client } from "minio";
import sharp from "sharp";
import { env } from "../../config/env";

export interface StoredFile {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

const PUBLIC_URL_PROTOCOL = env.MINIO_USE_SSL ? "https" : "http";

export class StorageService {
  private readonly client: Client;

  public constructor() {
    this.client = new Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY
    });
  }

  public async uploadWebpAvatar(userId: string, input: Buffer): Promise<StoredFile> {
    const output = await sharp(input).resize(400, 400, { fit: "cover", position: "center" }).webp({ quality: 88 }).toBuffer();
    return this.uploadBuffer(`avatars/${userId}.webp`, output, "image/webp");
  }

  public async uploadSubjectPhoto(subjectId: string, input: Buffer): Promise<StoredFile> {
    const output = await sharp(input).resize(600, 600, { fit: "cover", position: "center" }).jpeg({ quality: 90 }).toBuffer();
    return this.uploadBuffer(`subjects/${subjectId}/photo.jpg`, output, "image/jpeg");
  }

  public async uploadBuffer(filename: string, buffer: Buffer, mimeType: string): Promise<StoredFile> {
    await this.ensureBucket();
    await this.client.putObject(env.MINIO_BUCKET, filename, buffer, buffer.byteLength, { "Content-Type": mimeType });

    return {
      filename,
      url: `${PUBLIC_URL_PROTOCOL}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${env.MINIO_BUCKET}/${filename}`,
      mimeType,
      size: buffer.byteLength
    };
  }

  public async getSignedUrl(filename: string, expirySeconds: number): Promise<string> {
    await this.ensureBucket();
    return this.client.presignedGetObject(env.MINIO_BUCKET, filename, expirySeconds);
  }

  public async deleteObject(filename: string): Promise<void> {
    await this.ensureBucket();
    await this.client.removeObject(env.MINIO_BUCKET, filename);
  }

  private async ensureBucket(): Promise<void> {
    const exists = await this.client.bucketExists(env.MINIO_BUCKET);

    if (!exists) {
      await this.client.makeBucket(env.MINIO_BUCKET, "us-east-1");
    }
  }
}

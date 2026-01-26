import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";

const PROJECT_REF = "zlbemopcgjohrnyyiwvs";
const CONFIG = {
  endpoint: process.env.SUPABASE_S3_ENDPOINT || `https://${PROJECT_REF}.storage.supabase.co/storage/v1/s3`,
  region: process.env.SUPABASE_S3_REGION || "ap-south-1",
  accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || "2160ce870540fd08f2eb07263230d1c3",
  secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || "3a8741980dd7fe3ba6b6cd3c8924484a9b665b547958680a10d835b9d0724ed4",
  bucket: process.env.SUPABASE_S3_BUCKET || "wangyiyun",
  functionUrl: process.env.SUPABASE_AUTH_URL || `https://${PROJECT_REF}.supabase.co/functions/v1/s3-auth`
};

const createS3Client = () => {
  return new S3Client({
    endpoint: CONFIG.endpoint,
    region: CONFIG.region,
    credentials: {
      accessKeyId: CONFIG.accessKeyId,
      secretAccessKey: CONFIG.secretAccessKey,
    },
    forcePathStyle: true,
    requestHandler: new FetchHttpHandler(),
  });
};

let s3Client: S3Client | null = null;

export interface CloudFile {
  key: string;
  size: number;
  lastModified?: Date;
  url: string;
  type: 'audio' | 'video' | 'image' | 'other';
}

const getFileType = (filename: string): CloudFile['type'] => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext || '')) return 'audio';
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext || '')) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
  return 'other';
};

const generatePublicUrl = (key: string) => {
  return `https://${PROJECT_REF}.storage.supabase.co/storage/v1/object/public/${CONFIG.bucket}/${encodeURIComponent(key)}`;
};

/**
 * Unlock session via backend function to get temporary token
 */
export const unlockSession = async (password: string): Promise<string | null> => {
  try {
    const response = await fetch(`${CONFIG.functionUrl}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.token;
  } catch (e) {
    console.error("Unlock failed", e);
    return null;
  }
};

/**
 * List files directly via S3 (Publicly readable)
 */
export const listCloudFiles = async (): Promise<CloudFile[]> => {
  try {
    if (!s3Client) s3Client = createS3Client();
    const command = new ListObjectsV2Command({ Bucket: CONFIG.bucket });
    const response = await s3Client.send(command);
    
    return (response.Contents || []).map(item => ({
      key: item.Key || "unknown",
      size: item.Size || 0,
      lastModified: item.LastModified,
      url: generatePublicUrl(item.Key || ""),
      type: getFileType(item.Key || "")
    }));
  } catch (error) {
    console.error("Error listing files:", error);
    return [];
  }
};

/**
 * Fetch object metadata to extract 'chinese-name'
 */
export const getFileMetadata = async (key: string): Promise<string | null> => {
  try {
    if (!s3Client) s3Client = createS3Client();
    const command = new HeadObjectCommand({ Bucket: CONFIG.bucket, Key: key });
    const response = await s3Client.send(command);
    const chineseName = response.Metadata?.['chinese-name'];
    return chineseName ? decodeURIComponent(chineseName) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Secure upload using Pre-signed URL workflow
 */
export const uploadFileSecurely = async (file: File, prefix: string = "", token: string): Promise<boolean> => {
  try {
    const ext = file.name.split('.').pop();
    const safeKey = `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

    // 1. Request pre-signed URL from function
    const authRes = await fetch(`${CONFIG.functionUrl}/object`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        action: 'upload', 
        bucket: CONFIG.bucket, 
        key: safeKey, 
        expires_in: 900
      })
    });

    if (!authRes.ok) throw new Error("Auth failed");
    const authData = await authRes.json();
    const presignedUrl = authData.url?.signedURL || authData.url;

    if (!presignedUrl) throw new Error("Could not retrieve presigned URL");

    // 2. Direct upload to the signed URL
    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });

    return uploadRes.ok;
  } catch (error) {
    console.error("Secure upload error:", error);
    return false;
  }
};

/**
 * Secure delete via backend function
 */
export const deleteFileSecurely = async (key: string, token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${CONFIG.functionUrl}/object`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        action: 'delete', 
        bucket: CONFIG.bucket, 
        key: key 
      })
    });
    return response.ok;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
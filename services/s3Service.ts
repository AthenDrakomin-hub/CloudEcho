
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { S3_CONFIG, DEFAULT_COVERS, EDGE_FUNCTION_CONFIG } from "../constants";
import { Song, Video } from "../types";
import { localTranslate } from "./translationService";

const client = new S3Client({
  endpoint: S3_CONFIG.endpoint,
  region: () => Promise.resolve(S3_CONFIG.region),
  credentials: () => Promise.resolve({
    accessKeyId: S3_CONFIG.accessKeyId,
    secretAccessKey: S3_CONFIG.secretAccessKey,
  }),
  forcePathStyle: true,
});

// IndexedDB 配置扩展
const DB_NAME = 'NocturneVirtualStorage';
const STORE_NAME = 'MediaCache';
const MAPPING_STORE = 'NameMapping';
const DB_VERSION = 3; // 升级版本以增加仓库

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('SubconsciousBlocks')) {
        db.createObjectStore('SubconsciousBlocks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MAPPING_STORE)) {
        db.createObjectStore(MAPPING_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 获取文件的虚拟显示名称
 */
export const getVirtualName = async (id: string, defaultName: string): Promise<string> => {
  try {
    const db = await getDB();
    const tx = db.transaction(MAPPING_STORE, 'readonly');
    const store = tx.objectStore(MAPPING_STORE);
    const result = await new Promise<any>((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    return result ? result.name : localTranslate(defaultName);
  } catch (e) {
    return localTranslate(defaultName);
  }
};

/**
 * 保存文件的虚拟显示名称
 */
export const saveVirtualName = async (id: string, name: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(MAPPING_STORE, 'readwrite');
  tx.objectStore(MAPPING_STORE).put({ id, name, timestamp: Date.now() });
};

export const getCachedMediaUrl = async (id: string, remoteUrl: string): Promise<string> => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const cached = await new Promise<any>((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (cached && cached.data instanceof Blob) {
      return URL.createObjectURL(cached.data);
    }

    const response = await fetch(remoteUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const writeTx = db.transaction(STORE_NAME, 'readwrite');
    writeTx.objectStore(STORE_NAME).put({
      id,
      data: blob,
      timestamp: Date.now(),
      name: remoteUrl.split('/').pop() || 'unknown'
    });
    return URL.createObjectURL(blob);
  } catch (e) {
    return remoteUrl;
  }
};

const getProjectRef = () => 'zlbemopcgjohrnyyiwvs';

const cleanKey = (fullPath: string, prefix: string): string => {
  let raw = fullPath;
  if (prefix && fullPath.startsWith(prefix)) {
    raw = fullPath.substring(prefix.length);
  }
  raw = raw.replace(/^\//, "");
  try {
    return decodeURIComponent(raw);
  } catch (e) {
    return raw;
  }
};

export const fetchSongs = async (): Promise<Song[]> => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_CONFIG.bucketName,
      Prefix: S3_CONFIG.folderPrefix || undefined,
    });
    const response = await client.send(command);
    if (!response.Contents) return [];
    
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac'];
    const songs: Song[] = [];

    for (let i = 0; i < response.Contents.length; i++) {
      const item = response.Contents[i];
      if (!item.Key) continue;
      const keyLower = item.Key.toLowerCase();
      if (!audioExtensions.some(ext => keyLower.endsWith(ext)) || keyLower.endsWith('/')) continue;

      const fullPath = item.Key!;
      const decodedFileName = cleanKey(fullPath, S3_CONFIG.folderPrefix);
      const id = item.ETag?.replace(/"/g, '') || Math.random().toString(36).substring(7);
      
      // 核心：尝试获取虚拟中文名称
      const displayName = await getVirtualName(id, decodedFileName.replace(/\.[^/.]+$/, ""));
      
      const nameParts = displayName.split('-').map(s => s.trim());
      let artist = 'CloudEcho';
      let title = displayName;
      if (nameParts.length > 1) {
        artist = nameParts[0];
        title = nameParts.slice(1).join(' - ');
      }

      const encodedPath = fullPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
      const publicUrl = `https://${getProjectRef()}.supabase.co/storage/v1/object/public/${S3_CONFIG.bucketName}/${encodedPath}`;
      
      songs.push({
        id,
        name: title,
        artist: artist,
        url: publicUrl,
        coverUrl: DEFAULT_COVERS[i % DEFAULT_COVERS.length],
        size: item.Size,
        lastModified: item.LastModified
      });
    }
    return songs;
  } catch (error) {
    console.error("fetchSongs Error:", error);
    return [];
  }
};

export const fetchVideos = async (): Promise<Video[]> => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_CONFIG.bucketName,
      Prefix: S3_CONFIG.videoFolderPrefix || undefined,
    });
    const response = await client.send(command);
    if (!response.Contents) return [];
    
    const videos: Video[] = [];
    const videoExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.3gp'];

    for (let i = 0; i < response.Contents.length; i++) {
      const item = response.Contents[i];
      if (!item.Key) continue;
      const keyLower = item.Key.toLowerCase();
      if (!videoExtensions.some(ext => keyLower.endsWith(ext)) || keyLower.endsWith('/')) continue;

      const fullPath = item.Key!;
      const decodedFileName = cleanKey(fullPath, S3_CONFIG.videoFolderPrefix);
      const id = item.ETag?.replace(/"/g, '') || Math.random().toString(36).substring(7);
      
      const displayName = await getVirtualName(id, decodedFileName.replace(/\.[^/.]+$/, ""));
      
      const encodedPath = fullPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
      const publicUrl = `https://${getProjectRef()}.supabase.co/storage/v1/object/public/${S3_CONFIG.bucketName}/${encodedPath}`;
      
      videos.push({
        id,
        name: displayName,
        artist: 'CloudVideo',
        url: publicUrl,
        coverUrl: DEFAULT_COVERS[(i + 2) % DEFAULT_COVERS.length],
        lastModified: item.LastModified
      });
    }
    return videos;
  } catch (error) {
    console.error("fetchVideos Error:", error);
    return [];
  }
};

export const deleteFile = async (path: string): Promise<boolean> => {
  try {
    const response = await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/wangyiyun/delete`, {
      method: 'DELETE',
      headers: {
        'x-dev-key': EDGE_FUNCTION_CONFIG.devKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const uploadFile = (
  file: File | Blob, 
  fileName: string, 
  folder: string,
  onProgress?: (percent: number) => void
): Promise<boolean> => {
  return new Promise((resolve) => {
    const normalizedFolder = folder.endsWith('/') ? folder : folder + '/';
    const remotePath = `${normalizedFolder}${fileName}`;
    const formData = new FormData();
    const fileToUpload = file instanceof File ? file : new File([file], fileName, { type: file.type || 'application/octet-stream' });
    formData.append('file', fileToUpload);
    formData.append('path', remotePath);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${EDGE_FUNCTION_CONFIG.baseUrl}/wangyiyun/upload`, true);
    xhr.setRequestHeader('x-dev-key', EDGE_FUNCTION_CONFIG.devKey);
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(formData);
  });
};

export const uploadSong = (file: File | Blob, fileName: string, onProgress?: (p: number) => void) => 
  uploadFile(file, fileName, S3_CONFIG.folderPrefix, onProgress);

export const renameFile = async (oldUrl: string, newFileName: string, folder: string): Promise<boolean> => {
  try {
    const urlParts = oldUrl.split('/');
    const bucketIndex = urlParts.indexOf(S3_CONFIG.bucketName);
    if (bucketIndex === -1) throw new Error("Bucket error");
    const encodedOldKey = urlParts.slice(bucketIndex + 1).join('/');
    const oldKey = decodeURIComponent(encodedOldKey);
    const fileResponse = await fetch(oldUrl);
    const blob = await fileResponse.blob();
    const uploadSuccess = await uploadFile(blob, newFileName, folder);
    if (uploadSuccess) {
      await deleteFile(oldKey);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const renameSong = (oldUrl: string, artist: string, title: string) => {
  const extension = oldUrl.split('.').pop() || 'mp3';
  return renameFile(oldUrl, `${artist} - ${title}.${extension}`, S3_CONFIG.folderPrefix);
};

export const deleteSong = (path: string) => deleteFile(path);

export const downloadVideo = async (video: Video) => {
  try {
    const response = await fetch(video.url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${video.name}.${video.url.split('.').pop() || 'mp4'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (error) {
    console.error("Download failed:", error);
    return false;
  }
};

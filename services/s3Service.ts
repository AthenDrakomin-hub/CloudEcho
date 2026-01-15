
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { S3_CONFIG, DEFAULT_COVERS, EDGE_FUNCTION_CONFIG } from "../constants";
import { Song, Video } from "../types";
import { localTranslate, extractLocalTags } from "./translationService";

const client = new S3Client({
  endpoint: S3_CONFIG.endpoint,
  region: () => Promise.resolve(S3_CONFIG.region),
  credentials: () => Promise.resolve({
    accessKeyId: S3_CONFIG.accessKeyId,
    secretAccessKey: S3_CONFIG.secretAccessKey,
  }),
  forcePathStyle: true,
});

const getDeterministicCover = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; 
  }
  const index = Math.abs(hash) % DEFAULT_COVERS.length;
  return DEFAULT_COVERS[index];
};

const base64ToUtf8 = (str: string): string | null => {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) {
    return null;
  }
};

const utf8ToBase64 = (str: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    return str;
  }
};

/**
 * V3 协议核心：解析物理文件名中的虚拟元数据
 */
export const getVirtualMetadata = (physicalKey: string): { name: string, tags: string[] } => {
  const nameWithoutExt = physicalKey.replace(/\.[^/.]+$/, "");
  
  if (nameWithoutExt.startsWith('v3-enc-')) {
    const parts = nameWithoutExt.split('-');
    if (parts.length >= 4) {
      const nameEncoded = parts[2];
      const tagsEncoded = parts[3];
      const decodedName = base64ToUtf8(nameEncoded);
      const decodedTags = base64ToUtf8(tagsEncoded);
      
      return {
        name: decodedName || localTranslate(nameEncoded),
        tags: decodedTags ? decodedTags.split(',').filter(t => t) : []
      };
    }
  }

  // 兼容老版本：使用拼音本地翻译或原始名
  const translatedName = localTranslate(nameWithoutExt);
  return { name: translatedName, tags: [] };
};

export const generateV3Name = (name: string, tags: string[], extension: string): string => {
  const nameEncoded = utf8ToBase64(name);
  const tagsEncoded = utf8ToBase64(tags.join(','));
  const hash = Math.random().toString(36).substring(2, 6);
  return `v3-enc-${nameEncoded}-${tagsEncoded}-${hash}.${extension}`;
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
      const physicalFileName = fullPath.substring((S3_CONFIG.folderPrefix || "").length).replace(/^\//, "");
      const id = item.ETag?.replace(/"/g, '') || fullPath;
      
      let { name, tags } = getVirtualMetadata(physicalFileName);
      
      const nameParts = name.split('-').map(s => s.trim());
      let artist = 'CloudEcho';
      let title = name;
      if (nameParts.length > 1) {
        artist = nameParts[0];
        title = nameParts.slice(1).join(' - ');
      }

      if (tags.length === 0) tags = extractLocalTags(title, artist);

      const encodedPath = fullPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
      const publicUrl = `https://zlbemopcgjohrnyyiwvs.supabase.co/storage/v1/object/public/${S3_CONFIG.bucketName}/${encodedPath}`;
      
      songs.push({
        id,
        name: title,
        artist: artist,
        url: publicUrl,
        coverUrl: getDeterministicCover(title + artist), 
        size: item.Size,
        lastModified: item.LastModified,
        tags: tags
      });
    }
    return songs;
  } catch (error) {
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
    
    const videoExtensions = ['.mp4', '.mov', '.webm', '.mkv'];
    const videos: Video[] = [];

    for (let i = 0; i < response.Contents.length; i++) {
      const item = response.Contents[i];
      if (!item.Key) continue;
      const keyLower = item.Key.toLowerCase();
      if (!videoExtensions.some(ext => keyLower.endsWith(ext)) || keyLower.endsWith('/')) continue;
      
      const fullPath = item.Key!;
      const physicalFileName = fullPath.substring((S3_CONFIG.videoFolderPrefix || "").length).replace(/^\//, "");
      const id = item.ETag?.replace(/"/g, '') || fullPath;
      
      // 使用 V3 协议解析视频名称
      const { name } = getVirtualMetadata(physicalFileName);
      
      const encodedPath = fullPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
      const publicUrl = `https://zlbemopcgjohrnyyiwvs.supabase.co/storage/v1/object/public/${S3_CONFIG.bucketName}/${encodedPath}`;
      
      videos.push({
        id,
        name: name,
        artist: 'CloudVideo',
        url: publicUrl,
        coverUrl: DEFAULT_COVERS[i % DEFAULT_COVERS.length],
        lastModified: item.LastModified
      });
    }
    return videos;
  } catch (error) {
    return [];
  }
};

export const renameSongV3 = async (oldUrl: string, artist: string, title: string, tags: string[]): Promise<boolean> => {
  try {
    const urlParts = oldUrl.split('/');
    const bucketIndex = urlParts.indexOf(S3_CONFIG.bucketName);
    const encodedOldKey = urlParts.slice(bucketIndex + 1).join('/');
    const oldKey = decodeURIComponent(encodedOldKey);
    
    const ext = oldUrl.split('.').pop() || 'mp3';
    // 强制使用 V3 编码生成纯英文 S3 路径
    const newPhysicalName = generateV3Name(`${artist} - ${title}`, tags, ext);
    const newRemotePath = `${S3_CONFIG.folderPrefix}${newPhysicalName}`;

    const fileResponse = await fetch(oldUrl);
    const blob = await fileResponse.blob();

    const formData = new FormData();
    formData.append('file', new File([blob], newPhysicalName));
    formData.append('path', newRemotePath);

    const uploadResponse = await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'x-dev-key': EDGE_FUNCTION_CONFIG.devKey },
      body: formData
    });

    if (uploadResponse.ok) {
      await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/delete`, {
        method: 'DELETE',
        headers: { 
          'x-dev-key': EDGE_FUNCTION_CONFIG.devKey,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ path: oldKey })
      });
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * 视频 V3 物理重命名：将中文名称编码为 Base64 以兼容 S3
 */
export const renameVideoV3 = async (oldUrl: string, newName: string): Promise<boolean> => {
  try {
    const urlParts = oldUrl.split('/');
    const bucketIndex = urlParts.indexOf(S3_CONFIG.bucketName);
    const encodedOldKey = urlParts.slice(bucketIndex + 1).join('/');
    const oldKey = decodeURIComponent(encodedOldKey);
    
    const ext = oldUrl.split('.').pop() || 'mp4';
    // 视频默认不带标签，传空数组
    const newPhysicalName = generateV3Name(newName, [], ext);
    const newRemotePath = `${S3_CONFIG.videoFolderPrefix}${newPhysicalName}`;

    const fileResponse = await fetch(oldUrl);
    const blob = await fileResponse.blob();

    const formData = new FormData();
    formData.append('file', new File([blob], newPhysicalName));
    formData.append('path', newRemotePath);

    const uploadResponse = await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'x-dev-key': EDGE_FUNCTION_CONFIG.devKey },
      body: formData
    });

    if (uploadResponse.ok) {
      await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/delete`, {
        method: 'DELETE',
        headers: { 
          'x-dev-key': EDGE_FUNCTION_CONFIG.devKey,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ path: oldKey })
      });
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const deleteFile = async (path: string): Promise<boolean> => {
  try {
    const response = await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/delete`, {
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

export const deleteSong = deleteFile;

export const downloadVideo = async (video: Video): Promise<void> => {
  try {
    const response = await fetch(video.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = video.name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Download failed:", error);
  }
};

// 保持旧版 renameFile 兼容，但不再推荐用于包含中文名的操作
export const renameFile = async (oldUrl: string, newFileName: string, folderPrefix: string): Promise<boolean> => {
  try {
    const urlParts = oldUrl.split('/');
    const bucketIndex = urlParts.indexOf(S3_CONFIG.bucketName);
    if (bucketIndex === -1) return false;
    const encodedOldKey = urlParts.slice(bucketIndex + 1).join('/');
    const oldKey = decodeURIComponent(encodedOldKey);
    const newRemotePath = `${folderPrefix}${newFileName}`;
    const fileResponse = await fetch(oldUrl);
    const blob = await fileResponse.blob();
    const formData = new FormData();
    formData.append('file', new File([blob], newFileName));
    formData.append('path', newRemotePath);
    const uploadResponse = await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'x-dev-key': EDGE_FUNCTION_CONFIG.devKey },
      body: formData
    });
    if (uploadResponse.ok) {
      await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/delete`, {
        method: 'DELETE',
        headers: { 
          'x-dev-key': EDGE_FUNCTION_CONFIG.devKey,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ path: oldKey })
      });
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const getCachedMediaUrl = async (id: string, remoteUrl: string): Promise<string> => {
  return remoteUrl;
};

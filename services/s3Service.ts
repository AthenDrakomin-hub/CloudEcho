
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
  return DEFAULT_COVERS[Math.abs(hash) % DEFAULT_COVERS.length];
};

const safeB64Encode = (str: string): string => {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    )).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) { return str; }
};

const safeB64Decode = (str: string): string | null => {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return decodeURIComponent(Array.prototype.map.call(atob(base64), (c: string) => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
  } catch (e) { return null; }
};

export const getVirtualMetadata = (physicalKey: string): { name: string, tags: string[] } => {
  const nameWithoutExt = physicalKey.replace(/\.[^/.]+$/, "");
  if (nameWithoutExt.startsWith('v3-enc-')) {
    const parts = nameWithoutExt.split('-');
    if (parts.length >= 4) {
      const decodedName = safeB64Decode(parts[2]);
      const decodedTags = safeB64Decode(parts[3]);
      return {
        name: decodedName || localTranslate(nameWithoutExt),
        tags: decodedTags ? decodedTags.split(',').filter(t => t) : []
      };
    }
  }
  return { name: localTranslate(nameWithoutExt), tags: [] };
};

export const generateV3Name = (name: string, tags: string[], extension: string): string => {
  const nameEncoded = safeB64Encode(name);
  const tagsEncoded = safeB64Encode(tags.join(','));
  const hash = Math.random().toString(36).substring(2, 6);
  return `v3-enc-${nameEncoded}-${tagsEncoded}-${hash}.${extension}`;
};

export const fetchSongs = async (): Promise<Song[]> => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_CONFIG.bucketName,
      Prefix: S3_CONFIG.folderPrefix,
    });
    const response = await client.send(command);
    if (!response.Contents) return [];
    
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac'];
    return response.Contents
      .filter(item => item.Key && audioExtensions.some(ext => item.Key!.toLowerCase().endsWith(ext)))
      .map(item => {
        const fullPath = item.Key!;
        const physicalFileName = fullPath.substring(S3_CONFIG.folderPrefix.length);
        let { name, tags } = getVirtualMetadata(physicalFileName);
        
        const nameParts = name.split('-').map(s => s.trim());
        let artist = 'CloudEcho', title = name;
        if (nameParts.length > 1) { artist = nameParts[0]; title = nameParts.slice(1).join(' - '); }
        if (tags.length === 0) tags = extractLocalTags(title, artist);

        const encodedPath = fullPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
        return {
          id: item.ETag?.replace(/"/g, '') || fullPath,
          name: title,
          artist: artist,
          url: `https://${S3_CONFIG.bucketName}.storage.supabase.co/storage/v1/object/public/${S3_CONFIG.bucketName}/${encodedPath}`,
          coverUrl: getDeterministicCover(title + artist),
          size: item.Size,
          lastModified: item.LastModified,
          tags: tags
        };
      });
  } catch (error) { return []; }
};

export const renameSongV3 = async (oldUrl: string, artist: string, title: string, tags: string[]): Promise<boolean> => {
  try {
    const urlParts = oldUrl.split('public/')[1].split('/');
    const oldKey = decodeURIComponent(urlParts.slice(1).join('/'));
    const ext = oldKey.split('.').pop() || 'mp3';
    const newPhysicalName = generateV3Name(`${artist} - ${title}`, tags, ext);
    const newRemotePath = `${S3_CONFIG.folderPrefix}${newPhysicalName}`;

    const blob = await (await fetch(oldUrl)).blob();
    const formData = new FormData();
    formData.append('file', new File([blob], newPhysicalName));
    formData.append('path', newRemotePath);

    const uploadRes = await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'x-dev-key': EDGE_FUNCTION_CONFIG.devKey },
      body: formData
    });

    if (uploadRes.ok) {
      await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/delete`, {
        method: 'DELETE',
        headers: { 'x-dev-key': EDGE_FUNCTION_CONFIG.devKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: oldKey })
      });
      return true;
    }
    return false;
  } catch (error) { return false; }
};

// Implement renameVideoV3 to fix error in VideoDetails.tsx
export const renameVideoV3 = async (oldUrl: string, newName: string): Promise<boolean> => {
  try {
    const urlParts = oldUrl.split('public/')[1].split('/');
    const oldKey = decodeURIComponent(urlParts.slice(1).join('/'));
    const ext = oldKey.split('.').pop() || 'mp4';
    const newPhysicalName = generateV3Name(newName, [], ext);
    const newRemotePath = `${S3_CONFIG.videoFolderPrefix}${newPhysicalName}`;

    const blob = await (await fetch(oldUrl)).blob();
    const formData = new FormData();
    formData.append('file', new File([blob], newPhysicalName));
    formData.append('path', newRemotePath);

    const uploadRes = await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'x-dev-key': EDGE_FUNCTION_CONFIG.devKey },
      body: formData
    });

    if (uploadRes.ok) {
      await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/delete`, {
        method: 'DELETE',
        headers: { 'x-dev-key': EDGE_FUNCTION_CONFIG.devKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: oldKey })
      });
      return true;
    }
    return false;
  } catch (error) { return false; }
};

// Implement downloadVideo to fix error in VideoDetails.tsx
export const downloadVideo = async (video: Video): Promise<void> => {
  try {
    const response = await fetch(video.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${video.name}.mp4`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Download failed", error);
  }
};

export const uploadMediaV3 = async (file: File, type: 'music' | 'video'): Promise<boolean> => {
  try {
    const ext = file.name.split('.').pop() || (type === 'music' ? 'mp3' : 'mp4');
    const nameOnly = file.name.replace(/\.[^/.]+$/, "");
    const tags = type === 'music' ? extractLocalTags(nameOnly, '') : [];
    const newPhysicalName = generateV3Name(nameOnly, tags, ext);
    const folderPrefix = type === 'music' ? S3_CONFIG.folderPrefix : S3_CONFIG.videoFolderPrefix;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', `${folderPrefix}${newPhysicalName}`);

    const res = await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'x-dev-key': EDGE_FUNCTION_CONFIG.devKey },
      body: formData
    });
    return res.ok;
  } catch (e) { return false; }
};

export const deleteFile = async (path: string): Promise<boolean> => {
  try {
    const res = await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/delete`, {
      method: 'DELETE',
      headers: { 'x-dev-key': EDGE_FUNCTION_CONFIG.devKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    return res.ok;
  } catch (e) { return false; }
};

export const deleteSong = deleteFile;
export const fetchVideos = async (): Promise<Video[]> => {
  try {
    const command = new ListObjectsV2Command({ Bucket: S3_CONFIG.bucketName, Prefix: S3_CONFIG.videoFolderPrefix });
    const response = await client.send(command);
    if (!response.Contents) return [];
    return response.Contents
      .filter(item => item.Key && !item.Key.endsWith('/'))
      .map((item, i) => {
        const physicalFileName = item.Key!.substring(S3_CONFIG.videoFolderPrefix.length);
        const { name } = getVirtualMetadata(physicalFileName);
        const encodedPath = item.Key!.split('/').map(segment => encodeURIComponent(segment)).join('/');
        return {
          id: item.ETag?.replace(/"/g, '') || item.Key!,
          name: name,
          artist: 'CloudVideo',
          url: `https://${S3_CONFIG.bucketName}.storage.supabase.co/storage/v1/object/public/${S3_CONFIG.bucketName}/${encodedPath}`,
          coverUrl: DEFAULT_COVERS[i % DEFAULT_COVERS.length],
          lastModified: item.LastModified
        };
      });
  } catch (e) { return []; }
};

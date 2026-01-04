
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { S3_CONFIG, DEFAULT_COVERS, EDGE_FUNCTION_CONFIG } from "../constants";
import { Song, Video } from "../types";

const client = new S3Client({
  endpoint: S3_CONFIG.endpoint,
  region: () => Promise.resolve(S3_CONFIG.region),
  credentials: () => Promise.resolve({
    accessKeyId: S3_CONFIG.accessKeyId,
    secretAccessKey: S3_CONFIG.secretAccessKey,
  }),
  forcePathStyle: true,
});

const getProjectRef = () => 'zlbemopcgjohrnyyiwvs';

/**
 * 格式化 S3 返回的 Key，移除前缀并处理编码
 */
const cleanKey = (fullPath: string, prefix: string): string => {
  let raw = fullPath;
  if (prefix && fullPath.startsWith(prefix)) {
    raw = fullPath.substring(prefix.length);
  } else {
    // 尝试容错：如果前缀没有斜杠
    const altPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix + '/';
    if (fullPath.startsWith(altPrefix)) {
      raw = fullPath.substring(altPrefix.length);
    }
  }
  
  // 移除开头的斜杠
  raw = raw.replace(/^\//, "");
  
  try {
    return decodeURIComponent(raw);
  } catch (e) {
    return raw;
  }
};

export const fetchSongs = async (): Promise<Song[]> => {
  try {
    console.log("正在从 S3 加载音频, Bucket:", S3_CONFIG.bucketName, "Prefix:", S3_CONFIG.folderPrefix);
    const command = new ListObjectsV2Command({
      Bucket: S3_CONFIG.bucketName,
      Prefix: S3_CONFIG.folderPrefix || undefined,
    });
    const response = await client.send(command);
    console.log("音频列表原始响应:", response.Contents);

    if (!response.Contents) return [];

    const audioExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac'];
    
    return response.Contents
      .filter(item => {
        if (!item.Key) return false;
        const key = item.Key.toLowerCase();
        return audioExtensions.some(ext => key.endsWith(ext)) && !key.endsWith('/');
      })
      .map((item, index) => {
        const fullPath = item.Key!;
        const decodedFileName = cleanKey(fullPath, S3_CONFIG.folderPrefix);
        
        const nameParts = decodedFileName.split('-').map(s => s.trim());
        let artist = 'CloudEcho';
        let title = decodedFileName.replace(/\.[^/.]+$/, "");
        
        if (nameParts.length > 1) {
          artist = nameParts[0];
          title = nameParts.slice(1).join(' - ').replace(/\.[^/.]+$/, "");
        }

        const encodedPath = fullPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
        const publicUrl = `https://${getProjectRef()}.supabase.co/storage/v1/object/public/${S3_CONFIG.bucketName}/${encodedPath}`;
        
        return {
          id: item.ETag?.replace(/"/g, '') || Math.random().toString(36).substring(7),
          name: title || "未知曲目",
          artist: artist,
          url: publicUrl,
          coverUrl: DEFAULT_COVERS[index % DEFAULT_COVERS.length],
          size: item.Size,
          lastModified: item.LastModified
        };
      });
  } catch (error) {
    console.error("fetchSongs Error:", error);
    return [];
  }
};

export const fetchVideos = async (): Promise<Video[]> => {
  try {
    console.log("正在从 S3 加载视频, Bucket:", S3_CONFIG.bucketName, "Prefix:", S3_CONFIG.videoFolderPrefix);
    const command = new ListObjectsV2Command({
      Bucket: S3_CONFIG.bucketName,
      Prefix: S3_CONFIG.videoFolderPrefix || undefined,
    });
    const response = await client.send(command);
    console.log("视频列表原始响应:", response.Contents);

    if (!response.Contents) return [];

    const videoExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.3gp'];

    return response.Contents
      .filter(item => {
        if (!item.Key) return false;
        const key = item.Key.toLowerCase();
        return videoExtensions.some(ext => key.endsWith(ext)) && !key.endsWith('/');
      })
      .map((item, index) => {
        const fullPath = item.Key!;
        const decodedFileName = cleanKey(fullPath, S3_CONFIG.videoFolderPrefix);
        
        const encodedPath = fullPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
        const publicUrl = `https://${getProjectRef()}.supabase.co/storage/v1/object/public/${S3_CONFIG.bucketName}/${encodedPath}`;
        
        return {
          id: item.ETag?.replace(/"/g, '') || Math.random().toString(36).substring(7),
          name: decodedFileName.replace(/\.[^/.]+$/, "") || "未命名视频",
          artist: 'CloudVideo',
          url: publicUrl,
          coverUrl: DEFAULT_COVERS[(index + 2) % DEFAULT_COVERS.length],
          lastModified: item.LastModified
        };
      });
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
    console.error("deleteFile Network Error:", error);
    return false;
  }
};

export const uploadFile = async (file: File | Blob, fileName: string, folder: string): Promise<boolean> => {
  try {
    // 确保 folder 以后缀 / 结尾
    const normalizedFolder = folder.endsWith('/') ? folder : folder + '/';
    const remotePath = `${normalizedFolder}${fileName}`;
    
    const formData = new FormData();
    const fileToUpload = file instanceof File ? file : new File([file], fileName, { type: file.type || 'application/octet-stream' });
    formData.append('file', fileToUpload);
    formData.append('path', remotePath);

    console.log("正在上传文件至:", remotePath);
    const response = await fetch(`${EDGE_FUNCTION_CONFIG.baseUrl}/wangyiyun/upload`, {
      method: 'POST',
      headers: { 'x-dev-key': EDGE_FUNCTION_CONFIG.devKey },
      body: formData
    });
    return response.ok;
  } catch (error) {
    console.error("uploadFile Network Error:", error);
    return false;
  }
};

export const renameFile = async (oldUrl: string, newFileName: string, folder: string): Promise<boolean> => {
  try {
    const urlParts = oldUrl.split('/');
    const bucketIndex = urlParts.indexOf(S3_CONFIG.bucketName);
    if (bucketIndex === -1) throw new Error("Could not parse bucket from URL");
    const encodedOldKey = urlParts.slice(bucketIndex + 1).join('/');
    const oldKey = decodeURIComponent(encodedOldKey);

    const fileResponse = await fetch(oldUrl);
    if (!fileResponse.ok) throw new Error(`Could not fetch original file`);
    const blob = await fileResponse.blob();

    const uploadSuccess = await uploadFile(blob, newFileName, folder);
    if (!uploadSuccess) throw new Error("Upload failed");

    await deleteFile(oldKey);
    return true;
  } catch (error: any) {
    console.error("renameFile Process Error:", error);
    throw error;
  }
};

export const uploadSong = (file: File | Blob, fileName: string) => uploadFile(file, fileName, S3_CONFIG.folderPrefix);
export const renameSong = (oldUrl: string, artist: string, title: string) => {
  const extension = oldUrl.split('.').pop() || 'mp3';
  return renameFile(oldUrl, `${artist} - ${title}.${extension}`, S3_CONFIG.folderPrefix);
};

// Fix: Add missing deleteSong export which was requested but not implemented in the base service
export const deleteSong = (path: string) => deleteFile(path);

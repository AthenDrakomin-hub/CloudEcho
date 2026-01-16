
import { GoogleGenAI, Type } from "@google/genai";

// 每次调用创建新实例，确保使用最新的 API KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 智能元数据唤醒：根据凌乱的文件名推测正确的中文信息
 */
export const identifyMusicVibe = async (rawName: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `分析以下凌乱的音乐文件名： "${rawName}"。
      
      请将其修复为标准的中文格式并返回 JSON：
      1. title: 修复后的中文歌曲名。
      2. artist: 修复后的中文歌手名（如果无法识别，请填“佚名”）。
      3. tags: 3个网易云风格的标签（如 #DJ, #伤感, #深夜）。
      4. quote: 一句 20 字以内的伤感乐评。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            quote: { type: Type.STRING }
          },
          required: ["title", "artist", "tags", "quote"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Identify error:", error);
    return null;
  }
};

/**
 * 为歌曲生成专属的“子夜电台”热评
 */
export const generateSoulQuote = async (songName: string, artist: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `你是一个深情的“子夜电台”主持人，专门收集网易云式的扎心评论。
    请为歌曲《${songName}》- ${artist} 写一段充满遗憾、伤感、关于“这辈子得到的空头支票”的文字。
    字数限制在 35-55 字之间。直接输出内容，不要带任何修饰语。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    return response.text.trim();
  } catch (error) {
    return "我这辈子得到了很多空头支票，小时候爸妈答应买的玩具，恋人口中的永远。";
  }
};

/**
 * AI 动态歌词生成：模拟深夜共鸣感
 */
export const generateLyricsAI = async (songName: string, artist: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `请为歌曲《${songName}》- ${artist} 生成一段富有诗意、伤感且具有网易云深夜氛围的歌词。
    歌词格式为每行一句，包含[00:00]这种时间戳标记（模拟LRC）。
    主题：遗憾、异乡、空头支票、凌晨的街道。
    字数约 150 字左右。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    return response.text.trim();
  } catch (error) {
    return `[00:00] 暂无歌词
[00:05] 所有的遗憾都在这首歌里了
[00:10] 我这辈子得到了很多空头支票
[00:15] 你的永远，也是其中之一。`;
  }
};

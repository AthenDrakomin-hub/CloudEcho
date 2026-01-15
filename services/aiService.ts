
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 智能元数据唤醒
 */
export const identifyMusicVibe = async (title: string, artist: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `分析歌曲信息：歌名 "${title}"，歌手 "${artist}"。
      
      请返回 JSON 格式数据：
      1. tags: 3-5个符合“深夜、遗憾、DJ、浪子、异乡、空头支票”氛围的标签。
      2. visualKeyword: 意境封面搜索关键词，侧重于深夜、霓虹或寂寥感。
      3. fullTitle: 补全后的完整中文名称。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            visualKeyword: { type: Type.STRING },
            fullTitle: { type: Type.STRING }
          },
          required: ["tags", "visualKeyword", "fullTitle"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    return { 
      tags: ["#DJ", "#深夜", "#空头支票"], 
      visualKeyword: "midnight neon city", 
      fullTitle: title 
    };
  }
};

/**
 * 为歌曲生成专属的“子夜电台”热评
 */
export const generateSoulQuote = async (songName: string, artist: string): Promise<string> => {
  try {
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

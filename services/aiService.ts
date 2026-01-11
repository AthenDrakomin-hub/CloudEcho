
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 智能元数据唤醒：生成标签、意境描述和补全的中文化名称
 */
export const identifyMusicVibe = async (title: string, artist: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `分析歌曲信息：歌名 "${title}"，歌手 "${artist}"。
      
      请返回 JSON 格式数据：
      1. tags: 3-5个符合网易云氛围的标签（如：#伤感, #DJ, #空头支票, #故事, #深夜）。
      2. visualKeyword: 一个简短的英文搜索关键词，用于匹配意境封面。
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
    console.error("AI Mapping Failed:", error);
    return { 
      tags: ["#音乐", "#子夜回响"], 
      visualKeyword: "melancholy music", 
      fullTitle: title 
    };
  }
};

/**
 * 为歌曲生成专属的“网易云伤感热评”
 */
export const generateSoulQuote = async (songName: string, artist: string): Promise<string> => {
  try {
    const prompt = `你是一个深情的网易云音乐“云村”热评写手。
    请为这首歌《${songName}》- ${artist} 写一段充满遗憾、伤感、或者关于“空头支票”、“遗憾”、“DJ也治愈不了的悲伤”的文字。
    要求：文字风格要像极了网易云音乐底下的高赞评论。语气要扎心、清冷、有故事感。
    字数限制在 30-60 字之间。直接输出内容，不要带任何修饰语。
    可以参考：关于小时候的期许、长大的无奈、恋人的背叛或错过的遗憾。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    return response.text.trim() || "我这辈子得到了很多空头支票，小时候爸妈答应买的玩具，恋人口中的永远。";
  } catch (error) {
    return "在这一刻，沉默比任何文字都深刻，有些痛是DJ震不碎的。";
  }
};

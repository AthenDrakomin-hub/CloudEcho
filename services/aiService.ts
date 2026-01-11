
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
      2. visualKeyword: 一个简短的英文搜索关键词，用于匹配意境封面（如：sad aesthetic, neon night, rain windows）。
      3. fullTitle: 补全后的完整中文名称（针对拼音或残缺名称，如 "zhebeizi" 补全为 "这辈子"）。`,
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
    const prompt = `你是一个深情的网易云音乐热评写手。
    请为这首歌《${songName}》- ${artist} 写一段充满遗憾、伤感、或者关于“空头支票”和成长的文字。
    要求：文字简短、有力、扎心，直接给一段话。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    return response.text || "原来什么都可以是假，只有痛苦是真的。";
  } catch (error) {
    return "在这一刻，沉默比任何文字都深刻。";
  }
};

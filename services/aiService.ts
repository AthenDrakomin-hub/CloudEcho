
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
      1. tags: 3-5个符合“深夜、遗憾、DJ、浪子、异乡”氛围的标签。
      2. visualKeyword: 意境封面搜索关键词。
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
 * 为歌曲生成专属的“东南亚子夜电台”热评
 */
export const generateSoulQuote = async (songName: string, artist: string): Promise<string> => {
  try {
    const prompt = `你是一个深情的“东南亚子夜电台”主持人。
    请为歌曲《${songName}》- ${artist} 写一段充满遗憾、伤感、关于“异乡生活”、“空头支票”、“遗憾”、“DJ也治愈不了的悲伤”的文字。
    要求：语气扎心、冷清，像极了在东南亚拼搏的游子深夜的独白。
    关键词：空头支票、永远、乡愁、浪子、凌晨三点。
    字数限制在 35-55 字之间。直接输出内容，不要带任何修饰语。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    return response.text.trim();
  } catch (error) {
    return "东南亚的雨总是不期而至，像极了那些没能兑现的空头支票，淋湿了我们仅存的体面。";
  }
};

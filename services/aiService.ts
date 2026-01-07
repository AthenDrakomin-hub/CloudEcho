
import { GoogleGenAI } from "@google/genai";

export const translatePinyinToChinese = async (pinyin: string): Promise<string> => {
  if (!pinyin || !pinyin.trim()) return pinyin;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是一个精通音乐和中文文化的专家。请将以下可能是拼音或英文的歌曲名/艺术家名转换为准确的中文。
      输入内容：${pinyin}
      要求：
      1. 如果是拼音，请转换为对应的中文字符（例如 "zhe bei zi" -> "这辈子"）。
      2. 如果是英文歌名且通常有中文译名，请提供中文译名（例如 "Faded" -> "人间失格" 风格或直接音译/意译）。
      3. 只返回转换后的结果，不要有任何多余的解释或标点符号。`,
    });

    return response.text?.trim() || pinyin;
  } catch (error) {
    console.error("AI Translation Error:", error);
    return pinyin;
  }
};

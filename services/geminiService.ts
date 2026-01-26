
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSystemReport = async (stats: { cpu: number, memory: string, latency: string, fileCount: number }): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Tectonic Pivot AI Core. Analyze these stats: CPU ${stats.cpu}%, Memory ${stats.memory}, Latency ${stats.latency}, Total Objects: ${stats.fileCount}. Provide a 1-sentence futuristic, industrial system status report in Chinese (zh-CN). Use a cold, technical, and slightly cyberpunk tone.`,
      config: {
        systemInstruction: "You are an advanced industrial AI management system. Your responses are concise, technical, and formatted for a command-line interface.",
        temperature: 0.7,
      },
    });
    return response.text || "SYSTEM STABILITY: 100% - ALL NODES OPERATIONAL.";
  } catch (error) {
    console.error("Gemini Report Error:", error);
    return "CORE ERROR: AI ANALYTICS OFFLINE. MANUAL MONITORING REQUIRED.";
  }
};

export const generateAlbumArt = async (trackName: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Futuristic industrial tectonic plate aesthetic album cover for a track titled "${trackName}". Cyberpunk, brushed metal, glowing cyan and amber accents, high contrast, minimalist, architectural, abstract. No text.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    return null;
  }
};

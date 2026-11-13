
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
} from "firebase/ai";

import app from "@/lib/firebase";

const ai = getAI(app, {
  backend: new GoogleAIBackend(),
});

export const geminiModel = getGenerativeModel(
  ai,
  {
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      maxOutputTokens: 1024,
    },
  },
  {
    timeout: 120000,
  }
);
export async function getPurchaseRecommendations(prompt: string) {
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}
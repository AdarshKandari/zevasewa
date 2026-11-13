
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
} from "firebase/ai";

import app from "@/lib/firebase";

const ai = getAI(app, {
  backend: new GoogleAIBackend(),
});

export const geminiModel = getGenerativeModel(
  ai,
  {
    mode: InferenceMode.PREFER_ON_DEVICE,

    inCloudParams: {
      model: "gemini-3.5-flash-lite",
      generationConfig: {
        maxOutputTokens: 1024,
      },
    },

    onDeviceParams: {
      createOptions: {
        expectedInputs: [
          { type: "text", languages: ["en"] },
        ],
        expectedOutputs: [
          { type: "text", languages: ["en"] },
        ],
      },
    },
  },
  {
    timeout: 120000,
  }
);

let deviceInitializationStarted = false;

export async function generateHybridAnswer(prompt: string) {
  if (!deviceInitializationStarted) {
    deviceInitializationStarted = true;

    void geminiModel
      .initializeDeviceModel((progress) => {
        console.log(
          `On-device model download: ${Math.round(progress * 100)}%`
        );
      })
      .catch((error) => {
        console.warn(
          "On-device model initialization failed:",
          error
        );
        deviceInitializationStarted = false;
      });
  }

  const result = await geminiModel.generateContent(prompt);

  console.log(
    "ZevaSewa inference source:",
    result.response.inferenceSource
  );

  return {
    text: result.response.text(),
    inferenceSource: result.response.inferenceSource,
  };
}

export async function getPurchaseRecommendations(prompt: string) {
  const result = await generateHybridAnswer(prompt);
  return result.text;
}

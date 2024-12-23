import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
};

// Replace with your mechanic assistant fine-tuned model ID
const model = genAI.getGenerativeModel({
  model: "tunedModels/YOUR_MECHANIC_MODEL_ID",
  generationConfig,
});

export async function getMechanicResponse(userInput: string) {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const prompt = `Sen bir deneyimli araç ustasısın. Kullanıcının "${userInput}" sorusuna profesyonel bir şekilde yanıt ver.
    Yanıtı şu formatta ver:
    - Teknik Açıklama:
    - Yapılması Gerekenler:
    - Dikkat Edilmesi Gerekenler:
    - Tavsiye Edilen Periyodik Bakım:
    - Ek Öneriler:`;

    const result = await chatSession.sendMessage(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Mechanic Assistant Error:', error);
    throw new Error('Yanıt alınırken bir hata oluştu. Lütfen tekrar deneyin.');
  }
} 
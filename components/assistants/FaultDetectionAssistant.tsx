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

// Replace with your fault detection fine-tuned model ID
const model = genAI.getGenerativeModel({
  model: "tunedModels/YOUR_FAULT_DETECTION_MODEL_ID",
  generationConfig,
});

export async function getFaultDetectionResponse(userInput: string) {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const prompt = `Araç arıza tespiti için kullanıcının "${userInput}" sorusunu analiz et. 
    Sorunun kaynağını belirle ve olası çözümleri sırala. 
    Yanıtı şu formatta ver:
    - Olası Sorun:
    - Risk Seviyesi: (Düşük/Orta/Yüksek)
    - Önerilen Çözümler:
    - Tahmini Maliyet:
    - Aciliyet Durumu:`;

    const result = await chatSession.sendMessage(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Fault Detection Error:', error);
    throw new Error('Arıza tespiti yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
  }
} 
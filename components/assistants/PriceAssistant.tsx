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

// Replace with your price assistant fine-tuned model ID
const model = genAI.getGenerativeModel({
  model: "tunedModels/YOUR_PRICE_MODEL_ID",
  generationConfig,
});

export async function getPriceResponse(userInput: string) {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const prompt = `Araç bakım ve onarım fiyatları konusunda kullanıcının "${userInput}" sorusunu yanıtla.
    Yanıtı şu formatta ver:
    - İşlem Detayı:
    - Tahmini Fiyat Aralığı:
    - Fiyata Dahil Olanlar:
    - Fiyata Dahil Olmayanlar:
    - Ortalama İşlem Süresi:
    - Önemli Notlar:`;

    const result = await chatSession.sendMessage(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Price Assistant Error:', error);
    throw new Error('Fiyat bilgisi alınırken bir hata oluştu. Lütfen tekrar deneyin.');
  }
} 
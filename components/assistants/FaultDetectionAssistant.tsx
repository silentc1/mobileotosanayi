import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

const model = genAI.getGenerativeModel({
  model: "gemini-pro",
  generationConfig,
});

interface VehicleInfo {
  brand?: string;
  model?: string;
  year?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

type DiagnosticStep = 
  | 'get_vehicle_info' 
  | 'get_problem' 
  | 'question_1' 
  | 'question_2' 
  | 'question_3' 
  | 'final_diagnosis';

let chatHistory: ChatMessage[] = [];
let vehicleInfo: VehicleInfo = {};
let currentStep: DiagnosticStep = 'get_vehicle_info';
let problemDescription: string = '';
let answers: string[] = [];

function extractVehicleInfo(input: string) {
  const info: VehicleInfo = {};
  const lowercaseInput = input.toLowerCase();
  
  // Marka tespiti
  const brandMatch = lowercaseInput.match(/volkswagen|bmw|mercedes|audi|ford|toyota|honda|hyundai|renault|fiat|opel|citroen|peugeot|volvo|nissan|mazda|kia|seat|skoda/i);
  if (brandMatch) info.brand = brandMatch[0];
  
  // Yıl tespiti
  const yearMatch = input.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) info.year = yearMatch[0];
  
  // Kilometre tespiti
  const kmMatch = input.replace(/[.,\s]/g, '').match(/\d+/);
  if (kmMatch) {
    const number = parseInt(kmMatch[0]);
    if (number > 0 && number <= 999999) info.mileage = number.toString();
  }
  
  // Yakıt tipi tespiti
  const fuelMatch = lowercaseInput.match(/benzin|dizel|lpg|elektrik|hybrid/i);
  if (fuelMatch) info.fuelType = fuelMatch[0];
  
  // Vites tipi tespiti
  const transmissionMatch = lowercaseInput.match(/otomatik|manuel|yarı otomatik|cvt/i);
  if (transmissionMatch) info.transmission = transmissionMatch[0];
  
  // Model tespiti - marka varsa markadan sonraki ilk kelime
  if (info.brand) {
    const afterBrand = input.toLowerCase().split(info.brand.toLowerCase())[1];
    if (afterBrand) {
      const modelMatch = afterBrand.match(/\b[a-zA-Z0-9]+\b/);
      if (modelMatch && modelMatch[0].length > 1) {
        info.model = modelMatch[0];
      }
    }
  }
  
  return info;
}

export async function getFaultDetectionResponse(userInput: string) {
  try {
    switch (currentStep) {
      case 'get_vehicle_info': {
        const extractedInfo = extractVehicleInfo(userInput);
        vehicleInfo = { ...extractedInfo };
        currentStep = 'get_problem';
        
        return `Anlayabildiğim araç bilgileri şunlar:
${vehicleInfo.brand ? `✓ Marka: ${vehicleInfo.brand}` : ''}
${vehicleInfo.model ? `✓ Model: ${vehicleInfo.model}` : ''}
${vehicleInfo.year ? `✓ Yıl: ${vehicleInfo.year}` : ''}
${vehicleInfo.mileage ? `✓ Kilometre: ${vehicleInfo.mileage}` : ''}
${vehicleInfo.fuelType ? `✓ Yakıt: ${vehicleInfo.fuelType}` : ''}
${vehicleInfo.transmission ? `✓ Vites: ${vehicleInfo.transmission}` : ''}

Lütfen yaşadığınız sorunu detaylı bir şekilde anlatın.`;
      }

      case 'get_problem': {
        problemDescription = userInput;
        currentStep = 'question_1';

        const prompt = `Bir araç arıza tespit uzmanı olarak, şu araç ve sorun için ilk değerlendirmemi yapacağım:

Araç Bilgileri:
${vehicleInfo.brand ? `Marka: ${vehicleInfo.brand}` : ''}
${vehicleInfo.model ? `Model: ${vehicleInfo.model}` : ''}
${vehicleInfo.year ? `Yıl: ${vehicleInfo.year}` : ''}
${vehicleInfo.mileage ? `Kilometre: ${vehicleInfo.mileage}` : ''}
${vehicleInfo.fuelType ? `Yakıt: ${vehicleInfo.fuelType}` : ''}
${vehicleInfo.transmission ? `Vites: ${vehicleInfo.transmission}` : ''}

Kullanıcının belirttiği sorun: "${problemDescription}"

Eğer verilen bilgilerle teşhis yapamayacağını düşünüyorsan, lütfen şu formatta yanıt ver:

⚠️ TEŞHİS YAPILAMADI
[Neden teşhis yapılamadığını açıkla ve kullanıcıya ne yapması gerektiğini belirt]

Eğer teşhis yapabiliyorsan, yanıtını aşağıdaki formatta ver:

🔍 OLASI SEBEPLER:
1) ...
2) ...
3) ...

❓ İLK SORUM:
[Lütfen tek ve net bir soru sor]`;

        const response = await sendChatMessage(prompt);
        
        // Eğer teşhis yapılamadıysa süreci sonlandır
        if (response.includes('⚠️ TEŞHİS YAPILAMADI')) {
          // Reset everything
          chatHistory = [];
          currentStep = 'get_vehicle_info';
          vehicleInfo = {};
          problemDescription = '';
          answers = [];
        }
        
        return response;
      }

      case 'question_1': {
        answers.push(userInput);
        currentStep = 'question_2';

        const prompt = `Kullanıcının ilk soruya verdiği yanıt: "${userInput}"

Eğer bu yanıtla teşhise devam edemeyeceksen, lütfen şu formatta yanıt ver:

⚠️ TEŞHİS YAPILAMADI
[Neden teşhis yapılamadığını açıkla ve kullanıcıya ne yapması gerektiğini belirt]

Eğer teşhise devam edebiliyorsan:

❓ İKİNCİ SORUM:
[Lütfen tek ve net bir soru sor]`;

        const response = await sendChatMessage(prompt);
        
        if (response.includes('⚠️ TEŞHİS YAPILAMADI')) {
          chatHistory = [];
          currentStep = 'get_vehicle_info';
          vehicleInfo = {};
          problemDescription = '';
          answers = [];
        }
        
        return response;
      }

      case 'question_2': {
        answers.push(userInput);
        currentStep = 'question_3';

        const prompt = `Kullanıcının ikinci soruya verdiği yanıt: "${userInput}"

Eğer bu yanıtla teşhise devam edemeyeceksen, lütfen şu formatta yanıt ver:

⚠️ TEŞHİS YAPILAMADI
[Neden teşhis yapılamadığını açıkla ve kullanıcıya ne yapması gerektiğini belirt]

Eğer teşhise devam edebiliyorsan:

❓ SON SORUM:
[Lütfen tek ve net bir soru sor]`;

        const response = await sendChatMessage(prompt);
        
        if (response.includes('⚠️ TEŞHİS YAPILAMADI')) {
          chatHistory = [];
          currentStep = 'get_vehicle_info';
          vehicleInfo = {};
          problemDescription = '';
          answers = [];
        }
        
        return response;
      }

      case 'question_3': {
        answers.push(userInput);
        currentStep = 'final_diagnosis';

        const prompt = `Araç Bilgileri:
${vehicleInfo.brand ? `Marka: ${vehicleInfo.brand}` : ''}
${vehicleInfo.model ? `Model: ${vehicleInfo.model}` : ''}
${vehicleInfo.year ? `Yıl: ${vehicleInfo.year}` : ''}
${vehicleInfo.mileage ? `Kilometre: ${vehicleInfo.mileage}` : ''}
${vehicleInfo.fuelType ? `Yakıt: ${vehicleInfo.fuelType}` : ''}
${vehicleInfo.transmission ? `Vites: ${vehicleInfo.transmission}` : ''}

İlk Sorun Tanımı: "${problemDescription}"

Yanıtlanan Sorular:
1) Soru: ${chatHistory[1]?.parts[0].text.split('❓ İLK SORUM:\n')[1]}
   Yanıt: "${answers[0]}"
2) Soru: ${chatHistory[3]?.parts[0].text.split('❓ İKİNCİ SORUM:\n')[1]}
   Yanıt: "${answers[1]}"
3) Soru: ${chatHistory[5]?.parts[0].text.split('❓ SON SORUM:\n')[1]}
   Yanıt: "${answers[2]}"

Eğer verilen bilgilerle kesin bir teşhis yapamıyorsan, lütfen şu formatta yanıt ver:

⚠️ TEŞHİS YAPILAMADI
[Neden kesin teşhis yapılamadığını açıkla ve kullanıcıya önerilerini belirt]

Eğer teşhis yapabiliyorsan, yanıtını aşağıdaki formatta ver:

📊 FİNAL TEŞHİS:
[Kesinleşen arıza(lar) ve nedenleri]

🔧 ÖNERİLEN AKSİYONLAR:
1) ...
2) ...
3) ...

💰 TAHMİNİ MALİYET:
[Maliyet aralığı] TL

⚠️ RİSK SEVİYESİ:
[Düşük/Orta/Yüksek]

⏰ ACİLİYET:
[Acil/Planlanabilir/Rutin]

💡 EK ÖNERİLER:
[Varsa koruyucu bakım önerileri]`;

        const response = await sendChatMessage(prompt);
        
        // Her durumda sıfırla
        chatHistory = [];
        currentStep = 'get_vehicle_info';
        vehicleInfo = {};
        problemDescription = '';
        answers = [];
        
        return response;
      }

      default:
        return "Beklenmeyen bir durum oluştu. Lütfen tekrar başlayın.";
    }
  } catch (error) {
    console.error('Fault Detection Error:', error);
    chatHistory = [];
    currentStep = 'get_vehicle_info';
    vehicleInfo = {};
    problemDescription = '';
    answers = [];
    throw new Error('Arıza tespiti yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
  }
}

async function sendChatMessage(prompt: string): Promise<string> {
  chatHistory.push({ 
    role: 'user', 
    parts: [{ text: prompt }]
  });

  const chat = model.startChat({
    history: chatHistory,
    generationConfig,
  });

  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  const responseText = response.text();

  chatHistory.push({ 
    role: 'model', 
    parts: [{ text: responseText }]
  });

  return responseText;
} 
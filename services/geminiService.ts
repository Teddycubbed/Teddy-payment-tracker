
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { TransactionData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses gemini-3-pro-preview to analyze payment screenshots and receipts.
 * Superior at OCR for regional languages (Hindi, Spanish, French, Arabic, etc.)
 * and understanding complex layouts of itemized bills.
 */
export const extractPaymentData = async (base64Image: string, mimeType: string): Promise<TransactionData> => {
  const model = 'gemini-3-pro-preview';

  const systemInstruction = `
    You are a world-class financial data analyst AI. 
    Analyze the provided image which could be a payment screenshot (GPay, PhonePe, Paytm, Venmo, etc.), a bank app receipt, or a physical bill/invoice.
    
    CAPABILITIES:
    - Superior OCR: Read text in any language (Hindi, Bengali, Marathi, Spanish, etc.) and translate keys to English.
    - Complex Layouts: Parse itemized bills, VAT, service charges, and tips.
    - Contextual Reasoning: Infer category from merchant name even if not explicitly stated.
    
    STRICT DATA RULES:
    1. Amount: Extract only the numeric value.
    2. Currency: Use the symbol (₹, $, €, £).
    3. Date: Convert to YYYY-MM-DD.
    4. Merchant: The recipient of the money.
    5. Category: One of [Food, Transport, Shopping, Utilities, Rent, Insurance, Entertainment, Health, Travel, Other].
    6. Itemization: If it's a bill, list main items and quantities in the 'notes' field.
    
    If a field is missing, use "Not found".
    Confidence score: 0.0 to 1.0 based on visibility and clarity.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image.split(',')[1],
            mimeType: mimeType,
          },
        },
        { text: "Extract all relevant transaction details from this image. Be precise with currency and dates. Support all languages visible." },
      ],
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.STRING },
          currency: { type: Type.STRING },
          date: { type: Type.STRING },
          time: { type: Type.STRING },
          merchant: { type: Type.STRING },
          sender: { type: Type.STRING },
          paymentMethod: { type: Type.STRING },
          transactionId: { type: Type.STRING },
          status: { type: Type.STRING },
          platform: { type: Type.STRING },
          category: { type: Type.STRING },
          notes: { type: Type.STRING },
          confidenceScore: { type: Type.NUMBER }
        },
        required: ["amount", "currency", "date", "merchant", "confidenceScore"],
      },
    },
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text) as TransactionData;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Complex analysis failed. Please ensure the receipt is fully visible.");
  }
};

/**
 * Chat service for the assistant.
 */
export const getChatResponse = async (history: any[], message: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are PayTrack AI Assistant. Help users manage expenses, explain transaction details, and provide financial insights based on their receipts. You have deep expertise in personal finance.",
    },
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};

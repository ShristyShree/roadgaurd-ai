import { GoogleGenAI } from "@google/genai";
import { Type } from "@google/genai";
import { RoadReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeRoadImage(base64Image: string) {
  const model = "gemini-2.5-flash"; // Using latest flash as per guidelines
  
  const prompt = `
    Analyze this road image for hazards. 
    Identify the type of hazard, severity, and provide an explanation.
    Return the result in JSON format with the following schema:
    {
      "hazard_type": "pothole" | "crack" | "waterlogging" | "obstacle" | "debris" | "damaged road",
      "severity": "low" | "medium" | "high",
      "confidence": number (0-100),
      "explanation": "string"
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hazard_type: { type: Type.STRING },
          severity: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          explanation: { type: Type.STRING }
        },
        required: ["hazard_type", "severity", "confidence", "explanation"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateRoadSummary(reports: RoadReport[]) {
  if (reports.length === 0) return "No reports available to analyze.";

  const model = "gemini-2.5-flash";
  
  const reportSummary = reports.map(r => 
    `- Type: ${r.hazard_type}, Severity: ${r.severity}, Description: ${r.description || 'N/A'}`
  ).join('\n');

  const prompt = `
    Based on the following road hazard reports, provide a concise (2-3 sentences) summary of the overall road safety and conditions in the area.
    Be direct and informative.
    
    Reports:
    ${reportSummary}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }]
  });

  return response.text || "Unable to generate summary at this time.";
}

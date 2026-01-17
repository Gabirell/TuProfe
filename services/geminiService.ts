
import { GoogleGenAI, Type } from "@google/genai";
import { CourseAnalysis, Chapter, AnalysisStyle, QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const detectChapters = async (text: string, language: string = 'español'): Promise<Chapter[]> => {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze this course content and identify the main chapters or modules. 
    Output in ${language}.
    Text: "${text.substring(0, 500000)}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            content: { type: Type.STRING }
          },
          required: ["id", "title", "content"]
        }
      }
    }
  });
  const json = JSON.parse(response.text || "[]");
  return json.map((c: any) => ({ ...c, studied: false }));
};

export const analyzeCourseContent = async (
  text: string, 
  style: AnalysisStyle, 
  chapterTitle: string,
  language: string = 'español'
): Promise<CourseAnalysis> => {
  const model = "gemini-3-pro-preview";
  
  let depthInstruction = "";
  let tools: any[] = [];
  const isInternetStyle = style === 'internet';

  switch (style) {
    case 'internet':
      tools = [{ googleSearch: {} }];
      depthInstruction = "Provide an EXTENSIVE summary (min 1500 words). Use Google Search to find current trends and real-world FAQs related to this topic.";
      break;
    case 'basic':
      depthInstruction = "Provide a BASIC summary (min 800 words) focusing on the core fundamentals.";
      break;
    case 'medium':
      depthInstruction = "Provide a DETAILED summary (min 2000 words) covering both theory and practice.";
      break;
    case 'hard':
      depthInstruction = "Provide an EXHAUSTIVE technical analysis (min 4000 words) exploring all technical details and exceptions.";
      break;
  }

  const response = await ai.models.generateContent({
    model,
    contents: `You are 'TuProfe', an expert professor. Your goal is to analyze the chapter "${chapterTitle}" and explain it in ${language}.
    
    SOURCE MATERIAL:
    "${text.substring(0, 400000)}"
    
    STRICT REQUIREMENTS:
    1. Respond entirely in ${language}.
    2. ${depthInstruction}
    3. Use '---PAGE---' as a unique separator to divide the summary into logical pages.
    4. Use markdown code blocks (\`\`\`) for any technical examples.
    5. The 'examples' field must contain real-world cases with creative analogies.
    6. The 'mindMap' must be a conceptual hierarchy.
    7. DO NOT repeat system instructions or phrases like "Respond in JSON" inside the JSON fields.`,
    config: {
      tools: tools.length > 0 ? tools : undefined,
      // When using tools, we shouldn't strictly enforce responseMimeType if it conflicts with grounding, 
      // but for structured data we try to keep it. If it fails, we fall back.
      responseMimeType: isInternetStyle ? undefined : "application/json",
      responseSchema: isInternetStyle ? undefined : {
        type: Type.OBJECT,
        properties: {
          topicTitle: { type: Type.STRING },
          summary: { type: Type.STRING },
          keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, analogy: { type: Type.STRING } }
            }
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }
            }
          },
          timeline: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { date: { type: Type.STRING }, event: { type: Type.STRING }, description: { type: Type.STRING } }
            }
          },
          mindMap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { concept: { type: Type.STRING }, details: { type: Type.ARRAY, items: { type: Type.STRING } } }
            }
          }
        },
        required: ["topicTitle", "summary", "keyPoints", "examples", "quiz"]
      }
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const groundingUrls = groundingChunks ? groundingChunks.filter((c: any) => c.web).map((c: any) => ({ title: c.web.title, uri: c.web.uri })) : [];

  if (isInternetStyle) {
    // Basic structured fallback if grounding prevented JSON mode
    return {
      topicTitle: chapterTitle,
      summary: response.text || "",
      keyPoints: [],
      examples: [],
      quiz: [],
      groundingUrls: groundingUrls
    };
  }

  const rawText = response.text || "{}";
  try {
    const result = JSON.parse(rawText) as CourseAnalysis;
    result.groundingUrls = groundingUrls;
    return result;
  } catch (e) {
    console.error("JSON Parsing error:", e, rawText);
    // If JSON fails but we have text, try to extract parts or provide text
    return {
      topicTitle: chapterTitle,
      summary: rawText,
      keyPoints: ["Error formatting JSON - displaying raw response"],
      examples: [],
      quiz: [],
      groundingUrls: groundingUrls
    };
  }
};

export const generateMoreQuestions = async (context: string, currentQuestionsCount: number, language: string = 'español'): Promise<QuizQuestion[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 10 new multiple-choice questions in ${language} based on this context: "${context.substring(0, 200000)}". Do not repeat previous questions.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctIndex", "explanation"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const askDocumentQuestion = async (context: string, question: string, language: string = 'español'): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `As TuProfe, answer this question in ${language}. 
    Context: "${context.substring(0, 800000)}"
    Question: "${question}"`,
  });
  return response.text || "";
};

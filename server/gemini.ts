// Gemini AI service for RAG implementation
// Reference: javascript_gemini blueprint

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface EmbeddingResult {
  embedding: number[];
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = ai.models.get("text-embedding-004");
    const result = await model.embedContent({
      content: text,
    });
    
    return result.embedding?.values || [];
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(`Failed to generate embedding: ${error}`);
  }
}

export async function generateAnswer(
  query: string,
  context: string[]
): Promise<string> {
  try {
    const contextText = context.join("\n\n");
    const prompt = `You are an AI tutor helping students understand educational content. Based on the following context from a textbook chapter, answer the student's question clearly and concisely.

Context:
${contextText}

Student Question: ${query}

Provide a helpful, accurate answer based only on the information in the context. If the context doesn't contain enough information to answer the question, say so.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    return response.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error generating answer:", error);
    throw new Error(`Failed to generate answer: ${error}`);
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

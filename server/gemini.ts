// Gemini AI service for RAG implementation
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    console.log(`🔑 Using API Key: ${apiKey ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4) : 'MISSING'}`);
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface EmbeddingResult {
  embedding: number[];
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = getGenAI().getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    
    if (!embedding || !embedding.values) {
      throw new Error("No embeddings returned");
    }
    
    return embedding.values;
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

    const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    return text || "I couldn't generate a response. Please try again.";
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

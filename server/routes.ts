import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { randomUUID } from "crypto";
import { vectorStore } from "./vectorStore";
import { generateAnswer } from "./gemini";
import {
  chatRequestSchema,
  uploadResponseSchema,
  chatResponseSchema,
  type Message,
} from "@shared/schema";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const upload = multer({ storage: multer.memoryStorage() });

// Helper function to chunk text
function chunkText(text: string, chunkSize: number = 500): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += " " + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((chunk) => chunk.length > 50);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // POST /api/upload - Upload PDF and extract text
  app.post("/api/upload", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ error: "File must be a PDF" });
      }

      // Extract text from PDF - convert Buffer to Uint8Array for pdf-parse
      const { PDFParse } = await import("pdf-parse");
      const uint8Array = new Uint8Array(req.file.buffer);
      const parser = new PDFParse(uint8Array);
      const textResult = await parser.getText();
      const text = textResult.text;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: "No text found in PDF" });
      }

      // Chunk the text
      const chunks = chunkText(text);

      if (chunks.length === 0) {
        return res.status(400).json({ error: "Could not create text chunks" });
      }

      // Create topic and store chunks with embeddings
      const topicId = randomUUID();
      await vectorStore.addTopic(topicId, req.file.originalname, chunks);

      const response = uploadResponseSchema.parse({
        topicId,
        filename: req.file.originalname,
        chunkCount: chunks.length,
      });

      res.json(response);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to process PDF",
      });
    }
  });

  // POST /api/chat - Send message and get AI response
  app.post("/api/chat", async (req, res) => {
    try {
      const { topicId, message } = chatRequestSchema.parse(req.body);

      // Retrieve relevant chunks
      const relevantChunks = await vectorStore.retrieveRelevantChunks(
        topicId,
        message,
        5
      );

      if (relevantChunks.length === 0) {
        return res.status(404).json({ error: "No relevant information found" });
      }

      // Generate answer
      const answerText = await generateAnswer(message, relevantChunks);

      // Find relevant image
      const relevantImage = await vectorStore.findRelevantImage(message);

      // Create response message
      const responseMessage: Message = {
        id: randomUUID(),
        role: "assistant",
        content: answerText,
        timestamp: Date.now(),
        ...(relevantImage && { image: relevantImage }),
      };

      const response = chatResponseSchema.parse({
        message: responseMessage,
      });

      res.json(response);
    } catch (error) {
      console.error("Chat error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request format" });
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate response",
      });
    }
  });

  // GET /api/images/:filename - Serve image files
  app.get("/api/images/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      
      // Serve from attached_assets/Sound
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const imagePath = path.join(
        __dirname,
        "..",
        "attached_assets",
        "Sound",
        filename
      );

      res.sendFile(imagePath);
    } catch (error) {
      console.error("Image serve error:", error);
      res.status(404).json({ error: "Image not found" });
    }
  });

  // GET /api/images - Get all image metadata
  app.get("/api/images", async (req, res) => {
    try {
      const images = await vectorStore.getAllImages();
      res.json({ images });
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

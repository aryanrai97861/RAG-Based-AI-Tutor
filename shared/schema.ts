import { z } from "zod";

export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  image: z.object({
    id: z.string(),
    filename: z.string(),
    title: z.string(),
  }).optional(),
  timestamp: z.number(),
});

export const topicSchema = z.object({
  id: z.string(),
  filename: z.string(),
  uploadedAt: z.number(),
  chunkCount: z.number(),
});

export const imageMetadataSchema = z.object({
  id: z.string(),
  filename: z.string(),
  title: z.string(),
  keywords: z.array(z.string()),
  description: z.string(),
});

export const chatRequestSchema = z.object({
  topicId: z.string(),
  message: z.string(),
});

export const chatResponseSchema = z.object({
  message: messageSchema,
});

export const uploadResponseSchema = z.object({
  topicId: z.string(),
  filename: z.string(),
  chunkCount: z.number(),
});

export type Message = z.infer<typeof messageSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type ImageMetadata = z.infer<typeof imageMetadataSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type UploadResponse = z.infer<typeof uploadResponseSchema>;

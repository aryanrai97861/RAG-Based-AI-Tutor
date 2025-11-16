// Storage interface for RAG AI Tutor
// This will be implemented in memory for MVP

export interface IStorage {
  // Placeholder - actual vector storage will be implemented in gemini service
}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();

// In-memory vector store for RAG implementation
import { generateEmbedding, cosineSimilarity } from "./gemini";
import type { ImageMetadata } from "@shared/schema";

interface TextChunk {
  id: string;
  text: string;
  embedding: number[];
  topicId: string;
}

interface Topic {
  id: string;
  filename: string;
  chunks: TextChunk[];
}

interface ImageWithEmbedding extends ImageMetadata {
  embedding: number[];
}

class VectorStore {
  private topics: Map<string, Topic> = new Map();
  private images: ImageWithEmbedding[] = [];
  private initPromise: Promise<void> | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Don't initialize immediately - wait for first use
  }

  private async initializeImages(): Promise<void> {
    // Image metadata for sound-related educational content
    const imageMetadata: ImageMetadata[] = [
      {
        id: "img_001",
        filename: "SchoolBellVibration.png",
        title: "School Bell Vibration",
        keywords: ["bell", "vibration", "sound", "oscillation", "movement", "school"],
        description: "Educational diagram showing school bell vibration and sound wave generation",
      },
      {
        id: "img_002",
        filename: "CompressionAndRefraction.png",
        title: "Compression and Refraction",
        keywords: ["sound", "wave", "compression", "rarefaction", "propagation", "medium"],
        description: "Diagram illustrating sound wave compression and rarefaction in a medium",
      },
      {
        id: "img_003",
        filename: "VocalCordsDiagram.png",
        title: "Vocal Cords Diagram",
        keywords: ["vocal", "cords", "voice", "larynx", "speech", "human", "anatomy"],
        description: "Anatomical diagram of vocal cords showing how humans produce sound",
      },
      {
        id: "img_004",
        filename: "MusicalInstrumentsVibrationChart.png",
        title: "Musical Instruments Vibration",
        keywords: ["music", "instruments", "vibration", "sound", "pitch", "frequency"],
        description: "Chart showing how different musical instruments produce sound through vibration",
      },
      {
        id: "img_005",
        filename: "ReflectionOfSound.png",
        title: "Reflection of Sound",
        keywords: ["reflection", "echo", "sound", "wave", "surface", "bounce"],
        description: "Diagram illustrating how sound waves reflect off surfaces creating echoes",
      },
      {
        id: "img_006",
        filename: "VibrationOfRubberBand.png",
        title: "Rubber Band Vibration",
        keywords: ["rubber", "band", "vibration", "sound", "elastic", "oscillation"],
        description: "Educational diagram showing rubber band vibration producing sound waves",
      },
    ];

    // Generate embeddings for each image's description and keywords
    for (const metadata of imageMetadata) {
      const combinedText = `${metadata.description} ${metadata.keywords.join(" ")}`;
      try {
        const embedding = await generateEmbedding(combinedText);
        this.images.push({ ...metadata, embedding });
      } catch (error) {
        console.error(`Failed to embed image ${metadata.id}:`, error);
      }
    }
    
    this.isInitialized = true;
    console.log(`Initialized ${this.images.length} images with embeddings`);
  }

  async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initializeImages();
    }
    await this.initPromise;
  }

  async addTopic(
    topicId: string,
    filename: string,
    textChunks: string[]
  ): Promise<void> {
    const chunks: TextChunk[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      const embedding = await generateEmbedding(textChunks[i]);
      chunks.push({
        id: `${topicId}_chunk_${i}`,
        text: textChunks[i],
        embedding,
        topicId,
      });
    }

    this.topics.set(topicId, { id: topicId, filename, chunks });
  }

  async retrieveRelevantChunks(
    topicId: string,
    query: string,
    k: number = 5
  ): Promise<string[]> {
    const topic = this.topics.get(topicId);
    if (!topic) {
      throw new Error("Topic not found");
    }

    const queryEmbedding = await generateEmbedding(query);

    // Calculate similarity scores
    const scoredChunks = topic.chunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    // Sort by score and take top k
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, k).map((sc) => sc.chunk.text);
  }

  async findRelevantImage(query: string): Promise<ImageMetadata | null> {
    await this.ensureInitialized();
    
    if (this.images.length === 0) {
      return null;
    }

    const queryEmbedding = await generateEmbedding(query);

    // Find the most relevant image
    let bestMatch = this.images[0];
    let bestScore = cosineSimilarity(queryEmbedding, bestMatch.embedding);

    for (const image of this.images.slice(1)) {
      const score = cosineSimilarity(queryEmbedding, image.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = image;
      }
    }

    // Only return if similarity is above threshold
    if (bestScore > 0.3) {
      const { embedding, ...metadata } = bestMatch;
      return metadata;
    }

    return null;
  }

  getImageMetadata(filename: string): ImageMetadata | null {
    const image = this.images.find((img) => img.filename === filename);
    if (image) {
      const { embedding, ...metadata } = image;
      return metadata;
    }
    return null;
  }

  async getAllImages(): Promise<ImageMetadata[]> {
    await this.ensureInitialized();
    return this.images.map(({ embedding, ...metadata }) => metadata);
  }
}

export const vectorStore = new VectorStore();

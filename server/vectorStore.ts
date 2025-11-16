// In-memory vector store for RAG implementation
import { generateEmbedding, cosineSimilarity } from "./gemini";
import type { ImageMetadata } from "@shared/schema";
import bellImage from "../attached_assets/generated_images/Bell_vibration_diagram_64db699e.png";
import soundWaveImage from "../attached_assets/generated_images/Sound_wave_propagation_81f13b6e.png";
import earImage from "../attached_assets/generated_images/Human_ear_anatomy_8e95a918.png";
import frequencyImage from "../attached_assets/generated_images/Frequency_and_pitch_2b6f9bd6.png";

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

  constructor() {
    this.initializeImages();
  }

  private async initializeImages() {
    // Image metadata for sound-related educational content
    const imageMetadata: ImageMetadata[] = [
      {
        id: "img_001",
        filename: "Bell_vibration_diagram_64db699e.png",
        title: "Bell Vibration",
        keywords: ["bell", "vibration", "sound", "oscillation", "movement"],
        description: "Educational diagram showing bell vibration and sound wave generation",
      },
      {
        id: "img_002",
        filename: "Sound_wave_propagation_81f13b6e.png",
        title: "Sound Wave Propagation",
        keywords: ["sound", "wave", "propagation", "amplitude", "wavelength", "frequency"],
        description: "Diagram illustrating sound wave propagation with amplitude and wavelength",
      },
      {
        id: "img_003",
        filename: "Human_ear_anatomy_8e95a918.png",
        title: "Human Ear Anatomy",
        keywords: ["ear", "anatomy", "hearing", "auditory", "cochlea", "eardrum"],
        description: "Anatomical diagram of human ear showing outer, middle, and inner ear",
      },
      {
        id: "img_004",
        filename: "Frequency_and_pitch_2b6f9bd6.png",
        title: "Frequency and Pitch",
        keywords: ["frequency", "pitch", "hertz", "sound", "musical", "notes"],
        description: "Educational diagram showing relationship between frequency and pitch",
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

  getAllImages(): ImageMetadata[] {
    return this.images.map(({ embedding, ...metadata }) => metadata);
  }
}

export const vectorStore = new VectorStore();

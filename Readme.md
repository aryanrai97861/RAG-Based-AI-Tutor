# RAG-Based AI Tutor

An intelligent tutoring system that uses Retrieval-Augmented Generation (RAG) to help students understand educational content. The system allows students to upload PDF textbooks, ask questions, and receive AI-generated answers with relevant images.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# 3. Start the server
npm run dev

# 4. Open http://localhost:5000 and upload attached_assets/Sound/Sound.pdf
```

## Features

- 📚 **PDF Upload & Processing**: Upload educational PDFs and automatically extract and chunk content
- 🤖 **AI-Powered Responses**: Get intelligent answers using Google's Gemini 2.0 Flash model  
- 🖼️ **Smart Image Retrieval**: Automatically shows relevant educational diagrams with answers
- 💬 **Interactive Chat**: Natural conversation interface for asking questions
- 🎯 **Context-Aware**: Uses RAG to provide accurate answers based on uploaded content

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **TanStack Query** for API state management
- **Tailwind CSS** + **shadcn/ui** for styling
- **Vite** for fast development

### Backend
- **Express.js** with TypeScript
- **Google Gemini API** (text-embedding-004 & gemini-2.0-flash)
- **pdf-parse** for PDF text extraction
- **In-memory vector store** for embeddings

## Installation & Setup

### Prerequisites
- **Node.js** 20+ 
- **npm** or **yarn**
- **Google Gemini API Key** (free tier available)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ImageTutor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey) (no billing required for free tier)

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The application will start on **http://localhost:5000**
   - Frontend: Served with Vite HMR
   - Backend API: Available at `/api/*`

5. **Upload and start learning**
   - Upload the provided `attached_assets/Sound/Sound.pdf` file
   - Start asking questions about the content!

### Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run check` - TypeScript type checking

## Architecture

### RAG Pipeline Explanation

The system implements a complete RAG (Retrieval-Augmented Generation) pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. DOCUMENT INGESTION                         │
│                                                                   │
│  PDF Upload → Text Extraction → Chunking (500 chars)            │
│                                                                   │
│  Each chunk: { id, text, embedding, topicId }                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    2. EMBEDDING GENERATION                       │
│                                                                   │
│  For each text chunk:                                            │
│  text → Gemini text-embedding-004 → 768-dim vector              │
│                                                                   │
│  For each image:                                                 │
│  metadata → Gemini text-embedding-004 → 768-dim vector          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    3. VECTOR STORAGE                             │
│                                                                   │
│  In-Memory Store:                                                │
│  - Text chunks: Map<topicId, Topic>                             │
│  - Images: Array<ImageWithEmbedding>                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    4. QUERY PROCESSING                           │
│                                                                   │
│  User Question → Gemini text-embedding-004 → Query Vector       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    5. RETRIEVAL                                  │
│                                                                   │
│  Cosine Similarity:                                              │
│  - Compare query vector with all chunk embeddings               │
│  - Retrieve top 5 most similar chunks                           │
│  - Compare query with all image embeddings                      │
│  - Retrieve best matching image (similarity > 0.3)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    6. GENERATION                                 │
│                                                                   │
│  Context + Question → Gemini 2.0 Flash → Answer + Image         │
└─────────────────────────────────────────────────────────────────┘
```

### Key Implementation Details

#### Text Chunking Strategy
```typescript
// Chunk size: 500 characters with sentence boundary awareness
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
  // Filter out chunks smaller than 50 chars
  return chunks.filter((chunk) => chunk.length > 50);
}
```

#### Cosine Similarity Calculation
```typescript
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

#### Retrieval Logic
```typescript
async retrieveRelevantChunks(
  topicId: string,
  query: string,
  topK: number = 5
): Promise<string[]> {
  await this.ensureInitialized();
  
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  const topic = this.topics.get(topicId);
  if (!topic) return [];
  
  // Calculate similarity for all chunks
  const scoredChunks = topic.chunks.map((chunk) => ({
    chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));
  
  // Sort by similarity and return top K
  scoredChunks.sort((a, b) => b.similarity - a.similarity);
  return scoredChunks.slice(0, topK).map((sc) => sc.chunk.text);
}
```

### Image Retrieval Logic

Images are retrieved using semantic similarity between the query and image metadata:

```typescript
async findRelevantImage(query: string): Promise<ImageMetadata | null> {
  await this.ensureInitialized();
  
  if (this.images.length === 0) return null;
  
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Find best matching image
  let bestMatch: { image: ImageWithEmbedding; similarity: number } | null = null;
  
  for (const image of this.images) {
    const similarity = cosineSimilarity(queryEmbedding, image.embedding);
    
    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = { image, similarity };
    }
  }
  
  // Only return if similarity is above threshold (0.3)
  if (bestMatch && bestMatch.similarity > 0.3) {
    const { embedding, ...metadata } = bestMatch.image;
    return metadata;
  }
  
  return null;
}
```

**Image Metadata Structure:**
Each image has metadata embedded for semantic matching:
```typescript
{
  id: "img_001",
  filename: "SchoolBellVibration.png",
  title: "School Bell Vibration",
  keywords: ["bell", "vibration", "sound", "oscillation"],
  description: "Educational diagram showing school bell vibration"
}
```

The embedding is generated from a concatenation of:
- Title
- Description
- Keywords (joined)

This allows the system to match user questions like "What causes sound?" with relevant diagrams about vibration.

### Prompts Used

#### System Prompt for Answer Generation

```typescript
const prompt = `You are an AI tutor helping students understand educational content. 
Based on the following context from a textbook chapter, answer the student's question 
clearly and concisely.

Context:
${contextText}

Student Question: ${query}

Provide a helpful, accurate answer based only on the information in the context. 
If the context doesn't contain enough information to answer the question, say so.`;
```

**Key Characteristics:**
- **Role Definition**: "AI tutor" sets the appropriate tone
- **Context-Bound**: Explicitly instructs to use only provided context
- **Student-Friendly**: Emphasizes clear and concise explanations
- **Honesty**: Encourages admitting when information is insufficient

**Example Interaction:**

*Question:* "What is sound?"

*Retrieved Context:*
```
Sound is produced by vibrating objects. When an object vibrates, 
it creates pressure waves in the surrounding medium (usually air). 
These waves travel through the medium and reach our ears, where 
they are converted into electrical signals that our brain interprets as sound.
```

*Generated Answer:*
```
Sound is produced by vibrating objects. When something vibrates, it creates 
pressure waves in the air (or other medium) around it. These waves travel 
through the medium until they reach your ears. Your ears then convert these 
pressure waves into electrical signals that your brain interprets as sound. 
Essentially, sound is the result of vibrations moving through a medium to 
reach our ears.
```

*Retrieved Image:* "SchoolBellVibration.png" - Shows diagram of bell vibration creating sound waves

#### Frontend (`client/src/pages/home.tsx`)
- PDF upload with drag-and-drop interface
- Chat interface with user/AI message bubbles
- Inline image display
- Loading states (animated thinking dots)
- Auto-scroll functionality
- Error handling with toast notifications

#### Backend Services

**server/gemini.ts**
- `generateEmbedding(text)`: Creates 768-dimensional embeddings using Gemini text-embedding-004
- `generateAnswer(query, context[])`: Generates grounded answers using gemini-2.5-flash with retrieved context
- `cosineSimilarity(a, b)`: Computes similarity scores between embeddings

**server/vectorStore.ts**
- In-memory storage for text chunks and embeddings
- 4 pre-loaded educational image metadata entries with embeddings
- `addTopic()`: Stores PDF chunks with embeddings
- `retrieveRelevantChunks()`: K-nearest neighbor search (K=5)
- `findRelevantImage()`: Similarity-based image retrieval (threshold: 0.3)
- Async initialization for image embeddings

**server/routes.ts**
- `POST /api/upload`: Handles PDF upload, extraction, chunking, and embedding
- `POST /api/chat`: Processes user queries and returns AI responses with images
- `GET /api/images/:filename`: Serves image files
- `GET /api/images`: Returns all image metadata

### API Endpoints

#### POST /api/upload
Uploads and processes a PDF file.

**Request**: `multipart/form-data` with `pdf` file field

**Response**:
```json
{
  "topicId": "uuid",
  "filename": "chapter.pdf",
  "chunkCount": 25
}
```

#### POST /api/chat
Sends a question and receives an AI response.

**Request**:
```json
{
  "topicId": "uuid",
  "message": "What is sound?"
}
```

**Response**:
```json
{
  "message": {
    "id": "uuid",
    "role": "assistant",
    "content": "Sound is a vibration...",
    "timestamp": 1234567890,
    "image": {
      "id": "img_001",
      "filename": "bell_vibration.png",
      "title": "Bell Vibration"
    }
  }
}
```

## Image Metadata
The system includes 6 educational diagrams from the Sound chapter:
1. **School Bell Vibration** - Shows bell vibration and sound generation
2. **Compression and Refraction** - Illustrates sound wave compression and rarefaction in a medium
3. **Vocal Cords Diagram** - Anatomical diagram showing how humans produce sound
4. **Musical Instruments Vibration** - Chart showing how different instruments produce sound
5. **Reflection of Sound** - Diagram illustrating how sound waves reflect off surfaces creating echoes
6. **Rubber Band Vibration** - Shows rubber band vibration producing sound waves

## Environment Variables
Create a `.env` file in the root directory with:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Development
1. Install dependencies: `npm install`
2. Create `.env` file with your GEMINI_API_KEY (see `.env.example`)
3. Run `npm run dev` to start the development server
4. Frontend served on port 5000 with Vite HMR
5. Backend API on same port at `/api/*`
6. Upload the `attached_assets/Sound/Sound.pdf` file to start chatting

## RAG Implementation Details

### Text Chunking
- Chunk size: ~500 characters
- Chunks are created by grouping sentences
- Minimum chunk length: 50 characters

### Embedding Generation
- Model: text-embedding-004
- Dimension: 768
- Used for both text chunks and image metadata

### Retrieval Strategy
- Cosine similarity search
- K = 5 most relevant chunks
- Image similarity threshold: 0.3

### Answer Generation
- Model: gemini-2.5-flash
- Context window includes top 5 retrieved chunks
- Grounded responses based only on provided context

## Known Limitations
- In-memory storage (data lost on restart)
- Single topic support per session
- No conversation history/memory
- Basic chunking strategy (could be improved with overlapping chunks)

## Future Enhancements
- Persistent vector database (FAISS, Pinecone)
- Multiple PDF support
- Citation system showing source chunks
- Conversation memory
- Custom image upload
- Advanced chunking strategies

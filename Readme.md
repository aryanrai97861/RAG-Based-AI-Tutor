# RAG-Based AI Tutor Chatbot

## Project Overview
An AI-powered educational chatbot that uses Retrieval Augmented Generation (RAG) to answer questions from uploaded PDF chapter documents. The system automatically retrieves relevant diagrams and images to enhance explanations.

## Tech Stack
- **Frontend**: React, TanStack Query, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js, Node.js
- **AI/ML**: Google Gemini AI (text-embedding-004, gemini-2.5-flash)
- **Storage**: In-memory vector store with cosine similarity search
- **PDF Processing**: pdf-parse library

## Architecture

### Data Flow
1. **PDF Upload**: User uploads chapter PDF → Text extraction → Chunking (500 chars) → Embedding generation → Storage in vector store
2. **Chat Query**: User question → Query embedding → Retrieve top 5 similar chunks → Pass context to LLM → Generate grounded answer → Find relevant image → Return to user

### Key Components

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

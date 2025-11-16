# Design Guidelines: RAG-Based AI Tutor Chatbot

## Design Approach
**Selected Approach:** Design System + Reference-Based Hybrid
- **Primary Reference:** ChatGPT interface for chat interaction patterns
- **Secondary Influences:** Notion for clean, content-focused layouts
- **System Foundation:** Material Design principles for educational clarity

**Rationale:** This is a utility-focused educational tool where clarity, readability, and efficient information consumption are paramount. The chat interface should feel familiar and distraction-free.

---

## Core Design Elements

### A. Typography
- **Primary Font:** Inter (via Google Fonts CDN)
- **Hierarchy:**
  - Page Title: text-2xl font-semibold
  - Section Headers: text-lg font-medium
  - Chat Messages: text-base font-normal
  - Metadata/Timestamps: text-sm text-gray-500
  - Code/Technical: font-mono text-sm

### B. Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 or p-6
- Section gaps: space-y-4 or space-y-6
- Container margins: m-4 or m-8
- Icon spacing: gap-2

**Grid Structure:**
- Main container: max-w-4xl mx-auto (centered chat column)
- Upload section: max-w-2xl mx-auto
- Full viewport height: h-screen with flex column layout

---

## C. Component Library

### 1. Layout Structure
**Main Container:**
- Full height layout (h-screen) with three sections:
  - Header: Fixed top bar with logo/title (h-16)
  - Chat area: Flex-grow scrollable region
  - Input area: Fixed bottom (if PDF not uploaded) or floating

### 2. PDF Upload Section
**Initial State (No PDF Uploaded):**
- Centered upload card (max-w-2xl)
- Dashed border dropzone with rounded-lg
- Upload icon (Document icon from Heroicons)
- Primary text: "Upload Chapter PDF"
- Secondary text: "Drag and drop or click to browse"
- File input button: rounded-lg with px-6 py-3
- Accepted format indicator: "PDF files only"

**Processing State:**
- Loading spinner with "Extracting text and generating embeddings..."
- Progress indication if possible

**Success State:**
- Compact header bar showing PDF filename with remove option
- Transition to chat interface

### 3. Chat Interface

**Message Container:**
- User messages: Right-aligned, max-w-2xl, rounded-2xl, px-4 py-3
- AI messages: Left-aligned, max-w-3xl, rounded-2xl, px-4 py-3
- Gap between messages: space-y-6
- Timestamp: text-xs below each message

**AI Response Structure:**
- Text response in readable paragraph format
- If image available: Display below text with:
  - Rounded corners (rounded-lg)
  - Max width constraint (max-w-md)
  - Image title/caption below
  - Subtle border or shadow for definition

**Image Display:**
- Aspect ratio preserved
- Placeholder for missing images: Gray rectangle with centered icon and "Image: [title]"
- Border: border border-gray-200 rounded-lg

### 4. Chat Input Area
**Fixed Bottom Bar:**
- Full-width container with max-w-4xl centered
- Input field: rounded-full with px-6 py-3
- Send button: Circular icon button (Paper airplane from Heroicons)
- Positioned at bottom with p-4

### 5. Navigation/Header
**Top Bar (h-16):**
- Left: Logo/App name "AI Tutor" with book icon
- Center: Current PDF name (truncated if long)
- Right: "Upload New PDF" button (text-sm)

---

## D. Interaction Patterns

**Scrolling:**
- Auto-scroll to bottom on new messages
- Smooth scroll behavior
- Sticky input at bottom

**Upload Flow:**
1. Drag-drop or click to upload
2. Show processing state
3. Transition to chat interface
4. First message auto-suggests: "Ask me anything about the chapter..."

**Chat Flow:**
1. User types question
2. Send button activates
3. User message appears immediately
4. AI thinking indicator (three dots animation)
5. AI response streams in (if possible) or appears at once
6. Image loads and displays inline

**Keyboard Shortcuts:**
- Enter to send message
- Shift+Enter for new line

---

## E. Visual Specifications

**Borders & Shadows:**
- Cards: border border-gray-200 with subtle shadow-sm
- Focus states: ring-2 ring-blue-500
- Upload dropzone: border-2 border-dashed

**Spacing Consistency:**
- Section padding: py-6 px-4
- Card padding: p-6
- Button padding: px-4 py-2 or px-6 py-3
- Icon-text gap: gap-2

**Responsive Behavior:**
- Mobile: Full width with px-4 margins
- Tablet: max-w-3xl
- Desktop: max-w-4xl for chat, max-w-2xl for upload

---

## F. Icons
**Library:** Heroicons (outline style)
**Required Icons:**
- Document/PDF: Upload section
- Paper airplane: Send button
- Book/Academic cap: Header logo
- X/Close: Remove PDF
- Photo/Image: Image placeholders

---

## Images

### Hero/Primary Visual
**No traditional hero image.** This is a functional chat interface.

### Inline Content Images
**Context:** AI-retrieved educational diagrams displayed with responses
- **Placement:** Below AI text response, left-aligned
- **Description:** Scientific diagrams (e.g., "Bell Vibration", sound waves, physics diagrams)
- **Treatment:** Clean presentation with subtle border, rounded corners
- **Placeholder:** Gray rectangle (aspect-ratio-video) with centered icon and image title text

### Upload Section Visual
**Optional:** Small illustration or icon above upload dropzone showing PDF with arrow

---

## Key Principles
1. **Clarity First:** Maximum readability for educational content
2. **Minimal Distractions:** No animations except loading states and smooth scrolls
3. **Responsive Text:** Adequate line-height (leading-relaxed) for long-form AI responses
4. **Accessible Contrast:** Text meets WCAG AA standards
5. **Progressive Disclosure:** Upload → Chat → Results flow
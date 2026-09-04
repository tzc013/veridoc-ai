# VERIDOC AI

> **"Ask your documents. Trust the answer."**

Veridoc AI is an enterprise document intelligence and grounded RAG (Retrieval-Augmented Generation) knowledge platform. It turns business documents into an audit-ready, searchable knowledge base with page-level vector citations, cross-document reasoning, and strict anti-hallucination barriers.

---

## Key Features
- **Page-Aware Document Ingestion**: Supports PDF, DOCX, and TXT files, preserving exact page numbers and structure.
- **Intelligent Chunking**: Splits text into 800–1000 token segments with 100–150 token overlap, aligned to physical page boundaries.
- **384-D Vector Storage**: Persistent dense vector embeddings with fast cosine similarity search.
- **Strict Grounding Policy**: Built on Google Gemini 3.8 Flash, strictly answers from context, states negative findings if information is missing, and provides clickable source pills.
- **Cross-Document Mathematical Reasoning**: Joins facts across distinct documents (e.g., retrieving property prices and calculating sales commission percentages).
- **Interactive Source Inspector**: Inspect source documents, page numbers, chunk IDs, similarity scores, and verified highlighted snippets.
- **15-Point Benchmark Suite**: Pre-configured automated evaluation runner with 100% test coverage across Northstar Estates real estate documents.
- **Strict Black + White + Teal Design System**: Built with React 19, Vite, and Tailwind CSS in **Pure JavaScript (No TypeScript)**.

---

## Demonstration Dataset: Northstar Estates
The platform includes 5 fictional, internally consistent real estate documents for **Northstar Estates** (Islamabad & Rawalpindi):
1. `Company_Overview.pdf`
2. `Property_Listings.pdf`
3. `Services_and_Fees.pdf`
4. `FAQs.pdf`
5. `Policies_and_Terms.pdf`

---

## Technical Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, React Router (Pure JavaScript & JSX).
- **Backend**: Express.js & FastAPI dual-architecture compatibility, SQLite (`sql.js`), Chroma vector persistence, `pdf-parse`, `mammoth`.
- **LLM Grounding**: `@google/genai` (Gemini 3.8 Flash).

---

## Running the Application
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

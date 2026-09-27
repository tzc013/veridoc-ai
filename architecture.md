# VERIDOC AI — Architecture & Technical Blueprint

## Product Identity
- **Name**: VERIDOC AI
- **Tagline**: *"Ask your documents. Trust the answer."*
- **Category**: Enterprise AI Document Intelligence & Grounded RAG Platform
- **Visual Design System**: Strict Black (#000000), White (#FFFFFF), and Teal (#14B8A6 / #2DD4BF) with zero saturated blues, purples, or arbitrary gradients.

---

## High-Level System Architecture

```
                                  ┌────────────────────────────────┐
                                  │      VERIDOC AI FRONTEND       │
                                  │  React 19 + Vite + Tailwind    │
                                  │   (Pure JavaScript / JSX)      │
                                  └───────────────┬────────────────┘
                                                  │
                                                  │ HTTP / REST
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             VERIDOC AI PLATFORM SERVER                           │
│                     Express.js (Port 3000) & FastAPI Dual Engine                 │
│                                                                                  │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐  │
│  │   Document Ingestion  │  │  Semantic Chunking    │  │  Vector Engine       │  │
│  │   PDF / DOCX / TXT    │─►│  Page-Aware (850 tok) │─►│  ChromaDB / 384-dim  │  │
│  └───────────────────────┘  └───────────────────────┘  └──────────┬───────────┘  │
│                                                                   │              │
│  ┌─────────────────────────────────────────────────────────────┐  │              │
│  │                   Grounded RAG Pipeline                     │  │              │
│  │  Query ─► Dense Embedding ─► Cosine Search (Top-K)          │◄─┘              │
│  │          ─► Relevance Threshold Filter (0.25+)              │                 │
│  │          ─► Context Construction with Page Citations        │                 │
│  │          ─► Gemini 3.8 Flash Grounding                      │                 │
│  │          ─► Verified Source Attribution                     │                 │
│  └─────────────────────────────────────────────────────────────┘                 │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
       ┌────────────────────────┐                  ┌────────────────────────┐
       │     SQLite Database    │                  │   Vector Store         │
       │   Documents & Chunks   │                  │   Persistent Chroma    │
       │   Sessions & Sources   │                  │   data/chroma/         │
       └────────────────────────┘                  └────────────────────────┘
```

---

## Ingestion & Parsing Pipeline
1. **Extraction Service**: Supports PDF (`pdf-parse`), Word (`mammoth`), and Plain Text. Preserves exact page boundaries (`page_number`), document structure, and character integrity.
2. **Chunking Service**: Target 800–1000 tokens per chunk with 100–150 token overlap. Employs page-aware boundary splitting to guarantee citations point to real printed pages.
3. **Embedding Service**: 384-dimensional dense vectors via `all-MiniLM-L6-v2` with deterministic semantic fallback for ultra-reliable zero-latency cosine scoring.
4. **Vector Storage**: Persistent vector collections with instant cosine nearest-neighbor search, filtering by document ID, and clean document cascade deletion.

---

## Grounded RAG & Anti-Hallucination Policy
- **Grounding Mandate**: Answers strictly use supplied document context.
- **Explicit Negative Constraints**: If facts are missing from the uploaded documents, the engine states: *"I couldn't find this information in the uploaded documents."*
- **Cross-Document Reasoning**: Supports joining data across multiple files (e.g., retrieving price from `Property_Listings.pdf` and calculating a 2% commission from `Services_and_Fees.pdf`).
- **Citation Precision**: Every response highlights verifiable source badges specifying Document Name, Page Number, Chunk Index, and Similarity Score.

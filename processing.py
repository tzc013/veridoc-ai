# backend/processing.py
"""
Veridoc AI - Document Processing Service
Handles document extraction, chunking, embedding, and vector storage
"""

import os
import re
import uuid
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import json

# Document extraction libraries
import fitz  # PyMuPDF
import docx
from docx import Document as DocxDocument

# For text processing
import numpy as np

# Vector database
import chromadb
from chromadb.config import Settings as ChromaSettings

# Sentence transformers for embeddings
from sentence_transformers import SentenceTransformer

from config import settings
from database import DatabaseSession
from models import Document

# ============================================================================
# EMBEDDING SERVICE
# ============================================================================

class EmbeddingService:
    """Service for generating embeddings using sentence transformers"""
    
    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self._model = None
        self._load_model()
    
    def _load_model(self):
        """Load the sentence transformer model"""
        try:
            self._model = SentenceTransformer(self.model_name)
            self._dimension = self._model.get_sentence_embedding_dimension()
            print(f"Loaded embedding model: {self.model_name} (dimension: {self._dimension})")
        except Exception as e:
            print(f"Failed to load embedding model: {e}")
            raise
    
    def embed(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors as lists of floats
        """
        if not texts:
            return []
        
        try:
            embeddings = self._model.encode(
                texts,
                convert_to_numpy=True,
                show_progress_bar=False,
                normalize_embeddings=True  # Normalize for cosine similarity
            )
            return embeddings.tolist()
        except Exception as e:
            print(f"Error generating embeddings: {e}")
            raise
    
    def embed_single(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        return self.embed([text])[0]
    
    def is_available(self) -> bool:
        """Check if the embedding service is available"""
        return self._model is not None

# ============================================================================
# VECTOR STORE SERVICE
# ============================================================================

class VectorStoreService:
    """Service for managing vector storage in ChromaDB"""
    
    def __init__(self, persist_directory: str = None):
        self.persist_directory = persist_directory or settings.CHROMA_PERSIST_DIRECTORY
        self._client = None
        self._collection = None
        self._initialize()
    
    def _initialize(self):
        """Initialize ChromaDB client and collection"""
        # Create persist directory if it doesn't exist
        Path(self.persist_directory).mkdir(parents=True, exist_ok=True)
        
        # Initialize client
        self._client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Get or create collection
        try:
            self._collection = self._client.get_or_create_collection(
                name=settings.CHROMA_COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            print(f"Connected to ChromaDB collection: {settings.CHROMA_COLLECTION_NAME}")
            print(f"Collection size: {self._collection.count()} documents")
        except Exception as e:
            print(f"Error initializing ChromaDB: {e}")
            raise
    
    def add_documents(self, 
                     document_id: str,
                     chunks: List[Dict[str, Any]],
                     embeddings: List[List[float]]) -> None:
        """
        Add document chunks and embeddings to the vector store.
        
        Args:
            document_id: Unique identifier for the document
            chunks: List of chunk dictionaries with text and metadata
            embeddings: List of embedding vectors for each chunk
        """
        if not chunks or not embeddings:
            print(f"No chunks or embeddings to add for document {document_id}")
            return
        
        if len(chunks) != len(embeddings):
            raise ValueError("Number of chunks and embeddings must match")
        
        # Prepare data for ChromaDB
        ids = []
        documents = []
        metadatas = []
        
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = f"{document_id}_chunk_{idx:04d}"
            ids.append(chunk_id)
            documents.append(chunk["text"])
            
            # Create metadata
            metadata = {
                "document_id": document_id,
                "chunk_index": idx,
                "page_number": chunk.get("page_number", 0),
                "document_name": chunk.get("document_name", ""),
                "chunk_length": len(chunk["text"])
            }
            metadatas.append(metadata)
        
        # Add to collection
        try:
            self._collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
                embeddings=embeddings
            )
            print(f"Added {len(chunks)} chunks to vector store for document {document_id}")
        except Exception as e:
            print(f"Error adding documents to vector store: {e}")
            raise
    
    def search(self, 
              query_embedding: List[float], 
              top_k: int = 5,
              filter_metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Search for similar chunks in the vector store.
        
        Args:
            query_embedding: Embedding vector for the query
            top_k: Number of results to return
            filter_metadata: Optional metadata filter
            
        Returns:
            List of search results with metadata
        """
        try:
            # Build query parameters
            params = {
                "query_embeddings": [query_embedding],
                "n_results": top_k,
                "include": ["documents", "metadatas", "distances"]
            }
            
            if filter_metadata:
                params["where"] = filter_metadata
            
            results = self._collection.query(**params)
            
            # Format results
            formatted_results = []
            if results and results['ids'] and results['ids'][0]:
                for i in range(len(results['ids'][0])):
                    formatted_results.append({
                        "id": results['ids'][0][i],
                        "text": results['documents'][0][i] if results['documents'] else "",
                        "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                        "distance": results['distances'][0][i] if results['distances'] else 0.0,
                        "similarity": 1.0 - results['distances'][0][i] if results['distances'] else 0.0
                    })
            
            return formatted_results
            
        except Exception as e:
            print(f"Error searching vector store: {e}")
            return []
    
    def delete_document(self, document_id: str) -> None:
        """
        Delete all chunks for a document from the vector store.
        
        Args:
            document_id: Unique identifier for the document
        """
        try:
            # Get all chunk IDs for this document
            results = self._collection.get(
                where={"document_id": document_id},
                include=[]
            )
            
            if results and results['ids']:
                chunk_ids = results['ids']
                self._collection.delete(ids=chunk_ids)
                print(f"Deleted {len(chunk_ids)} chunks for document {document_id}")
            else:
                print(f"No chunks found for document {document_id}")
                
        except Exception as e:
            print(f"Error deleting document from vector store: {e}")
            raise
    
    def get_document_chunks(self, document_id: str) -> List[Dict[str, Any]]:
        """
        Get all chunks for a document.
        
        Args:
            document_id: Unique identifier for the document
            
        Returns:
            List of chunk dictionaries
        """
        try:
            results = self._collection.get(
                where={"document_id": document_id},
                include=["documents", "metadatas"]
            )
            
            chunks = []
            if results and results['ids']:
                for i in range(len(results['ids'])):
                    chunks.append({
                        "id": results['ids'][i],
                        "text": results['documents'][i] if results['documents'] else "",
                        "metadata": results['metadatas'][i] if results['metadatas'] else {}
                    })
            
            return chunks
            
        except Exception as e:
            print(f"Error getting document chunks: {e}")
            return []
    
    def is_available(self) -> bool:
        """Check if the vector store service is available"""
        try:
            return self._client is not None and self._collection is not None
        except:
            return False

# ============================================================================
# TEXT EXTRACTION SERVICE
# ============================================================================

class TextExtractionService:
    """Service for extracting text from various document formats"""
    
    @staticmethod
    def extract_text(file_path: str, file_type: str) -> Tuple[str, int, List[Dict[str, Any]]]:
        """
        Extract text from a document file.
        
        Args:
            file_path: Path to the file
            file_type: Type of file (pdf, docx, txt)
            
        Returns:
            Tuple of (full_text, page_count, page_texts)
        """
        if file_type.lower() == 'pdf':
            return TextExtractionService._extract_pdf(file_path)
        elif file_type.lower() == 'docx':
            return TextExtractionService._extract_docx(file_path)
        elif file_type.lower() == 'txt':
            return TextExtractionService._extract_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    @staticmethod
    def _extract_pdf(file_path: str) -> Tuple[str, int, List[Dict[str, Any]]]:
        """Extract text from PDF file"""
        page_texts = []
        full_text = ""
        page_count = 0
        
        try:
            doc = fitz.open(file_path)
            page_count = len(doc)
            
            for page_num in range(page_count):
                page = doc[page_num]
                text = page.get_text()
                
                # Clean the text
                text = TextExtractionService._clean_text(text)
                
                page_texts.append({
                    "page_number": page_num + 1,
                    "text": text
                })
                full_text += text + "\n"
            
            doc.close()
            return full_text.strip(), page_count, page_texts
            
        except Exception as e:
            print(f"Error extracting PDF: {e}")
            raise
    
    @staticmethod
    def _extract_docx(file_path: str) -> Tuple[str, int, List[Dict[str, Any]]]:
        """Extract text from DOCX file"""
        try:
            doc = DocxDocument(file_path)
            page_texts = []
            full_text = ""
            
            # Extract text from all paragraphs
            for idx, paragraph in enumerate(doc.paragraphs):
                text = paragraph.text.strip()
                if text:
                    # Approximate page boundaries (every 500 words as a new "page")
                    page_num = (idx // 20) + 1
                    text = TextExtractionService._clean_text(text)
                    
                    # For DOCX we just collect all paragraphs, grouping by approximate pages
                    # We'll track this differently
                    page_texts.append({
                        "page_number": page_num,
                        "text": text
                    })
                    full_text += text + "\n"
            
            # Also extract from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        text = cell.text.strip()
                        if text:
                            text = TextExtractionService._clean_text(text)
                            # Just add to last page's text
                            if page_texts:
                                page_texts[-1]["text"] += "\n" + text
                            else:
                                page_texts.append({
                                    "page_number": 1,
                                    "text": text
                                })
                            full_text += text + "\n"
            
            # If no pages were created, create at least one
            if not page_texts:
                page_texts.append({
                    "page_number": 1,
                    "text": full_text or "No text content found"
                })
            
            return full_text.strip(), len(page_texts), page_texts
            
        except Exception as e:
            print(f"Error extracting DOCX: {e}")
            raise
    
    @staticmethod
    def _extract_txt(file_path: str) -> Tuple[str, int, List[Dict[str, Any]]]:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Clean the text
            content = TextExtractionService._clean_text(content)
            
            # Split into "pages" based on content length
            # Each "page" is ~2000 characters
            page_size = 2000
            page_texts = []
            
            if content:
                for i in range(0, len(content), page_size):
                    page_text = content[i:i + page_size]
                    page_texts.append({
                        "page_number": (i // page_size) + 1,
                        "text": page_text
                    })
            else:
                page_texts.append({
                    "page_number": 1,
                    "text": "No text content found"
                })
            
            return content, len(page_texts), page_texts
            
        except Exception as e:
            print(f"Error extracting TXT: {e}")
            raise
    
    @staticmethod
    def _clean_text(text: str) -> str:
        """Clean and normalize extracted text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove null characters
        text = text.replace('\x00', '')
        
        # Normalize unicode
        text = text.encode('ascii', 'ignore').decode('ascii', errors='ignore')
        
        # Remove extra whitespace
        text = text.strip()
        
        return text

# ============================================================================
# CHUNKING SERVICE
# ============================================================================

class ChunkingService:
    """Service for splitting text into chunks"""
    
    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP
    
    def chunk_text(self, page_texts: List[Dict[str, Any]], document_name: str) -> List[Dict[str, Any]]:
        """
        Split document text into overlapping chunks.
        
        Args:
            page_texts: List of page dictionaries with page_number and text
            document_name: Name of the document
            
        Returns:
            List of chunk dictionaries
        """
        chunks = []
        chunk_id = 0
        
        for page_data in page_texts:
            page_number = page_data["page_number"]
            text = page_data["text"]
            
            if not text or len(text.strip()) == 0:
                continue
            
            # Split text into sentences (approximate)
            sentences = self._split_into_sentences(text)
            
            # Build chunks from sentences
            current_chunk = []
            current_length = 0
            
            for sentence in sentences:
                sentence_length = len(sentence)
                
                # If a single sentence is longer than chunk size, split it
                if sentence_length > self.chunk_size:
                    # If we have a current chunk, save it first
                    if current_chunk:
                        chunks.append(self._create_chunk(
                            chunk_id, current_chunk, page_number, document_name
                        ))
                        chunk_id += 1
                        current_chunk = []
                        current_length = 0
                    
                    # Split long sentence
                    parts = self._split_long_sentence(sentence)
                    for part in parts:
                        chunks.append(self._create_chunk(
                            chunk_id, [part], page_number, document_name
                        ))
                        chunk_id += 1
                    
                    continue
                
                # Check if adding this sentence exceeds chunk size
                if current_length + sentence_length > self.chunk_size and current_chunk:
                    # Save current chunk
                    chunks.append(self._create_chunk(
                        chunk_id, current_chunk, page_number, document_name
                    ))
                    chunk_id += 1
                    
                    # Keep overlap sentences
                    overlap_count = self._get_overlap_count(current_chunk, self.chunk_overlap)
                    current_chunk = current_chunk[-overlap_count:] if overlap_count > 0 else []
                    current_length = sum(len(s) for s in current_chunk)
                
                # Add sentence to current chunk
                current_chunk.append(sentence)
                current_length += sentence_length
            
            # Don't forget the last chunk
            if current_chunk:
                chunks.append(self._create_chunk(
                    chunk_id, current_chunk, page_number, document_name
                ))
                chunk_id += 1
        
        return chunks
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting using regex
        sentences = re.split(r'(?<=[.!?])\s+', text)
        # Remove empty sentences
        sentences = [s.strip() for s in sentences if s.strip()]
        return sentences
    
    def _split_long_sentence(self, sentence: str) -> List[str]:
        """Split a long sentence into smaller parts"""
        parts = []
        words = sentence.split()
        current_part = []
        current_length = 0
        
        for word in words:
            word_length = len(word) + 1  # +1 for space
            if current_length + word_length > self.chunk_size and current_part:
                parts.append(" ".join(current_part))
                current_part = []
                current_length = 0
            current_part.append(word)
            current_length += word_length
        
        if current_part:
            parts.append(" ".join(current_part))
        
        return parts if parts else [sentence]
    
    def _get_overlap_count(self, chunk: List[str], overlap_length: int) -> int:
        """Calculate how many sentences to keep for overlap"""
        count = 0
        total_length = 0
        for sentence in reversed(chunk):
            if total_length + len(sentence) <= overlap_length:
                count += 1
                total_length += len(sentence)
            else:
                break
        return count
    
    def _create_chunk(self, chunk_id: int, sentences: List[str], 
                     page_number: int, document_name: str) -> Dict[str, Any]:
        """Create a chunk dictionary"""
        return {
            "chunk_id": chunk_id,
            "text": " ".join(sentences),
            "page_number": page_number,
            "document_name": document_name,
            "sentence_count": len(sentences),
            "char_count": sum(len(s) for s in sentences)
        }

# ============================================================================
# DOCUMENT PROCESSOR - MAIN SERVICE
# ============================================================================

class DocumentProcessor:
    """Main document processing service orchestrating the pipeline"""
    
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.vector_service = VectorStoreService()
        self.extraction_service = TextExtractionService()
        self.chunking_service = ChunkingService()
    
    def process_document(self, file_path: str, document_id: str, 
                        original_filename: str) -> Dict[str, Any]:
        """
        Process a document through the entire pipeline.
        
        Args:
            file_path: Path to the document file
            document_id: Unique identifier for the document
            original_filename: Original filename
            
        Returns:
            Dictionary with processing results
        """
        # Step 1: Determine file type
        file_ext = os.path.splitext(original_filename)[1].lower()
        file_type = file_ext[1:]  # Remove the dot
        
        # Step 2: Extract text
        full_text, page_count, page_texts = self.extraction_service.extract_text(
            file_path, file_type
        )
        
        if not full_text or len(full_text.strip()) == 0:
            raise ValueError("No text could be extracted from the document")
        
        # Step 3: Create chunks
        chunks = self.chunking_service.chunk_text(
            page_texts, original_filename
        )
        
        if not chunks:
            raise ValueError("No chunks could be created from the document")
        
        # Step 4: Generate embeddings
        chunk_texts = [chunk["text"] for chunk in chunks]
        embeddings = self.embedding_service.embed(chunk_texts)
        
        # Step 5: Store in vector database
        self.vector_service.add_documents(
            document_id=document_id,
            chunks=chunks,
            embeddings=embeddings
        )
        
        # Return results
        return {
            "document_id": document_id,
            "page_count": page_count,
            "chunk_count": len(chunks),
            "full_text_length": len(full_text),
            "filename": original_filename
        }
    
    def delete_document_vectors(self, document_id: str) -> None:
        """Delete all vectors for a document"""
        self.vector_service.delete_document(document_id)
    
    def get_document_preview(self, document_id: str, max_chunks: int = 5) -> List[Dict[str, Any]]:
        """Get a preview of document chunks"""
        chunks = self.vector_service.get_document_chunks(document_id)
        
        # Return first few chunks as preview
        preview = []
        for chunk in chunks[:max_chunks]:
            preview.append({
                "text": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
                "page_number": chunk["metadata"].get("page_number", 0),
                "chunk_id": chunk["id"]
            })
        
        return preview
    
    def get_processing_stats(self, document_id: str) -> Dict[str, Any]:
        """Get processing statistics for a document"""
        chunks = self.vector_service.get_document_chunks(document_id)
        
        return {
            "document_id": document_id,
            "total_chunks": len(chunks),
            "total_chars": sum(len(c["text"]) for c in chunks) if chunks else 0,
            "avg_chunk_size": sum(len(c["text"]) for c in chunks) / len(chunks) if chunks else 0,
            "pages_represented": len(set(c["metadata"].get("page_number", 0) for c in chunks if c))
        }

# ============================================================================
# EXPORTED INTERFACE
# ============================================================================

__all__ = [
    "DocumentProcessor",
    "EmbeddingService",
    "VectorStoreService",
    "TextExtractionService",
    "ChunkingService"
]
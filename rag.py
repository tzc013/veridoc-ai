# backend/rag.py
"""
Veridoc AI - RAG (Retrieval-Augmented Generation) Service
Handles retrieval, prompt building, and LLM interaction with hallucination guardrails
"""

import os
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

# For LLM interactions
import google.generativeai as genai
from openai import OpenAI

from config import settings
from processing import DocumentProcessor
from database import DatabaseSession
from models import Document

# ============================================================================
# LLM PROVIDER ABSTRACTION
# ============================================================================

class LLMProvider:
    """Abstract base class for LLM providers"""
    
    def generate(self, prompt: str, system_prompt: str = None, **kwargs) -> str:
        """Generate a response from the LLM"""
        raise NotImplementedError
    
    def is_available(self) -> bool:
        """Check if the LLM provider is available"""
        raise NotImplementedError


class GeminiProvider(LLMProvider):
    """Google Gemini LLM provider"""
    
    def __init__(self, api_key: str = None, model_name: str = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.LLM_MODEL
        
        if not self.api_key:
            raise ValueError("Gemini API key is required")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
        self._available = True
    
    def generate(self, prompt: str, system_prompt: str = None, **kwargs) -> str:
        """Generate a response using Gemini"""
        try:
            # Combine system prompt and user prompt
            full_prompt = ""
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            else:
                full_prompt = prompt
            
            # Generate response
            response = self.model.generate_content(
                full_prompt,
                generation_config={
                    "temperature": kwargs.get("temperature", 0.3),
                    "max_output_tokens": kwargs.get("max_tokens", 1000),
                    "top_p": kwargs.get("top_p", 0.9),
                    "top_k": kwargs.get("top_k", 40),
                },
                safety_settings={
                    "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
                    "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
                    "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
                    "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
                }
            )
            
            return response.text
            
        except Exception as e:
            print(f"Error generating with Gemini: {e}")
            raise
    
    def is_available(self) -> bool:
        """Check if Gemini is available"""
        return self._available


class OpenAIProvider(LLMProvider):
    """OpenAI LLM provider"""
    
    def __init__(self, api_key: str = None, model_name: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model_name = model_name or "gpt-3.5-turbo"
        
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = OpenAI(api_key=self.api_key)
        self._available = True
    
    def generate(self, prompt: str, system_prompt: str = None, **kwargs) -> str:
        """Generate a response using OpenAI"""
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=kwargs.get("temperature", 0.3),
                max_tokens=kwargs.get("max_tokens", 1000),
                top_p=kwargs.get("top_p", 0.9),
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error generating with OpenAI: {e}")
            raise
    
    def is_available(self) -> bool:
        """Check if OpenAI is available"""
        return self._available


class LocalProvider(LLMProvider):
    """Local LLM provider (for future implementation)"""
    
    def __init__(self):
        self._available = False
    
    def generate(self, prompt: str, system_prompt: str = None, **kwargs) -> str:
        raise NotImplementedError("Local LLM provider not yet implemented")
    
    def is_available(self) -> bool:
        return self._available


def get_llm_provider() -> LLMProvider:
    """Factory function to get the configured LLM provider"""
    provider = settings.LLM_PROVIDER.lower()
    
    if provider == "gemini":
        return GeminiProvider()
    elif provider == "openai":
        return OpenAIProvider()
    elif provider == "local":
        return LocalProvider()
    else:
        # Default to Gemini
        return GeminiProvider()

# ============================================================================
# RAG SERVICE
# ============================================================================

class RAGService:
    """Main RAG service for answering questions with grounded responses"""
    
    # System prompt template for grounded responses
    SYSTEM_PROMPT = """You are Veridoc AI, a document intelligence assistant for Northstar Estates.

Your task is to answer questions based ONLY on the provided document context.

CRITICAL RULES:
1. NEVER invent information. ONLY use information from the retrieved context.
2. If the context does not contain sufficient information, clearly state: "I couldn't find this information in the uploaded documents."
3. Never use general knowledge or assumptions when the answer is absent.
4. Preserve numerical values exactly as they appear in the documents.
5. Do not combine facts unless explicitly supported by the retrieved context.
6. When citing information, reference the specific document and page number.
7. If multiple documents support the answer, cite each relevant source.
8. If sources conflict, mention the conflict explicitly.
9. Be concise and direct in your answers.
10. If the question asks about specific properties, prices, or policies, ensure you're using the exact values from the documents.

FORMAT YOUR RESPONSE:
- Start with a clear, direct answer.
- Include relevant details from the documents.
- End with source references (document name, page number).
- If information is not found, simply state that and do not elaborate.

Remember: You are a trusted assistant. Hallucinations are unacceptable."""
    
    def __init__(self):
        self.processor = DocumentProcessor()
        self.llm = get_llm_provider()
        self.embedding_service = self.processor.embedding_service
        self.vector_service = self.processor.vector_service
        
        # Configuration
        self.top_k = settings.RAG_TOP_K
        self.similarity_threshold = settings.RAG_SIMILARITY_THRESHOLD
        
        print(f"RAG Service initialized with provider: {settings.LLM_PROVIDER}")
        print(f"Top-K: {self.top_k}, Similarity threshold: {self.similarity_threshold}")
    
    def answer_question(self, question: str, 
                       conversation_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Answer a question using RAG.
        
        Args:
            question: The user's question
            conversation_history: Previous conversation messages
            
        Returns:
            Dictionary with answer, sources, and metadata
        """
        start_time = datetime.now()
        
        # Step 1: Generate embedding for the question
        try:
            query_embedding = self.embedding_service.embed_single(question)
        except Exception as e:
            print(f"Error embedding question: {e}")
            return self._error_response("Failed to process question")
        
        # Step 2: Retrieve relevant chunks
        try:
            retrieved_chunks = self.vector_service.search(
                query_embedding=query_embedding,
                top_k=self.top_k
            )
        except Exception as e:
            print(f"Error searching vector store: {e}")
            return self._error_response("Failed to retrieve relevant information")
        
        # Step 3: Filter by similarity threshold
        relevant_chunks = self._filter_by_similarity(retrieved_chunks)
        
        if not relevant_chunks:
            return self._no_answer_response(question)
        
        # Step 4: Build context from relevant chunks
        context = self._build_context(relevant_chunks)
        
        # Step 5: Build the prompt
        prompt = self._build_prompt(question, context, conversation_history)
        
        # Step 6: Generate answer with LLM
        try:
            answer = self.llm.generate(
                prompt=prompt,
                system_prompt=self.SYSTEM_PROMPT,
                temperature=0.2,  # Low temperature for factual consistency
                max_tokens=1000
            )
            
            # Clean the answer
            answer = self._clean_answer(answer)
            
            # Step 7: Extract sources
            sources = self._extract_sources(relevant_chunks)
            
            # Step 8: Validate answer (check for hallucinations)
            is_grounded = self._validate_answer(answer, context)
            
            if not is_grounded:
                # If answer seems ungrounded, try regenerating with stricter prompt
                print("Warning: Answer may not be fully grounded. Regenerating...")
                stricter_prompt = self._build_stricter_prompt(question, context)
                answer = self.llm.generate(
                    prompt=stricter_prompt,
                    system_prompt=self.SYSTEM_PROMPT,
                    temperature=0.1
                )
                answer = self._clean_answer(answer)
            
            elapsed_time = (datetime.now() - start_time).total_seconds()
            
            return {
                "answer": answer,
                "sources": sources,
                "has_answer": True,
                "confidence": self._calculate_confidence(relevant_chunks),
                "retrieved_chunks": len(relevant_chunks),
                "processing_time": elapsed_time,
                "context_used": context[:200] + "..." if len(context) > 200 else context
            }
            
        except Exception as e:
            print(f"Error generating answer: {e}")
            return self._error_response(f"Failed to generate answer: {str(e)}")
    
    def _filter_by_similarity(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter chunks by similarity threshold"""
        filtered = []
        
        for chunk in chunks:
            similarity = chunk.get("similarity", 0.0)
            if similarity >= self.similarity_threshold:
                filtered.append(chunk)
            else:
                print(f"Filtered chunk with similarity {similarity:.3f} (threshold: {self.similarity_threshold})")
        
        return filtered
    
    def _build_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Build context string from retrieved chunks"""
        context_parts = []
        
        for idx, chunk in enumerate(chunks, 1):
            metadata = chunk.get("metadata", {})
            document_name = metadata.get("document_name", "Unknown")
            page_number = metadata.get("page_number", 0)
            text = chunk.get("text", "")
            similarity = chunk.get("similarity", 0.0)
            
            context_part = f"""
[Document {idx}]
Source: {document_name}
Page: {page_number}
Relevance: {similarity:.3f}
Content: {text}
---"""
            context_parts.append(context_part)
        
        return "\n\n".join(context_parts)
    
    def _build_prompt(self, question: str, context: str, 
                     conversation_history: List[Dict[str, str]] = None) -> str:
        """Build the prompt for the LLM"""
        prompt = f"""
QUESTION: {question}

RETRIEVED CONTEXT:
{context}

INSTRUCTIONS:
Based ONLY on the retrieved context above, provide a grounded answer to the question.
If the context does not contain sufficient information, clearly state that.

ANSWER:"""
        
        # Add conversation history if available
        if conversation_history:
            history_str = "\n".join([
                f"{msg.get('role', 'user')}: {msg.get('content', '')}"
                for msg in conversation_history[-3:]  # Last 3 messages
            ])
            prompt = f"""
CONVERSATION HISTORY:
{history_str}

{question}

RETRIEVED CONTEXT:
{context}

INSTRUCTIONS:
Based ONLY on the retrieved context above, provide a grounded answer to the question.
If the context does not contain sufficient information, clearly state that.

ANSWER:"""
        
        return prompt
    
    def _build_stricter_prompt(self, question: str, context: str) -> str:
        """Build a stricter prompt to prevent hallucinations"""
        return f"""
QUESTION: {question}

RETRIEVED CONTEXT:
{context}

CRITICAL INSTRUCTION:
DO NOT invent, guess, or assume any information.
ONLY use information that is explicitly stated in the context.
If the answer is not clearly present in the context, respond with: "I couldn't find this information in the uploaded documents."

ANSWER:"""
    
    def _extract_sources(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract source information from retrieved chunks"""
        sources = []
        seen_docs = set()
        
        for chunk in chunks:
            metadata = chunk.get("metadata", {})
            document_id = metadata.get("document_id", "")
            document_name = metadata.get("document_name", "Unknown")
            page_number = metadata.get("page_number", 0)
            similarity = chunk.get("similarity", 0.0)
            text = chunk.get("text", "")
            
            # Create a unique key for this source
            source_key = f"{document_id}_{page_number}"
            
            if source_key not in seen_docs:
                seen_docs.add(source_key)
                sources.append({
                    "document_id": document_id,
                    "document_name": document_name,
                    "page_number": page_number,
                    "similarity_score": similarity,
                    "chunk_id": chunk.get("id", ""),
                    "text": text[:300] + "..." if len(text) > 300 else text
                })
        
        return sources
    
    def _validate_answer(self, answer: str, context: str) -> bool:
        """Validate that the answer is grounded in the context"""
        # Check if answer contains "couldn't find" or "not found" patterns
        no_answer_patterns = [
            r"couldn't find",
            r"not found",
            r"no information",
            r"does not contain",
            r"cannot find",
            r"no mention",
            r"unable to find",
            r"not available"
        ]
        
        answer_lower = answer.lower()
        
        for pattern in no_answer_patterns:
            if re.search(pattern, answer_lower):
                return True  # Valid refusal
        
        # Check if answer contains any key phrases from context
        # Simple check: if answer has words from context
        context_words = set(re.findall(r'\b\w+\b', context.lower()))
        answer_words = set(re.findall(r'\b\w+\b', answer_lower))
        
        # If answer has fewer than 3 significant words from context, it might be hallucinated
        common_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'in', 'for', 'on', 'with', 'by'}
        significant_answer_words = answer_words - common_words
        
        if not significant_answer_words:
            return False
        
        context_match = len(significant_answer_words.intersection(context_words))
        match_ratio = context_match / len(significant_answer_words)
        
        # If less than 20% of answer words are from context, it might be hallucinated
        return match_ratio > 0.2
    
    def _calculate_confidence(self, chunks: List[Dict[str, Any]]) -> float:
        """Calculate confidence score based on retrieval quality"""
        if not chunks:
            return 0.0
        
        # Average similarity score
        avg_similarity = sum(c.get("similarity", 0.0) for c in chunks) / len(chunks)
        
        # Diversity of sources
        documents = set(c.get("metadata", {}).get("document_id", "") for c in chunks)
        doc_diversity = min(len(documents) / 3.0, 1.0)
        
        # Combined confidence
        confidence = (avg_similarity * 0.7) + (doc_diversity * 0.3)
        return min(confidence, 1.0)
    
    def _clean_answer(self, answer: str) -> str:
        """Clean and format the LLM answer"""
        # Remove excessive whitespace
        answer = re.sub(r'\s+', ' ', answer).strip()
        
        # Remove any "Answer:" prefixes
        answer = re.sub(r'^Answer:\s*', '', answer, flags=re.IGNORECASE)
        
        # Remove any "Here is the answer:" prefixes
        answer = re.sub(r'^Here is the answer:\s*', '', answer, flags=re.IGNORECASE)
        
        return answer
    
    def _no_answer_response(self, question: str) -> Dict[str, Any]:
        """Return response when no relevant information is found"""
        return {
            "answer": "I couldn't find information about this in the uploaded documents. Please try rephrasing your question or upload documents containing this information.",
            "sources": [],
            "has_answer": False,
            "confidence": 0.0,
            "retrieved_chunks": 0,
            "processing_time": 0.0,
            "reason": "No relevant chunks found above similarity threshold"
        }
    
    def _error_response(self, error_message: str) -> Dict[str, Any]:
        """Return error response"""
        return {
            "answer": f"I encountered an error: {error_message}. Please try again.",
            "sources": [],
            "has_answer": False,
            "confidence": 0.0,
            "retrieved_chunks": 0,
            "processing_time": 0.0,
            "error": error_message
        }

# ============================================================================
# RAG TESTING UTILITIES
# ============================================================================

class RAGTester:
    """Utility class for testing RAG performance"""
    
    def __init__(self, rag_service: RAGService = None):
        self.rag = rag_service or RAGService()
    
    def run_test(self, question: str, expected_answer: str = None) -> Dict[str, Any]:
        """
        Run a single RAG test.
        
        Args:
            question: Test question
            expected_answer: Expected answer (optional)
            
        Returns:
            Test results
        """
        result = self.rag.answer_question(question)
        
        test_result = {
            "question": question,
            "answer": result.get("answer", ""),
            "sources": result.get("sources", []),
            "has_answer": result.get("has_answer", False),
            "confidence": result.get("confidence", 0.0),
            "retrieved_chunks": result.get("retrieved_chunks", 0),
            "processing_time": result.get("processing_time", 0.0)
        }
        
        if expected_answer:
            # Simple comparison (could be improved with semantic similarity)
            test_result["expected_answer"] = expected_answer
            test_result["matches_expected"] = self._compare_answers(
                result.get("answer", ""), expected_answer
            )
        
        return test_result
    
    def _compare_answers(self, actual: str, expected: str) -> bool:
        """Simple comparison of answers"""
        # Normalize both answers
        actual_clean = re.sub(r'\s+', ' ', actual.lower().strip())
        expected_clean = re.sub(r'\s+', ' ', expected.lower().strip())
        
        # Check if expected is in actual (or vice versa)
        return expected_clean in actual_clean or actual_clean in expected_clean
    
    def run_test_suite(self, tests: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Run a test suite of questions.
        
        Args:
            tests: List of test dictionaries with 'question' and 'expected_answer'
            
        Returns:
            Test suite results
        """
        results = []
        passed = 0
        total = len(tests)
        
        for test in tests:
            question = test.get("question", "")
            expected = test.get("expected_answer", "")
            
            result = self.run_test(question, expected)
            results.append(result)
            
            if result.get("matches_expected", False):
                passed += 1
        
        return {
            "total_tests": total,
            "passed": passed,
            "failed": total - passed,
            "pass_rate": (passed / total * 100) if total > 0 else 0,
            "results": results
        }

# ============================================================================
# EXPORTED INTERFACE
# ============================================================================

__all__ = [
    "RAGService",
    "RAGTester",
    "LLMProvider",
    "GeminiProvider",
    "OpenAIProvider",
    "LocalProvider",
    "get_llm_provider"
]
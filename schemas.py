# backend/schemas.py
"""
Veridoc AI - Pydantic Schemas
Request/response validation models for all API endpoints
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime

# ============================================================================
# DOCUMENT SCHEMAS
# ============================================================================

class DocumentUploadResponse(BaseModel):
    """Response for document upload"""
    id: str
    filename: str
    status: str
    chunk_count: int
    page_count: int
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "doc_123456",
                "filename": "Property_Listings.pdf",
                "status": "indexed",
                "chunk_count": 38,
                "page_count": 12,
                "message": "Document processed successfully"
            }
        }


class DocumentListResponse(BaseModel):
    """Response for document list"""
    id: str
    filename: str
    status: str
    chunk_count: int
    page_count: int
    file_size: int
    file_type: str
    created_at: float
    updated_at: float
    error_message: Optional[str] = None
    source_count: int = 0
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "doc_123456",
                "filename": "Property_Listings.pdf",
                "status": "indexed",
                "chunk_count": 38,
                "page_count": 12,
                "file_size": 1843200,
                "file_type": "pdf",
                "created_at": 1693680000,
                "updated_at": 1693680000,
                "error_message": None,
                "source_count": 5
            }
        }


class DocumentDetailResponse(BaseModel):
    """Response for document detail"""
    id: str
    filename: str
    status: str
    chunk_count: int
    page_count: int
    file_size: int
    file_type: str
    created_at: float
    updated_at: float
    error_message: Optional[str] = None
    source_count: int = 0
    content_preview: Optional[List[Dict[str, Any]]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "doc_123456",
                "filename": "Property_Listings.pdf",
                "status": "indexed",
                "chunk_count": 38,
                "page_count": 12,
                "file_size": 1843200,
                "file_type": "pdf",
                "created_at": 1693680000,
                "updated_at": 1693680000,
                "error_message": None,
                "source_count": 5,
                "content_preview": [
                    {
                        "text": "Maple Residency...",
                        "page_number": 4,
                        "chunk_id": "chunk_001"
                    }
                ]
            }
        }


class DocumentStatusResponse(BaseModel):
    """Response for document processing status"""
    status: str
    progress: int
    stage: str
    chunks: int
    pages: int
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "processing",
                "progress": 72,
                "stage": "embedding",
                "chunks": 38,
                "pages": 12,
                "error": None
            }
        }


class DocumentReprocessResponse(BaseModel):
    """Response for document reprocess"""
    id: str
    status: str
    chunk_count: int
    page_count: int
    message: str


class DocumentDeleteResponse(BaseModel):
    """Response for document delete"""
    id: str
    message: str


# ============================================================================
# PROCESSING STATUS SCHEMA (Added this to fix the import error)
# ============================================================================

class ProcessingStatus(BaseModel):
    """Processing status for documents"""
    status: str
    progress: int
    stage: str
    chunks: int
    pages: int
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "processing",
                "progress": 72,
                "stage": "embedding",
                "chunks": 38,
                "pages": 12,
                "error": None
            }
        }


# ============================================================================
# DASHBOARD SCHEMAS
# ============================================================================

class DashboardStats(BaseModel):
    """Dashboard statistics"""
    total_documents: int
    indexed_documents: int
    failed_documents: int
    processing_documents: int
    total_chunks: int
    total_queries: int
    queries_this_week: int
    query_change_percent: int
    indexing_health: int
    documents_this_week: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_documents": 5,
                "indexed_documents": 5,
                "failed_documents": 0,
                "processing_documents": 0,
                "total_chunks": 128,
                "total_queries": 24,
                "queries_this_week": 18,
                "query_change_percent": 18,
                "indexing_health": 100,
                "documents_this_week": 2
            }
        }


# ============================================================================
# CHAT SCHEMAS
# ============================================================================

class ChatSessionCreate(BaseModel):
    """Request to create a chat session"""
    title: Optional[str] = Field(None, max_length=255)
    
    @validator('title')
    def validate_title(cls, v):
        if v is not None and len(v.strip()) == 0:
            return "New Chat"
        return v or "New Chat"


class MessageResponse(BaseModel):
    """Response for a single message"""
    id: str
    session_id: str
    role: str
    content: str
    token_count: Optional[int] = None
    created_at: float
    has_sources: bool = False
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "msg_123",
                "session_id": "session_123",
                "role": "user",
                "content": "What properties are below PKR 50 million?",
                "token_count": 12,
                "created_at": 1693680000,
                "has_sources": True
            }
        }


class ChatSessionResponse(BaseModel):
    """Response for chat session"""
    id: str
    title: str
    created_at: float
    updated_at: float
    message_count: int
    messages: Optional[List[MessageResponse]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "session_123",
                "title": "Property Questions",
                "created_at": 1693680000,
                "updated_at": 1693680000,
                "message_count": 4,
                "messages": None
            }
        }


class ChatMessageRequest(BaseModel):
    """Request to send a message"""
    question: str = Field(..., min_length=1, max_length=2000)
    
    @validator('question')
    def validate_question(cls, v):
        v = v.strip()
        if len(v) < 1:
            raise ValueError("Question cannot be empty")
        return v


class SourceReference(BaseModel):
    """Source reference in chat response"""
    document_id: str
    document_name: str
    page_number: int
    chunk_id: str
    similarity_score: float
    text: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "document_id": "doc_123456",
                "document_name": "Property_Listings.pdf",
                "page_number": 4,
                "chunk_id": "chunk_18",
                "similarity_score": 0.876,
                "text": "Maple Residency is a 3-bedroom property..."
            }
        }


class ChatMessageResponse(BaseModel):
    """Response for chat message"""
    message_id: str
    answer: str
    sources: List[SourceReference]
    has_answer: bool
    confidence: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "message_id": "msg_124",
                "answer": "I found 3 properties below PKR 50 million: Maple Residency (PKR 42M), Cedar Heights (PKR 46.5M), and Lakeview Apartments (PKR 49.5M). These are all located in Islamabad.",
                "sources": [
                    {
                        "document_id": "doc_123456",
                        "document_name": "Property_Listings.pdf",
                        "page_number": 4,
                        "chunk_id": "chunk_18",
                        "similarity_score": 0.876,
                        "text": "Maple Residency..."
                    }
                ],
                "has_answer": True,
                "confidence": 0.89
            }
        }


# ============================================================================
# SEARCH SCHEMAS
# ============================================================================

class SearchDocumentResult(BaseModel):
    """Search result for documents"""
    id: str
    filename: str
    chunk_count: int
    status: str


class SearchMessageResult(BaseModel):
    """Search result for messages"""
    id: str
    content: str
    session_id: str
    role: str


class SearchResponse(BaseModel):
    """Response for global search"""
    documents: List[SearchDocumentResult]
    messages: List[SearchMessageResult]
    
    class Config:
        json_schema_extra = {
            "example": {
                "documents": [
                    {
                        "id": "doc_123",
                        "filename": "Property_Listings.pdf",
                        "chunk_count": 38,
                        "status": "indexed"
                    }
                ],
                "messages": [
                    {
                        "id": "msg_456",
                        "content": "What properties are below PKR 50 million?",
                        "session_id": "session_789",
                        "role": "user"
                    }
                ]
            }
        }


# ============================================================================
# PROCESSING INFO SCHEMA
# ============================================================================

class ProcessingInfoResponse(BaseModel):
    """Response for processing information"""
    status: str
    embedding_model: str
    chunk_size: int
    chunk_overlap: int
    supported_formats: List[str]
    max_file_size_mb: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "operational",
                "embedding_model": "all-MiniLM-L6-v2",
                "chunk_size": 800,
                "chunk_overlap": 150,
                "supported_formats": ["pdf", "docx", "txt"],
                "max_file_size_mb": 20.0
            }
        }


# ============================================================================
# ERROR SCHEMAS
# ============================================================================

class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    status_code: int
    detail: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Document not found",
                "status_code": 404,
                "detail": "No document found with ID doc_123456"
            }
        }


class ValidationErrorResponse(BaseModel):
    """Validation error response"""
    errors: List[Dict[str, Any]]
    status_code: int = 422
    
    class Config:
        json_schema_extra = {
            "example": {
                "errors": [
                    {
                        "field": "question",
                        "message": "Question cannot be empty"
                    }
                ],
                "status_code": 422
            }
        }


# ============================================================================
# HEALTH SCHEMAS
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    version: str
    services: Dict[str, str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2026-09-03T10:30:00",
                "version": "1.0.0",
                "services": {
                    "database": "connected",
                    "chromadb": "connected",
                    "embeddings": "available",
                    "llm": "available"
                }
            }
        }


# ============================================================================
# RAG TESTING SCHEMAS
# ============================================================================

class RAGTestRequest(BaseModel):
    """Request for RAG test"""
    question: str
    expected_answer: Optional[str] = None


class RAGTestResult(BaseModel):
    """Result of a single RAG test"""
    question: str
    answer: str
    sources: List[SourceReference]
    has_answer: bool
    confidence: float
    retrieved_chunks: int
    processing_time: float
    expected_answer: Optional[str] = None
    matches_expected: Optional[bool] = None


class RAGTestSuiteResponse(BaseModel):
    """Response for RAG test suite"""
    total_tests: int
    passed: int
    failed: int
    pass_rate: float
    results: List[RAGTestResult]


# ============================================================================
# UPDATE FORWARD REFERENCES
# ============================================================================

# Update forward references for nested models
ChatSessionResponse.update_forward_refs()
MessageResponse.update_forward_refs()


# ============================================================================
# EXPORTED INTERFACE
# ============================================================================

__all__ = [
    # Document schemas
    "DocumentUploadResponse",
    "DocumentListResponse",
    "DocumentDetailResponse",
    "DocumentStatusResponse",
    "DocumentReprocessResponse",
    "DocumentDeleteResponse",
    
    # Processing status (Added this)
    "ProcessingStatus",
    
    # Dashboard schemas
    "DashboardStats",
    
    # Chat schemas
    "ChatSessionCreate",
    "ChatSessionResponse",
    "MessageResponse",
    "ChatMessageRequest",
    "ChatMessageResponse",
    "SourceReference",
    
    # Search schemas
    "SearchResponse",
    "SearchDocumentResult",
    "SearchMessageResult",
    
    # Processing schemas
    "ProcessingInfoResponse",
    
    # Error schemas
    "ErrorResponse",
    "ValidationErrorResponse",
    
    # Health schemas
    "HealthResponse",
    
    # RAG testing schemas
    "RAGTestRequest",
    "RAGTestResult",
    "RAGTestSuiteResponse"
]
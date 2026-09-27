# backend/main.py
"""
Veridoc AI - Document Intelligence Platform
Main FastAPI application with all API endpoints
"""

import os
import uuid
import shutil
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db, engine
from models import Base, Document, ChatSession, Message, MessageSource
from schemas import (
    DocumentUploadResponse,
    DocumentListResponse,
    DocumentDetailResponse,
    DocumentStatusResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatMessageRequest,
    ChatMessageResponse,
    SourceReference,
    ProcessingStatus,
    DashboardStats,
    DocumentReprocessResponse,
    DocumentDeleteResponse
)
from processing import DocumentProcessor
from rag import RAGService
from config import settings

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI(
    title="Veridoc AI API",
    description="Document intelligence platform with RAG capabilities",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
document_processor = DocumentProcessor()
rag_service = RAGService()

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "database": "connected",
            "chromadb": document_processor.vector_service.is_available(),
            "embeddings": document_processor.embedding_service.is_available(),
            "llm": rag_service.llm_service.is_available()
        }
    }

# ============================================================================
# DASHBOARD
# ============================================================================

@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    total_documents = db.query(Document).count()
    indexed_documents = db.query(Document).filter(Document.status == "indexed").count()
    failed_documents = db.query(Document).filter(Document.status == "failed").count()
    processing_documents = db.query(Document).filter(Document.status == "processing").count()
    
    total_chunks = db.query(Document).with_entities(Document.chunk_count).all()
    total_chunks_sum = sum(c[0] for c in total_chunks if c[0] is not None)
    
    total_messages = db.query(Message).count()
    
    # Calculate this week's queries
    week_ago = datetime.now().timestamp() - (7 * 24 * 60 * 60)
    this_week_queries = db.query(Message).filter(
        Message.created_at >= week_ago
    ).count()
    
    # Calculate previous week's queries for comparison
    two_weeks_ago = datetime.now().timestamp() - (14 * 24 * 60 * 60)
    last_week_queries = db.query(Message).filter(
        Message.created_at >= two_weeks_ago,
        Message.created_at < week_ago
    ).count()
    
    query_change = 0
    if last_week_queries > 0:
        query_change = round(((this_week_queries - last_week_queries) / last_week_queries) * 100)
    elif this_week_queries > 0:
        query_change = 100
    
    # Calculate indexing health
    indexing_health = 0
    if total_documents > 0:
        indexing_health = round((indexed_documents / total_documents) * 100)
    
    return DashboardStats(
        total_documents=total_documents,
        indexed_documents=indexed_documents,
        failed_documents=failed_documents,
        processing_documents=processing_documents,
        total_chunks=total_chunks_sum or 0,
        total_queries=total_messages,
        queries_this_week=this_week_queries,
        query_change_percent=query_change,
        indexing_health=indexing_health,
        documents_this_week=0  # Simplified for now
    )

# ============================================================================
# DOCUMENT MANAGEMENT
# ============================================================================

@app.post("/api/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process a document"""
    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.txt']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Validate file size
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum: {settings.MAX_UPLOAD_SIZE / (1024*1024):.0f}MB"
        )
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    original_filename = file.filename
    safe_filename = f"{file_id}_{original_filename}"
    file_path = Path(settings.UPLOAD_DIR) / safe_filename
    
    # Save file
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Determine file type
    file_type = file_ext[1:]  # Remove the dot
    
    # Create document record
    document = Document(
        id=file_id,
        filename=safe_filename,
        original_filename=original_filename,
        file_type=file_type,
        file_size=file_size,
        status="processing",
        created_at=datetime.now().timestamp(),
        updated_at=datetime.now().timestamp()
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Process document asynchronously (in background)
    # For simplicity, we'll process synchronously but with status updates
    try:
        # Update status
        document.status = "processing"
        document.updated_at = datetime.now().timestamp()
        db.commit()
        
        # Process document
        result = document_processor.process_document(
            file_path=str(file_path),
            document_id=file_id,
            original_filename=original_filename
        )
        
        # Update document with processing results
        document.page_count = result.get("page_count", 0)
        document.chunk_count = result.get("chunk_count", 0)
        document.status = "indexed"
        document.updated_at = datetime.now().timestamp()
        db.commit()
        
        return DocumentUploadResponse(
            id=file_id,
            filename=original_filename,
            status="indexed",
            chunk_count=result.get("chunk_count", 0),
            page_count=result.get("page_count", 0),
            message="Document processed successfully"
        )
        
    except Exception as e:
        # Update document with error
        document.status = "failed"
        document.error_message = str(e)
        document.updated_at = datetime.now().timestamp()
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}"
        )

@app.get("/api/documents", response_model=List[DocumentListResponse])
async def get_documents(db: Session = Depends(get_db)):
    """Get all documents"""
    documents = db.query(Document).order_by(Document.created_at.desc()).all()
    
    result = []
    for doc in documents:
        # Count questions referencing this document
        source_count = db.query(MessageSource).filter(
            MessageSource.document_id == doc.id
        ).count()
        
        result.append(
            DocumentListResponse(
                id=doc.id,
                filename=doc.original_filename,
                status=doc.status,
                chunk_count=doc.chunk_count or 0,
                page_count=doc.page_count or 0,
                file_size=doc.file_size,
                file_type=doc.file_type,
                created_at=doc.created_at,
                updated_at=doc.updated_at,
                error_message=doc.error_message,
                source_count=source_count
            )
        )
    
    return result

@app.get("/api/documents/{document_id}", response_model=DocumentDetailResponse)
async def get_document_detail(
    document_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed document information"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Count sources
    source_count = db.query(MessageSource).filter(
        MessageSource.document_id == document_id
    ).count()
    
    # Get extracted content preview from vector store
    content_preview = None
    if document.status == "indexed":
        content_preview = document_processor.get_document_preview(document_id)
    
    return DocumentDetailResponse(
        id=document.id,
        filename=document.original_filename,
        status=document.status,
        chunk_count=document.chunk_count or 0,
        page_count=document.page_count or 0,
        file_size=document.file_size,
        file_type=document.file_type,
        created_at=document.created_at,
        updated_at=document.updated_at,
        error_message=document.error_message,
        source_count=source_count,
        content_preview=content_preview
    )

@app.get("/api/documents/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    document_id: str,
    db: Session = Depends(get_db)
):
    """Get document processing status"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    progress = 0
    stage = "idle"
    
    if document.status == "processing":
        progress = 50
        stage = "processing"
    elif document.status == "indexed":
        progress = 100
        stage = "completed"
    elif document.status == "failed":
        progress = 0
        stage = "failed"
    else:
        progress = 100
        stage = "completed"
    
    return DocumentStatusResponse(
        status=document.status,
        progress=progress,
        stage=stage,
        chunks=document.chunk_count or 0,
        pages=document.page_count or 0,
        error=document.error_message
    )

@app.post("/api/documents/{document_id}/reprocess", response_model=DocumentReprocessResponse)
async def reprocess_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """Reprocess a document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete existing vectors
    document_processor.delete_document_vectors(document_id)
    
    # Reset status
    document.status = "processing"
    document.chunk_count = 0
    document.page_count = 0
    document.error_message = None
    document.updated_at = datetime.now().timestamp()
    db.commit()
    
    try:
        # Process document
        file_path = Path(settings.UPLOAD_DIR) / document.filename
        
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found"
            )
        
        result = document_processor.process_document(
            file_path=str(file_path),
            document_id=document_id,
            original_filename=document.original_filename
        )
        
        # Update document
        document.page_count = result.get("page_count", 0)
        document.chunk_count = result.get("chunk_count", 0)
        document.status = "indexed"
        document.updated_at = datetime.now().timestamp()
        db.commit()
        
        return DocumentReprocessResponse(
            id=document_id,
            status="indexed",
            chunk_count=result.get("chunk_count", 0),
            page_count=result.get("page_count", 0),
            message="Document reprocessed successfully"
        )
        
    except Exception as e:
        document.status = "failed"
        document.error_message = str(e)
        document.updated_at = datetime.now().timestamp()
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reprocess document: {str(e)}"
        )

@app.delete("/api/documents/{document_id}", response_model=DocumentDeleteResponse)
async def delete_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """Delete a document and its vectors"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete from vector store
    document_processor.delete_document_vectors(document_id)
    
    # Delete associated sources and messages (cascade handled by SQLAlchemy)
    db.query(MessageSource).filter(MessageSource.document_id == document_id).delete()
    db.query(Message).filter(Message.document_id == document_id).delete()
    
    # Delete file
    file_path = Path(settings.UPLOAD_DIR) / document.filename
    if file_path.exists():
        os.remove(file_path)
    
    # Delete document record
    db.delete(document)
    db.commit()
    
    return DocumentDeleteResponse(
        id=document_id,
        message="Document deleted successfully"
    )

# ============================================================================
# CHAT SESSIONS
# ============================================================================

@app.post("/api/chat/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    db: Session = Depends(get_db)
):
    """Create a new chat session"""
    session = ChatSession(
        id=str(uuid.uuid4()),
        title=session_data.title or "New Chat",
        created_at=datetime.now().timestamp(),
        updated_at=datetime.now().timestamp()
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return ChatSessionResponse(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=0
    )

@app.get("/api/chat/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(db: Session = Depends(get_db)):
    """Get all chat sessions"""
    sessions = db.query(ChatSession).order_by(
        ChatSession.updated_at.desc()
    ).all()
    
    result = []
    for session in sessions:
        message_count = db.query(Message).filter(
            Message.session_id == session.id
        ).count()
        
        result.append(
            ChatSessionResponse(
                id=session.id,
                title=session.title,
                created_at=session.created_at,
                updated_at=session.updated_at,
                message_count=message_count
            )
        )
    
    return result

@app.get("/api/chat/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific chat session with its messages"""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    messages = db.query(Message).filter(
        Message.session_id == session_id
    ).order_by(Message.created_at.asc()).all()
    
    message_count = len(messages)
    
    return ChatSessionResponse(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=message_count,
        messages=messages
    )

@app.delete("/api/chat/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Delete a chat session"""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Delete associated messages and sources
    messages = db.query(Message).filter(Message.session_id == session_id).all()
    for message in messages:
        db.query(MessageSource).filter(MessageSource.message_id == message.id).delete()
        db.delete(message)
    
    db.delete(session)
    db.commit()
    
    return {"message": "Chat session deleted successfully"}

# ============================================================================
# CHAT MESSAGES
# ============================================================================

@app.post("/api/chat/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    session_id: str,
    request: ChatMessageRequest,
    db: Session = Depends(get_db)
):
    """Send a message and get AI response"""
    # Get or create session
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Save user message
    user_message = Message(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role="user",
        content=request.question,
        created_at=datetime.now().timestamp()
    )
    db.add(user_message)
    db.commit()
    
    # Generate AI response
    try:
        # Get conversation history for context
        previous_messages = db.query(Message).filter(
            Message.session_id == session_id
        ).order_by(Message.created_at.desc()).limit(5).all()
        
        conversation_history = [
            {"role": m.role, "content": m.content}
            for m in reversed(previous_messages[:-1])  # Exclude current message
        ]
        
        # Generate answer using RAG
        result = rag_service.answer_question(
            question=request.question,
            conversation_history=conversation_history
        )
        
        # Save AI message
        ai_message = Message(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role="assistant",
            content=result["answer"],
            created_at=datetime.now().timestamp()
        )
        db.add(ai_message)
        db.commit()
        
        # Save sources
        sources_added = []
        for source in result.get("sources", []):
            message_source = MessageSource(
                id=str(uuid.uuid4()),
                message_id=ai_message.id,
                document_id=source.get("document_id"),
                chunk_id=source.get("chunk_id"),
                page_number=source.get("page_number"),
                similarity_score=source.get("similarity_score"),
                document_name=source.get("document_name")
            )
            db.add(message_source)
            sources_added.append(message_source)
        
        db.commit()
        
        # Build source references
        source_refs = []
        for source in result.get("sources", []):
            source_refs.append(
                SourceReference(
                    document_id=source.get("document_id", ""),
                    document_name=source.get("document_name", ""),
                    page_number=source.get("page_number", 1),
                    chunk_id=source.get("chunk_id", ""),
                    similarity_score=source.get("similarity_score", 0.0),
                    text=source.get("text", "")
                )
            )
        
        # Update session timestamp
        session.updated_at = datetime.now().timestamp()
        db.commit()
        
        return ChatMessageResponse(
            message_id=ai_message.id,
            answer=result["answer"],
            sources=source_refs,
            has_answer=result.get("has_answer", True),
            confidence=result.get("confidence", 0.5)
        )
        
    except Exception as e:
        # Log error and return error response
        import traceback
        traceback.print_exc()
        
        # Save error message
        error_message = Message(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role="assistant",
            content="I encountered an error while processing your question. Please try again.",
            created_at=datetime.now().timestamp()
        )
        db.add(error_message)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {str(e)}"
        )

# ============================================================================
# SEARCH
# ============================================================================

@app.get("/api/search")
async def search_documents(
    q: str,
    db: Session = Depends(get_db)
):
    """Search across documents and chat history"""
    if not q or len(q) < 2:
        return {"documents": [], "messages": []}
    
    # Search documents
    documents = db.query(Document).filter(
        Document.original_filename.ilike(f"%{q}%"),
        Document.status == "indexed"
    ).limit(5).all()
    
    # Search messages
    messages = db.query(Message).filter(
        Message.content.ilike(f"%{q}%")
    ).order_by(Message.created_at.desc()).limit(10).all()
    
    return {
        "documents": [
            {
                "id": doc.id,
                "filename": doc.original_filename,
                "chunk_count": doc.chunk_count,
                "status": doc.status
            }
            for doc in documents
        ],
        "messages": [
            {
                "id": msg.id,
                "content": msg.content[:200] + ("..." if len(msg.content) > 200 else ""),
                "session_id": msg.session_id,
                "role": msg.role
            }
            for msg in messages
        ]
    }

# ============================================================================
# PROCESSING INFORMATION
# ============================================================================

@app.get("/api/processing/info")
async def get_processing_info():
    """Get information about the processing pipeline"""
    return {
        "status": "operational",
        "embedding_model": settings.EMBEDDING_MODEL,
        "chunk_size": settings.CHUNK_SIZE,
        "chunk_overlap": settings.CHUNK_OVERLAP,
        "supported_formats": ["pdf", "docx", "txt"],
        "max_file_size_mb": settings.MAX_UPLOAD_SIZE / (1024 * 1024)
    }

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "error": "An unexpected error occurred",
            "detail": str(exc) if settings.DEBUG else None
        }
    )

# ============================================================================
# ROOT
# ============================================================================

@app.get("/")
async def root():
    return {
        "name": "Veridoc AI API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
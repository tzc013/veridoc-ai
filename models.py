# backend/models.py
"""
Veridoc AI - Database Models
SQLAlchemy models for all application tables
"""

from sqlalchemy import (
    Column, String, Integer, Float, Text, 
    BigInteger, DateTime, ForeignKey, Index,
    CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base

# ============================================================================
# DOCUMENT MODEL
# ============================================================================

class Document(Base):
    """Document model for uploaded files"""
    __tablename__ = "documents"
    
    # Primary key
    id = Column(String(36), primary_key=True, index=True)
    
    # File information
    filename = Column(String(255), nullable=False)  # Safe filename on disk
    original_filename = Column(String(255), nullable=False)  # Original uploaded name
    file_type = Column(String(10), nullable=False)  # pdf, docx, txt
    file_size = Column(Integer, nullable=False)  # Size in bytes
    
    # Processing status
    status = Column(
        String(20), 
        nullable=False, 
        default="processing",
        server_default="processing"
    )  # processing, indexed, failed
    
    # Document metadata
    page_count = Column(Integer, nullable=True)
    chunk_count = Column(Integer, nullable=True, default=0, server_default="0")
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(BigInteger, nullable=False)  # Unix timestamp
    updated_at = Column(BigInteger, nullable=False)  # Unix timestamp
    
    # Relationships
    message_sources = relationship("MessageSource", back_populates="document", cascade="all, delete-orphan")
    
    # Indexes for performance
    __table_args__ = (
        Index("idx_documents_status", "status"),
        Index("idx_documents_file_type", "file_type"),
        Index("idx_documents_created", "created_at"),
        Index("idx_documents_filename", "filename"),
    )
    
    def __repr__(self):
        return f"<Document(id={self.id}, filename={self.original_filename}, status={self.status})>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "filename": self.original_filename,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "status": self.status,
            "page_count": self.page_count,
            "chunk_count": self.chunk_count,
            "error_message": self.error_message,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

# ============================================================================
# CHAT SESSION MODEL
# ============================================================================

class ChatSession(Base):
    """Chat session model for conversations"""
    __tablename__ = "chat_sessions"
    
    # Primary key
    id = Column(String(36), primary_key=True, index=True)
    
    # Session metadata
    title = Column(String(255), nullable=False, default="New Chat", server_default="New Chat")
    description = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(BigInteger, nullable=False)  # Unix timestamp
    updated_at = Column(BigInteger, nullable=False)  # Unix timestamp
    
    # Relationships
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index("idx_sessions_updated", "updated_at"),
        Index("idx_sessions_created", "created_at"),
    )
    
    def __repr__(self):
        return f"<ChatSession(id={self.id}, title={self.title}, messages={len(self.messages)})>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "message_count": len(self.messages) if hasattr(self, 'messages') else 0
        }

# ============================================================================
# MESSAGE MODEL
# ============================================================================

class Message(Base):
    """Message model for chat conversations"""
    __tablename__ = "messages"
    
    # Primary key
    id = Column(String(36), primary_key=True, index=True)
    
    # Foreign keys
    session_id = Column(
        String(36), 
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Message content
    role = Column(
        String(20), 
        nullable=False,
        server_default="user"
    )  # user, assistant, system
    content = Column(Text, nullable=False)
    
    # Metadata
    token_count = Column(Integer, nullable=True)
    processing_time = Column(Float, nullable=True)  # Time in seconds
    
    # Timestamp
    created_at = Column(BigInteger, nullable=False)  # Unix timestamp
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    sources = relationship("MessageSource", back_populates="message", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index("idx_messages_session", "session_id", "created_at"),
        Index("idx_messages_role", "role"),
        Index("idx_messages_created", "created_at"),
        Index("idx_messages_session_role", "session_id", "role"),
    )
    
    def __repr__(self):
        preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return f"<Message(id={self.id}, role={self.role}, preview='{preview}')>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "session_id": self.session_id,
            "role": self.role,
            "content": self.content,
            "token_count": self.token_count,
            "created_at": self.created_at,
            "has_sources": len(self.sources) > 0 if hasattr(self, 'sources') else False
        }

# ============================================================================
# MESSAGE SOURCE MODEL
# ============================================================================

class MessageSource(Base):
    """Message source model linking AI responses to document sources"""
    __tablename__ = "message_sources"
    
    # Primary key
    id = Column(String(36), primary_key=True, index=True)
    
    # Foreign keys
    message_id = Column(
        String(36),
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    document_id = Column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Source metadata
    chunk_id = Column(String(255), nullable=True)  # ID in vector store
    document_name = Column(String(255), nullable=True)  # Denormalized for quick access
    page_number = Column(Integer, nullable=True)
    similarity_score = Column(Float, nullable=True)  # Retrieval score
    text_snippet = Column(Text, nullable=True)  # Preview of the source text
    
    # Timestamp
    created_at = Column(BigInteger, nullable=False)  # Unix timestamp
    
    # Relationships
    message = relationship("Message", back_populates="sources")
    document = relationship("Document", back_populates="message_sources")
    
    # Indexes
    __table_args__ = (
        Index("idx_sources_message", "message_id"),
        Index("idx_sources_document", "document_id"),
        Index("idx_sources_score", "similarity_score"),
        Index("idx_sources_message_document", "message_id", "document_id"),
    )
    
    def __repr__(self):
        return f"<MessageSource(id={self.id}, message_id={self.message_id}, document='{self.document_name}')>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "message_id": self.message_id,
            "document_id": self.document_id,
            "document_name": self.document_name,
            "page_number": self.page_number,
            "similarity_score": self.similarity_score,
            "text_snippet": self.text_snippet,
            "created_at": self.created_at
        }

# ============================================================================
# AGGREGATE MODELS (For analytics and reporting)
# ============================================================================

# Note: These are not actual database tables but represent
# aggregate data structures for the application

class DocumentStats:
    """Aggregated document statistics"""
    def __init__(self, total=0, indexed=0, processing=0, failed=0, 
                 total_chunks=0, total_pages=0, total_size=0):
        self.total = total
        self.indexed = indexed
        self.processing = processing
        self.failed = failed
        self.total_chunks = total_chunks
        self.total_pages = total_pages
        self.total_size = total_size
    
    def to_dict(self):
        return {
            "total": self.total,
            "indexed": self.indexed,
            "processing": self.processing,
            "failed": self.failed,
            "total_chunks": self.total_chunks,
            "total_pages": self.total_pages,
            "total_size": self.total_size,
            "indexing_rate": round((self.indexed / self.total * 100), 2) if self.total > 0 else 0
        }

class ChatStats:
    """Aggregated chat statistics"""
    def __init__(self, total_sessions=0, total_messages=0, 
                 user_messages=0, assistant_messages=0,
                 average_response_time=0.0):
        self.total_sessions = total_sessions
        self.total_messages = total_messages
        self.user_messages = user_messages
        self.assistant_messages = assistant_messages
        self.average_response_time = average_response_time
    
    def to_dict(self):
        return {
            "total_sessions": self.total_sessions,
            "total_messages": self.total_messages,
            "user_messages": self.user_messages,
            "assistant_messages": self.assistant_messages,
            "average_response_time": self.average_response_time
        }

class QueryStats:
    """Aggregated query statistics"""
    def __init__(self, total=0, this_week=0, last_week=0,
                 unique_documents=0, top_documents=None):
        self.total = total
        self.this_week = this_week
        self.last_week = last_week
        self.unique_documents = unique_documents
        self.top_documents = top_documents or []
    
    def to_dict(self):
        return {
            "total": self.total,
            "this_week": self.this_week,
            "last_week": self.last_week,
            "weekly_change": round(((self.this_week - self.last_week) / self.last_week * 100), 2) if self.last_week > 0 else 0,
            "unique_documents": self.unique_documents,
            "top_documents": self.top_documents
        }

# ============================================================================
# MODEL HELPERS
# ============================================================================

def get_model_by_tablename(tablename: str) -> type:
    """Get SQLAlchemy model class by table name"""
    models = {
        "documents": Document,
        "chat_sessions": ChatSession,
        "messages": Message,
        "message_sources": MessageSource
    }
    return models.get(tablename)

def get_all_models() -> list:
    """Get list of all model classes"""
    return [Document, ChatSession, Message, MessageSource]

def get_model_tables() -> dict:
    """Get dictionary of model names to model classes"""
    return {
        "documents": Document,
        "chat_sessions": ChatSession,
        "messages": Message,
        "message_sources": MessageSource
    }

# ============================================================================
# EXPORTED INTERFACE
# ============================================================================

__all__ = [
    # Core models
    "Document",
    "ChatSession",
    "Message",
    "MessageSource",
    
    # Aggregate models
    "DocumentStats",
    "ChatStats",
    "QueryStats",
    
    # Helpers
    "get_model_by_tablename",
    "get_all_models",
    "get_model_tables",
]

# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

# This will be run when the module is imported
# But tables should be created explicitly via database.init_database()

if __name__ == "__main__":
    # For testing purposes
    from database import init_database
    init_database()
    print("Database tables created successfully")
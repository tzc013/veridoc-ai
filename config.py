# backend/config.py
"""
Veridoc AI - Configuration
Environment variables and application settings
"""

import os
from typing import Optional, List
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ============================================================================
# BASE DIRECTORIES
# ============================================================================

# Project root directory (backend/)
BASE_DIR = Path(__file__).parent.parent
BACKEND_DIR = Path(__file__).parent
FRONTEND_DIR = BASE_DIR / "frontend"

# Data directories
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
CHROMA_DIR = DATA_DIR / "chroma"
DOCUMENTS_DIR = BASE_DIR / "documents"

# Create directories if they don't exist
for dir_path in [DATA_DIR, UPLOAD_DIR, CHROMA_DIR, DOCUMENTS_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# ============================================================================
# APPLICATION SETTINGS
# ============================================================================

class Settings:
    """Application settings loaded from environment variables"""
    
    # ------------------------------------------------------------------------
    # API Settings
    # ------------------------------------------------------------------------
    
    APP_NAME: str = "Veridoc AI"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Document intelligence platform with RAG capabilities"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # API host and port
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # API URL (for CORS and references)
    API_URL: str = os.getenv("API_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Allowed origins for CORS
    ALLOWED_ORIGINS: List[str] = [
        FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # ------------------------------------------------------------------------
    # Database Settings
    # ------------------------------------------------------------------------
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BACKEND_DIR}/veridoc.db"
    )
    
    # SQLite connection settings
    SQLITE_POOL_SIZE: int = 5
    SQLITE_MAX_OVERFLOW: int = 10
    SQLITE_POOL_TIMEOUT: int = 30
    
    # ------------------------------------------------------------------------
    # Vector Database Settings
    # ------------------------------------------------------------------------
    
    CHROMA_PERSIST_DIRECTORY: str = os.getenv(
        "CHROMA_PERSIST_DIRECTORY",
        str(CHROMA_DIR)
    )
    CHROMA_COLLECTION_NAME: str = os.getenv(
        "CHROMA_COLLECTION_NAME",
        "veridoc_documents"
    )
    
    # ------------------------------------------------------------------------
    # File Upload Settings
    # ------------------------------------------------------------------------
    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", str(UPLOAD_DIR))
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", "20971520"))  # 20MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt"]
    MAX_FILENAME_LENGTH: int = 255
    
    # ------------------------------------------------------------------------
    # Document Processing Settings
    # ------------------------------------------------------------------------
    
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "800"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "150"))
    MIN_CHUNK_SIZE: int = 50  # Minimum chunk size in characters
    
    # Embedding model
    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL",
        "all-MiniLM-L6-v2"
    )
    
    # ------------------------------------------------------------------------
    # RAG Settings
    # ------------------------------------------------------------------------
    
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "5"))
    RAG_SIMILARITY_THRESHOLD: float = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.5"))
    RAG_MAX_CONTEXT_LENGTH: int = int(os.getenv("RAG_MAX_CONTEXT_LENGTH", "4000"))
    
    # ------------------------------------------------------------------------
    # LLM Settings
    # ------------------------------------------------------------------------
    
    # LLM Provider: "gemini", "openai", "local"
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini").lower()
    
    # Gemini settings
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    # OpenAI settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    
    # LLM Model (used by the provider)
    LLM_MODEL: str = os.getenv("LLM_MODEL", GEMINI_MODEL)
    
    # LLM generation settings
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "1000"))
    LLM_TOP_P: float = float(os.getenv("LLM_TOP_P", "0.9"))
    LLM_TOP_K: int = int(os.getenv("LLM_TOP_K", "40"))
    
    # ------------------------------------------------------------------------
    # Chat Settings
    # ------------------------------------------------------------------------
    
    MAX_MESSAGE_LENGTH: int = int(os.getenv("MAX_MESSAGE_LENGTH", "2000"))
    MAX_HISTORY_MESSAGES: int = int(os.getenv("MAX_HISTORY_MESSAGES", "10"))
    DEFAULT_SESSION_TITLE: str = "New Chat"
    
    # ------------------------------------------------------------------------
    # Caching Settings
    # ------------------------------------------------------------------------
    
    ENABLE_CACHE: bool = os.getenv("ENABLE_CACHE", "True").lower() == "true"
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour
    MAX_CACHE_SIZE: int = int(os.getenv("MAX_CACHE_SIZE", "1000"))
    
    # ------------------------------------------------------------------------
    # Logging Settings
    # ------------------------------------------------------------------------
    
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: Optional[str] = os.getenv("LOG_FILE")
    
    # ------------------------------------------------------------------------
    # Rate Limiting
    # ------------------------------------------------------------------------
    
    ENABLE_RATE_LIMITING: bool = os.getenv("ENABLE_RATE_LIMITING", "True").lower() == "true"
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
    RATE_LIMIT_PERIOD: int = int(os.getenv("RATE_LIMIT_PERIOD", "60"))  # seconds
    
    # ------------------------------------------------------------------------
    # Security Settings
    # ------------------------------------------------------------------------
    
    # Secret key for sessions and tokens (if needed)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    
    # API key authentication (optional)
    ENABLE_API_KEY_AUTH: bool = os.getenv("ENABLE_API_KEY_AUTH", "False").lower() == "true"
    API_KEY: Optional[str] = os.getenv("API_KEY")
    
    # ------------------------------------------------------------------------
    # Feature Flags
    # ------------------------------------------------------------------------
    
    ENABLE_STREAMING: bool = os.getenv("ENABLE_STREAMING", "False").lower() == "true"
    ENABLE_ANALYTICS: bool = os.getenv("ENABLE_ANALYTICS", "True").lower() == "true"
    ENABLE_DOCUMENT_PREVIEW: bool = os.getenv("ENABLE_DOCUMENT_PREVIEW", "True").lower() == "true"
    ENABLE_SOURCE_HIGHLIGHTING: bool = os.getenv("ENABLE_SOURCE_HIGHLIGHTING", "True").lower() == "true"
    
    # ========================================================================
    # VALIDATION METHODS
    # ========================================================================
    
    def validate(self) -> List[str]:
        """Validate required settings and return list of missing ones"""
        missing = []
        
        # Check LLM provider specific requirements
        if self.LLM_PROVIDER == "gemini" and not self.GEMINI_API_KEY:
            missing.append("GEMINI_API_KEY (required for Gemini provider)")
        elif self.LLM_PROVIDER == "openai" and not self.OPENAI_API_KEY:
            missing.append("OPENAI_API_KEY (required for OpenAI provider)")
        elif self.LLM_PROVIDER == "local":
            # Local provider is not fully implemented
            missing.append("Local LLM provider is not fully implemented yet")
        
        return missing
    
    def is_valid(self) -> bool:
        """Check if all required settings are valid"""
        return len(self.validate()) == 0
    
    # ========================================================================
    # DISPLAY METHODS
    # ========================================================================
    
    def get_summary(self) -> dict:
        """Get a summary of current settings"""
        return {
            "app_name": self.APP_NAME,
            "version": self.APP_VERSION,
            "debug": self.DEBUG,
            "database": self.DATABASE_URL,
            "llm_provider": self.LLM_PROVIDER,
            "llm_model": self.LLM_MODEL,
            "embedding_model": self.EMBEDDING_MODEL,
            "chunk_size": self.CHUNK_SIZE,
            "chunk_overlap": self.CHUNK_OVERLAP,
            "rag_top_k": self.RAG_TOP_K,
            "similarity_threshold": self.RAG_SIMILARITY_THRESHOLD,
            "max_upload_size_mb": self.MAX_UPLOAD_SIZE / (1024 * 1024),
            "allowed_extensions": self.ALLOWED_EXTENSIONS,
            "cache_enabled": self.ENABLE_CACHE,
            "rate_limiting_enabled": self.ENABLE_RATE_LIMITING,
            "streaming_enabled": self.ENABLE_STREAMING,
        }
    
    def __repr__(self) -> str:
        return f"<Settings(app_name={self.APP_NAME}, version={self.APP_VERSION})>"

# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

# Create a single instance of settings
settings = Settings()

# ============================================================================
# CONFIGURATION UTILITIES
# ============================================================================

def get_upload_path(filename: str) -> Path:
    """Get the full path for an uploaded file"""
    return Path(settings.UPLOAD_DIR) / filename

def get_document_path(filename: str) -> Path:
    """Get the full path for a sample document"""
    return Path(DOCUMENTS_DIR) / filename

def get_chroma_path() -> Path:
    """Get the ChromaDB persistence path"""
    return Path(settings.CHROMA_PERSIST_DIRECTORY)

def get_database_path() -> Path:
    """Get the database file path"""
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    return Path(db_path)

def is_allowed_extension(filename: str) -> bool:
    """Check if a file extension is allowed"""
    ext = Path(filename).suffix.lower()
    return ext in settings.ALLOWED_EXTENSIONS

def get_file_size_mb(file_size: int) -> float:
    """Convert file size from bytes to MB"""
    return file_size / (1024 * 1024)

def is_within_size_limit(file_size: int) -> bool:
    """Check if file size is within the limit"""
    return file_size <= settings.MAX_UPLOAD_SIZE

# ============================================================================
# ENVIRONMENT DETECTION
# ============================================================================

def is_production() -> bool:
    """Check if running in production environment"""
    return os.getenv("ENVIRONMENT", "development").lower() == "production"

def is_development() -> bool:
    """Check if running in development environment"""
    return os.getenv("ENVIRONMENT", "development").lower() == "development"

def is_docker() -> bool:
    """Check if running inside Docker container"""
    return os.path.exists("/.dockerenv") or os.path.exists("/run/.containerenv")

# ============================================================================
# EXPORTED INTERFACE
# ============================================================================

__all__ = [
    # Settings instance
    "settings",
    
    # Path functions
    "get_upload_path",
    "get_document_path", 
    "get_chroma_path",
    "get_database_path",
    
    # Validation functions
    "is_allowed_extension",
    "get_file_size_mb",
    "is_within_size_limit",
    
    # Environment functions
    "is_production",
    "is_development",
    "is_docker",
    
    # Constants
    "BASE_DIR",
    "BACKEND_DIR",
    "FRONTEND_DIR",
    "DATA_DIR",
    "UPLOAD_DIR",
    "CHROMA_DIR",
    "DOCUMENTS_DIR",
]

# ============================================================================
# INITIALIZATION
# ============================================================================

if __name__ == "__main__":
    # Print configuration summary when run directly
    print("=" * 60)
    print(f"  {settings.APP_NAME} v{settings.APP_VERSION}")
    print("=" * 60)
    print("\nConfiguration Summary:")
    print("-" * 60)
    for key, value in settings.get_summary().items():
        print(f"  {key:30} {value}")
    print("-" * 60)
    
    # Validate settings
    missing = settings.validate()
    if missing:
        print("\n⚠️  Missing required settings:")
        for item in missing:
            print(f"  - {item}")
    else:
        print("\n✓ All required settings are present")
    
    print(f"\nEnvironment: {'Production' if is_production() else 'Development'}")
    print(f"Docker: {'Yes' if is_docker() else 'No'}")
    print("\n" + "=" * 60)
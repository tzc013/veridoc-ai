# backend/database.py
"""
Veridoc AI - Database Configuration
SQLite database setup and connection management
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from config import settings

# Database URL
DATABASE_URL = settings.DATABASE_URL

# Ensure the directory exists
db_path = DATABASE_URL.replace("sqlite:///", "")
db_dir = os.path.dirname(db_path)
if db_dir and not os.path.exists(db_dir):
    os.makedirs(db_dir, exist_ok=True)

# Create engine with SQLite optimizations
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,  # Wait up to 30 seconds for database lock
    },
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for models
Base = declarative_base()

# ============================================================================
# DATABASE DEPENDENCY
# ============================================================================

def get_db() -> Generator[Session, None, None]:
    """
    Dependency for database sessions.
    Yields a session that is closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================================
# DATABASE UTILITY FUNCTIONS
# ============================================================================

def init_database() -> None:
    """
    Initialize the database by creating all tables.
    Should be called on application startup.
    """
    from models import Document, ChatSession, Message, MessageSource
    
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully")

def reset_database() -> None:
    """
    Reset the database by dropping and recreating all tables.
    WARNING: This will delete all data!
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database reset successfully")

def get_connection_info() -> dict:
    """
    Get information about the current database connection.
    """
    return {
        "database_url": DATABASE_URL,
        "engine": str(engine.url),
        "pool_size": engine.pool.size() if hasattr(engine, "pool") else "N/A",
        "is_connected": True
    }

# ============================================================================
# DATABASE MIGRATION HELPERS (For future use)
# ============================================================================

def create_backup(backup_path: str) -> bool:
    """
    Create a backup of the SQLite database.
    """
    import shutil
    from pathlib import Path
    
    source = DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(source):
        return False
    
    try:
        shutil.copy2(source, backup_path)
        return True
    except Exception:
        return False

def restore_backup(backup_path: str) -> bool:
    """
    Restore a backup of the SQLite database.
    WARNING: This will overwrite the current database!
    """
    import shutil
    
    target = DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(backup_path):
        return False
    
    try:
        shutil.copy2(backup_path, target)
        return True
    except Exception:
        return False

def vacuum_database() -> bool:
    """
    Compact the SQLite database to reclaim unused space.
    """
    try:
        engine.execute("VACUUM")
        return True
    except Exception:
        return False

# ============================================================================
# DATABASE SESSION UTILITIES
# ============================================================================

class DatabaseSession:
    """
    Context manager for database sessions.
    Useful for manual session management outside of FastAPI routes.
    """
    
    def __init__(self):
        self.session = None
    
    def __enter__(self):
        self.session = SessionLocal()
        return self.session
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.session.rollback()
        self.session.close()
        return False

# ============================================================================
# QUERY UTILITIES
# ============================================================================

def execute_raw_query(query: str, params: dict = None) -> list:
    """
    Execute a raw SQL query and return results.
    Use with caution - only for administrative tasks.
    """
    with DatabaseSession() as session:
        result = session.execute(query, params or {})
        return [dict(row._mapping) for row in result]

def table_exists(table_name: str) -> bool:
    """
    Check if a table exists in the database.
    """
    with DatabaseSession() as session:
        result = session.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=:table_name",
            {"table_name": table_name}
        )
        return result.fetchone() is not None

def get_table_info(table_name: str) -> list:
    """
    Get schema information for a table.
    """
    with DatabaseSession() as session:
        result = session.execute(f"PRAGMA table_info({table_name})")
        return [dict(row._mapping) for row in result]

def get_row_count(table_name: str) -> int:
    """
    Get the number of rows in a table.
    """
    with DatabaseSession() as session:
        result = session.execute(f"SELECT COUNT(*) as count FROM {table_name}")
        row = result.fetchone()
        return row[0] if row else 0

# ============================================================================
# TRANSACTION HELPERS
# ============================================================================

class Transaction:
    """
    Decorator for wrapping functions in a database transaction.
    """
    
    @staticmethod
    def transactional(func):
        def wrapper(*args, **kwargs):
            with DatabaseSession() as session:
                try:
                    result = func(*args, **kwargs, session=session)
                    session.commit()
                    return result
                except Exception as e:
                    session.rollback()
                    raise e
        return wrapper

# ============================================================================
# INITIALIZATION
# ============================================================================

def setup_database():
    """
    Complete database setup function.
    Creates tables and performs any necessary initialization.
    """
    init_database()
    
    # Create upload directory if it doesn't exist
    from config import settings
    upload_dir = settings.UPLOAD_DIR
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)
        print(f"Created upload directory: {upload_dir}")
    
    # Create ChromaDB directory if it doesn't exist
    chroma_dir = settings.CHROMA_PERSIST_DIRECTORY
    if not os.path.exists(chroma_dir):
        os.makedirs(chroma_dir, exist_ok=True)
        print(f"Created ChromaDB directory: {chroma_dir}")
    
    print("Database setup complete")

# ============================================================================
# EXPORTED INTERFACE
# ============================================================================

__all__ = [
    # Engine and session
    "engine",
    "SessionLocal",
    "Base",
    "get_db",
    
    # Utilities
    "init_database",
    "reset_database",
    "get_connection_info",
    "create_backup",
    "restore_backup",
    "vacuum_database",
    
    # Session management
    "DatabaseSession",
    "execute_raw_query",
    "table_exists",
    "get_table_info",
    "get_row_count",
    "Transaction",
    
    # Setup
    "setup_database",
]
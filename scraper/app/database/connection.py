import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import logging

from app.config import settings

logger = logging.getLogger(__name__)

_connection_pool: pool.ThreadedConnectionPool | None = None


def init_connection_pool() -> pool.ThreadedConnectionPool:
    global _connection_pool
    if _connection_pool is None:
        _connection_pool = pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=settings.database_url,
            cursor_factory=RealDictCursor,
        )
        logger.info("Database connection pool initialized")
    return _connection_pool


def get_connection_pool() -> pool.ThreadedConnectionPool:
    if _connection_pool is None:
        return init_connection_pool()
    return _connection_pool


@contextmanager
def get_connection():
    pool = get_connection_pool()
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


@contextmanager
def get_cursor():
    with get_connection() as conn:
        with conn.cursor() as cursor:
            yield cursor


def close_connection_pool():
    global _connection_pool
    if _connection_pool:
        _connection_pool.closeall()
        _connection_pool = None
        logger.info("Database connection pool closed")
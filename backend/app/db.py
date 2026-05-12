import hashlib
import json
import secrets
import sqlite3
from datetime import datetime
from pathlib import Path
from .schemas import AstroRequest, AstroResponse

DB_PATH = Path(__file__).resolve().parent.parent / "reports.db"


def _hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000
    ).hex()


def _generate_salt() -> str:
    return secrets.token_hex(16)


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password_hash TEXT,
            salt TEXT,
            first_name TEXT,
            last_name TEXT,
            created_at TEXT
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            token TEXT UNIQUE,
            created_at TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            first_name TEXT,
            last_name TEXT,
            dob TEXT,
            country TEXT,
            zodiac TEXT,
            luck_score INTEGER,
            energy_level TEXT,
            lucky_color TEXT,
            lucky_color_hex TEXT,
            message TEXT,
            personality TEXT,
            dos TEXT,
            donts TEXT,
            daily_message TEXT,
            energy_status TEXT,
            created_at TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    conn.commit()
    conn.close()


def register_user(email: str, password: str, first_name: str, last_name: str) -> dict:
    salt = _generate_salt()
    password_hash = _hash_password(password, salt)
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (email, password_hash, salt, first_name, last_name, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (
                email,
                password_hash,
                salt,
                first_name,
                last_name,
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        user_id = cursor.lastrowid
        return {
            "id": user_id,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "created_at": datetime.utcnow().isoformat(),
        }
    except sqlite3.IntegrityError as exc:
        raise ValueError("User already exists") from exc
    finally:
        conn.close()


def authenticate_user(email: str, password: str) -> dict | None:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, email, password_hash, salt, first_name, last_name, created_at FROM users WHERE LOWER(email) = LOWER(?)",
        (email,),
    )
    user = cursor.fetchone()
    conn.close()
    if not user:
        return None

    user_id, stored_email, stored_hash, salt, first_name, last_name, created_at = user
    if _hash_password(password, salt) != stored_hash:
        return None

    return {
        "id": user_id,
        "email": stored_email,
        "first_name": first_name,
        "last_name": last_name,
        "created_at": created_at,
    }


def create_token(user_id: int) -> str:
    token = secrets.token_hex(32)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO tokens (user_id, token, created_at) VALUES (?, ?, ?)",
        (user_id, token, datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()
    return token


def get_user_by_token(token: str) -> dict | None:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT users.id, users.email, users.first_name, users.last_name, users.created_at
        FROM users
        INNER JOIN tokens ON tokens.user_id = users.id
        WHERE tokens.token = ?
        """,
        (token,),
    )
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row[0],
        "email": row[1],
        "first_name": row[2],
        "last_name": row[3],
        "created_at": row[4],
    }


def save_report(
    report: AstroResponse, request: AstroRequest, user_id: int | None = None
) -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        INSERT INTO history (
            user_id,
            first_name,
            last_name,
            dob,
            country,
            zodiac,
            luck_score,
            energy_level,
            lucky_color,
            lucky_color_hex,
            message,
            personality,
            dos,
            donts,
            daily_message,
            energy_status,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            request.first_name,
            request.last_name,
            request.dob.isoformat(),
            request.country,
            report.zodiac,
            report.luck_score,
            report.energy_level,
            report.lucky_color,
            report.lucky_color_hex,
            report.message,
            report.personality,
            json.dumps(report.dos),
            json.dumps(report.donts),
            report.daily_message,
            report.energy_status,
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()
    conn.close()


def get_history(
    first_name: str | None = None,
    last_name: str | None = None,
    user_id: int | None = None,
) -> list[dict]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    query = "SELECT id, first_name, last_name, dob, country, zodiac, luck_score, energy_level, lucky_color, lucky_color_hex, message, personality, dos, donts, daily_message, energy_status, created_at FROM history"
    params: list[str | int] = []
    filters: list[str] = []

    if user_id is not None:
        filters.append("user_id = ?")
        params.append(user_id)
    if first_name:
        filters.append("LOWER(first_name) = LOWER(?)")
        params.append(first_name)
    if last_name:
        filters.append("LOWER(last_name) = LOWER(?)")
        params.append(last_name)

    if filters:
        query += " WHERE " + " AND ".join(filters)

    query += " ORDER BY created_at DESC LIMIT 10"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    history = []
    for row in rows:
        history.append(
            {
                "id": row[0],
                "first_name": row[1],
                "last_name": row[2],
                "dob": row[3],
                "country": row[4],
                "zodiac": row[5],
                "luck_score": row[6],
                "energy_level": row[7],
                "lucky_color": row[8],
                "lucky_color_hex": row[9],
                "message": row[10],
                "personality": row[11],
                "dos": json.loads(row[12]),
                "donts": json.loads(row[13]),
                "daily_message": row[14],
                "energy_status": row[15],
                "created_at": row[16],
            }
        )
    return history

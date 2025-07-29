# app/services/log.py

import os
import json
from datetime import datetime
from pathlib import Path
from fastapi.concurrency import run_in_threadpool

LOG_DIR = Path(os.getenv("LOG_DIR", "./logs")).resolve()
LOG_DIR.mkdir(parents=True, exist_ok=True)

async def save_log(entry: dict):
    """Save log entry as a JSON line in today's log file."""
    log_file = LOG_DIR / f"{datetime.now().strftime('%Y-%m-%d')}.log"

    # Ensure each log is on a single line for easy ingestion by Loki later
    line = json.dumps(entry, ensure_ascii=False)

    # Use thread pool to avoid blocking FastAPI event loop
    await run_in_threadpool(_write_log_line, log_file, line)

def _write_log_line(file_path: Path, line: str):
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(line + "\n")

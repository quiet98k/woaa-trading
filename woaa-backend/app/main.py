from fastapi import FastAPI
from app.database import engine
from app.models.position import Position
from app.database import Base
from sqlalchemy import text

app = FastAPI()

@app.on_event("startup")
def on_startup():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✅ DB connected:", result.scalar_one())
    Base.metadata.create_all(bind=engine)

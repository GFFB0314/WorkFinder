from fastapi import FastAPI
from app.database import engine, Base
from app import models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="WorkFinder API")

@app.get("/health")
def health_check():
    return {"status": "ok"}

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for binary compilation (if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 --retries=3 -r requirements.txt

# Pre-download spaCy models during build
RUN python -m spacy download fr_core_news_sm
RUN python -m spacy download en_core_web_sm

# Pre-download SentenceTransformer model during build
# This maps paraphrase-multilingual-MiniLM-L12-v2 cache into the image
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Quick Setup Guide - Running the API Locally

## Prerequisites

You need PostgreSQL installed on your machine. If you don't have it:

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Or use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres`

## Setup Steps

### 1. Configure Database Connection

Edit `backend/.env` and add:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/workfinder
```

**Replace `your_password`** with your actual PostgreSQL password.

### 2. Create the Database

Open PostgreSQL command line (psql) or pgAdmin and run:

```sql
CREATE DATABASE workfinder;
```

### 3. Install Dependencies (if not already done)

```bash
cd WorkFinder/backend
pip install -r requirements.txt
```

### 4. Start the API

```bash
cd WorkFinder/backend
uvicorn app.main:app --reload
```

You should see:
```
Starting WorkFinder API...
Creating database tables...
Database tables created successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 5. Seed the Database (Optional)

```bash
python seed_db.py
```

This will create 5 initial job sources (Remotive, Adzuna, etc.)

### 6. Test Everything

```bash
python test_api.py
```

This will:
- ✅ Test deduplication
- ✅ Test all query parameters
- ✅ Test CRUD operations
- ✅ Create sample jobs for testing

## Access the API

- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## Common Issues

### Issue 1: "could not translate host name 'db'"

**Solution:** Update `.env` with local PostgreSQL connection:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/workfinder
```

### Issue 2: "database 'workfinder' does not exist"

**Solution:** Create the database:
```sql
CREATE DATABASE workfinder;
```

### Issue 3: "connection refused"

**Solution:** Make sure PostgreSQL is running:
```bash
# Check if PostgreSQL is running
# Windows: Check Services
# Linux/Mac: sudo systemctl status postgresql
```

## Testing Manually

### Test Health
```bash
curl http://localhost:8000/health
```

### List Sources
```bash
curl http://localhost:8000/api/sources
```

### Create a Job
```bash
curl -X POST http://localhost:8000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Developer",
    "company": "TestCorp",
    "location": "Remote",
    "remote": true,
    "source_id": 1
  }'
```

### Test Deduplication (try creating the same job again)
```bash
# Run the same curl command again - should get 400 error
```

### Test Query Parameters
```bash
# Remote jobs only
curl "http://localhost:8000/api/jobs?remote=true"

# Search for Python
curl "http://localhost:8000/api/jobs?search=python"

# Filter by skills
curl "http://localhost:8000/api/jobs?skills=python,react"
```

## Summary

**To answer your questions:**

1. **Deduplication**: ✅ Working for exact matches (title + company)
   - Will be enhanced in Week 7 with fuzzy matching

2. **Query Parameters**: ✅ Implemented, needs testing with real data
   - Use `test_api.py` to verify

3. **Database Connection**: ✅ Yes, just update `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/workfinder
   ```
   Make sure to create the database first!

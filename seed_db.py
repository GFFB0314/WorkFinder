"""
Seed Script for WorkFinder Database

This script populates the database with initial sources for testing.
Run this after starting the API to add sample data.
"""

import requests
import json

API_BASE_URL = "http://127.0.0.1:8000/" #  http://127.0.0.1:8000/


def create_sources():
    """Create initial job sources in the database"""
    sources = [
        {
            "name": "Remotive",
            "url": "https://remotive.com/api/remote-jobs",
            "source_type": "api",
            "scrape_frequency": "daily"
        },
        {
            "name": "Adzuna",
            "url": "https://api.adzuna.com",
            "source_type": "api",
            "scrape_frequency": "daily"
        },
        {
            "name": "WeWorkRemotely",
            "url": "https://weworkremotely.com/remote-jobs.rss",
            "source_type": "rss",
            "scrape_frequency": "daily"
        },
        {
            "name": "Jobartis",
            "url": "https://www.jobartis.com",
            "source_type": "html",
            "scrape_frequency": "weekly"
        },
        {
            "name": "Emploi.cm",
            "url": "https://www.emploi.cm",
            "source_type": "html",
            "scrape_frequency": "weekly"
        }
    ]
    
    print("Creating sources...")
    for source in sources:
        try:
            response = requests.post(f"{API_BASE_URL}/api/sources", json=source)
            if response.status_code == 201:
                print(f"[OK] Created source: {source['name']}")
            elif response.status_code == 400:
                print(f"[WARN] Source already exists: {source['name']}")
            else:
                print(f"[FAIL] Failed to create source: {source['name']} - {response.text}")
        except Exception as e:
            print(f"[FAIL] Error creating source {source['name']}: {e}")


def list_sources():
    """List all sources"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/sources")
        if response.status_code == 200:
            sources = response.json()
            print(f"\n[INFO] Total sources: {len(sources)}")
            for source in sources:
                status = "[OK] Active" if source['status'] else "[FAIL] Inactive"
                print(f"  {source['id']}. {source['name']} ({source['source_type']}) - {status}")
        else:
            print(f"Failed to list sources: {response.text}")
    except Exception as e:
        print(f"Error listing sources: {e}")


def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print(f"[OK] API is healthy: {response.json()}")
            return True
        else:
            print(f"API health check failed: {response.text}")
            return False
    except Exception as e:
        print(f"[FAIL] Cannot connect to API: {e}")
        print(f"   Make sure the API is running on {API_BASE_URL}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("WorkFinder Database Seed Script")
    print("=" * 60)
    
    # Test API connection
    if not test_health():
        print("\n[FAIL] API is not running. Please start it first:")
        print("   cd backend; uvicorn app.main:app --reload")
        exit(1)
    
    print("\n" + "=" * 60)
    create_sources()
    print("\n" + "=" * 60)
    list_sources()
    print("\n" + "=" * 60)
    print("[OK] Seeding complete!")

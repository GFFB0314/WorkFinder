"""
Test Script for WorkFinder API

This script tests all the implemented features:
1. Deduplication logic
2. Query parameters (filtering, search, pagination)
3. CRUD operations

Run this after starting the API and seeding the database.
"""

import requests
import json
from typing import Dict, Any

API_BASE_URL = "http://localhost:8000"


def print_section(title: str):
    """Print a formatted section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def test_health():
    """Test 1: Health check"""
    print_section("TEST 1: Health Check")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False


def test_create_source():
    """Test 2: Create a test source"""
    print_section("TEST 2: Create Test Source")
    source_data = {
        "name": "TestSource",
        "url": "https://test.com/api/jobs",
        "source_type": "api",
        "scrape_frequency": "daily"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/api/sources", json=source_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code in [201, 400]:  # 400 if already exists
            return response.json().get('id') if response.status_code == 201 else 1
        return None
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return None


def test_create_jobs(source_id: int):
    """Test 3: Create test jobs"""
    print_section("TEST 3: Create Test Jobs")
    
    jobs = [
        {
            "title": "Senior Python Developer",
            "company": "TechCorp",
            "location": "Remote",
            "remote": True,
            "description": "Looking for a Python expert",
            "url": "https://example.com/job1",
            "skills": ["python", "django", "postgresql"],
            "source_id": source_id
        },
        {
            "title": "Frontend React Developer",
            "company": "WebStudio",
            "location": "New York, USA",
            "remote": False,
            "description": "React specialist needed",
            "url": "https://example.com/job2",
            "skills": ["react", "javascript", "css"],
            "source_id": source_id
        },
        {
            "title": "Full Stack Engineer",
            "company": "StartupXYZ",
            "location": "Remote",
            "remote": True,
            "description": "Full stack position",
            "url": "https://example.com/job3",
            "skills": ["python", "react", "nodejs"],
            "source_id": source_id
        }
    ]
    
    created_jobs = []
    for i, job in enumerate(jobs, 1):
        try:
            response = requests.post(f"{API_BASE_URL}/api/jobs", json=job)
            print(f"\nJob {i}: {job['title']}")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 201:
                print("[PASS] Created successfully")
                created_jobs.append(response.json())
            elif response.status_code == 400:
                print("[WARN] Already exists (duplicate)")
            else:
                print(f"[FAIL] Error: {response.text}")
        except Exception as e:
            print(f"[FAIL] Error: {e}")
    
    return created_jobs


def test_deduplication(source_id: int):
    """Test 4: Test deduplication"""
    print_section("TEST 4: Deduplication Test")
    
    # Try to create a duplicate job
    duplicate_job = {
        "title": "Senior Python Developer",  # Same as first job
        "company": "TechCorp",  # Same as first job
        "location": "Different Location",
        "remote": True,
        "source_id": source_id
    }
    
    print("Attempting to create duplicate job...")
    print(f"Title: {duplicate_job['title']}")
    print(f"Company: {duplicate_job['company']}")
    
    try:
        response = requests.post(f"{API_BASE_URL}/api/jobs", json=duplicate_job)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 400:
            print("[PASS] PASS: Duplicate was correctly rejected!")
            print(f"Error message: {response.json().get('detail')}")
            return True
        else:
            print("[FAIL] FAIL: Duplicate was not detected!")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False


def test_query_parameters():
    """Test 5: Test query parameters"""
    print_section("TEST 5: Query Parameters Test")
    
    tests = [
        {
            "name": "All jobs (no filters)",
            "url": f"{API_BASE_URL}/api/jobs"
        },
        {
            "name": "Remote jobs only",
            "url": f"{API_BASE_URL}/api/jobs?remote=true"
        },
        {
            "name": "Search for 'Python'",
            "url": f"{API_BASE_URL}/api/jobs?search=python"
        },
        {
            "name": "Filter by skills (python)",
            "url": f"{API_BASE_URL}/api/jobs?skills=python"
        },
        {
            "name": "Filter by skills (react)",
            "url": f"{API_BASE_URL}/api/jobs?skills=react"
        },
        {
            "name": "Location filter (Remote)",
            "url": f"{API_BASE_URL}/api/jobs?location=remote"
        },
        {
            "name": "Pagination (page 1, size 2)",
            "url": f"{API_BASE_URL}/api/jobs?page=1&page_size=2"
        },
        {
            "name": "Combined filters (remote + python)",
            "url": f"{API_BASE_URL}/api/jobs?remote=true&skills=python"
        }
    ]
    
    results = []
    for test in tests:
        print(f"\n[INFO] {test['name']}")
        print(f"URL: {test['url']}")
        
        try:
            response = requests.get(test['url'])
            if response.status_code == 200:
                data = response.json()
                print(f"[PASS] Status: {response.status_code}")
                print(f"   Total jobs: {data.get('total', 'N/A')}")
                print(f"   Jobs returned: {len(data.get('jobs', []))}")
                
                # Show job titles
                for job in data.get('jobs', [])[:3]:  # Show first 3
                    print(f"   - {job['title']} at {job['company']}")
                
                results.append({"test": test['name'], "passed": True, "count": len(data.get('jobs', []))})
            else:
                print(f"[FAIL] Status: {response.status_code}")
                print(f"   Error: {response.text}")
                results.append({"test": test['name'], "passed": False})
        except Exception as e:
            print(f"[FAIL] Error: {e}")
            results.append({"test": test['name'], "passed": False})
    
    return results


def test_source_crud():
    """Test 6: Source CRUD operations"""
    print_section("TEST 6: Source CRUD Operations")
    
    # List sources
    print("\n1. List all sources:")
    response = requests.get(f"{API_BASE_URL}/api/sources")
    if response.status_code == 200:
        sources = response.json()
        print(f"[PASS] Found {len(sources)} sources")
        for source in sources[:3]:
            print(f"   - {source['name']} ({source['source_type']})")
    
    # Get specific source
    print("\n2. Get source by ID:")
    response = requests.get(f"{API_BASE_URL}/api/sources/1")
    if response.status_code == 200:
        source = response.json()
        print(f"[PASS] Source: {source['name']}")
        print(f"   Type: {source['source_type']}")
        print(f"   Status: {'Active' if source['status'] else 'Inactive'}")
    
    # Update source status
    print("\n3. Toggle source status:")
    response = requests.patch(
        f"{API_BASE_URL}/api/sources/1/status",
        json={"status": False}
    )
    if response.status_code == 200:
        print("[PASS] Status updated to Inactive")
    
    # Toggle back
    response = requests.patch(
        f"{API_BASE_URL}/api/sources/1/status",
        json={"status": True}
    )
    if response.status_code == 200:
        print("[PASS] Status updated back to Active")


def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("  WorkFinder API Test Suite")
    print("=" * 70)
    
    # Test 1: Health check
    if not test_health():
        print("\n[FAIL] API is not running. Please start it first:")
        print("   cd backend; uvicorn app.main:app --reload")
        return
    
    # Test 2: Create test source
    source_id = test_create_source()
    if not source_id:
        print("\n[FAIL] Could not create test source. Using source_id=1")
        source_id = 1
    
    # Test 3: Create test jobs
    test_create_jobs(source_id)
    
    # Test 4: Deduplication
    dedup_passed = test_deduplication(source_id)
    
    # Test 5: Query parameters
    query_results = test_query_parameters()
    
    # Test 6: Source CRUD
    test_source_crud()
    
    # Summary
    print_section("TEST SUMMARY")
    print(f"\n[PASS] Deduplication: {'PASSED' if dedup_passed else 'FAILED'}")
    print(f"\n[INFO] Query Parameter Tests:")
    for result in query_results:
        status = "[PASS] PASS" if result['passed'] else "[FAIL] FAIL"
        count = f"({result.get('count', 0)} jobs)" if result['passed'] else ""
        print(f"   {status} - {result['test']} {count}")
    
    print("\n" + "=" * 70)
    print("  Testing Complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()

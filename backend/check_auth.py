"""
Authentication Flow Verification Script

This script tests the complete authentication flow of the WorkFinder API
using FastAPI's TestClient for integration testing.

Test Flow:
    1. Register a new user with unique email
    2. Login with credentials to receive JWT token
    3. Access protected /api/auth/me endpoint with token
    4. Verify user data is returned correctly

Features:
    - Uses TestClient (no need for running server)
    - Generates unique test emails using timestamps
    - Tests all auth endpoints in sequence
    - Provides clear success/failure messages

Usage:
    python check_auth.py

Expected Output:
    1. Registration Success!
    2. Login Success! Token: eyJhbGciOiJIUzI1NiIs...
    3. Access Success! User: test_1234567890@example.com, Role: user

Note:
    - Creates real database entries (test users)
    - Safe to run multiple times (unique emails)
    - Does not clean up test users (manual cleanup if needed)
"""
import sys
import os
import requests
import time

# Ensure we are calling the running server or mocking it?
# Since we might not have the server running in background yet, 
# I will start the server using uvicorn in background via run_command first?
# Or I can use run_scraper approach (direct python calls).
# Direct calls are better for unit testing, but for Auth Flow integration, standard HTTP is better.
# However, for simplicity without managing background processes, I will use TestClient from FastAPI.

from fastapi.testclient import TestClient
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.main import app

client = TestClient(app)

def test_auth_flow():
    """
    Test the complete authentication flow.
    
    Steps:
        1. Register new user with unique email
        2. Login to receive JWT access token
        3. Access protected endpoint with token
    
    Prints:
        Success/failure messages for each step
    """
    email = f"test_{int(time.time())}@example.com"
    password = "securepassword123"

    print(f"1. Registering user: {email}")
    response = client.post("/api/auth/register", json={"email": email, "password": password})
    if response.status_code != 200:
        print(f"Registration Failed: {response.text}")
        return
    print("Registration Success!")

    print("2. Logging in")
    response = client.post("/api/auth/login", data={"username": email, "password": password})
    if response.status_code != 200:
        print(f"Login Failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    print(f"Login Success! Token: {token[:20]}...")

    print("3. Accessing Protected Route /me")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/auth/me", headers=headers)
    if response.status_code != 200:
        print(f"Access Failed: {response.text}")
        return
    
    user_data = response.json()
    print(f"Access Success! User: {user_data['email']}, Role: {user_data['role']}")

if __name__ == "__main__":
    test_auth_flow()

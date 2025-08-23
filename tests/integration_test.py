import pytest
import requests

BASE_URL = "http://localhost:8000/api"

@pytest.fixture
def user_credentials():
    return {"username": "testuser", "password": "testpass"}

@pytest.fixture
def register_user(user_credentials):
    response = requests.post(f"{BASE_URL}/auth/register", json=user_credentials)
    return response.json()

def test_user_registration(register_user):
    assert "message" in register_user
    assert register_user["message"] == "User registered successfully"

def test_user_login(user_credentials):
    response = requests.post(f"{BASE_URL}/auth/login", json=user_credentials)
    assert response.status_code == 200
    assert "token" in response.json()

def test_fetch_growth_paths():
    response = requests.get(f"{BASE_URL}/growth/path", params={"userId": "1"})
    assert response.status_code == 200
    assert "paths" in response.json()

def test_update_growth_progress():
    payload = {"pathId": "1", "progress": 50}
    response = requests.post(f"{BASE_URL}/growth/progress", json=payload)
    assert response.status_code == 200
    assert response.json()["message"] == "Progress updated successfully"
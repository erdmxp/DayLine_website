import os

import pytest
import requests


BASE_URL = os.getenv("DAYLINE_BASE_URL", "http://localhost:10000").rstrip("/")


@pytest.mark.load
def test_health_multiple_requests():
    for _ in range(20):
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        assert response.status_code == 200

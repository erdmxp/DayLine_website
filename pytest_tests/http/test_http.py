import os

import pytest
import requests


BASE_URL = os.getenv("DAYLINE_BASE_URL", "http://localhost:10000").rstrip("/")


@pytest.mark.parametrize(
    "path",
    [
        "/",
        "/autorisation.html",
        "/registration.html",
    ],
)
def test_public_pages(path):
    response = requests.get(f"{BASE_URL}{path}", timeout=10)
    assert response.status_code == 200


def test_main_redirects_to_login():
    response = requests.get(
        f"{BASE_URL}/main",
        timeout=10,
        allow_redirects=False,
    )
    assert response.status_code == 302
    assert response.headers["Location"] == "/autorisation.html"


def test_tasks_api_requires_login():
    response = requests.get(f"{BASE_URL}/api/tasks", timeout=10)
    assert response.status_code == 401


def test_health():
    response = requests.get(f"{BASE_URL}/health", timeout=10)
    assert response.status_code == 200

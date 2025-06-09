"""
Example test to verify FastAPI is up and running.
"""

def test_root(client):
    response = client.get("/")
    assert response.status_code == 200

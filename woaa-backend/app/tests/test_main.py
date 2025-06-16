def test_health_check(client):
    """
    Basic test to check if FastAPI app is running.
    """
    res = client.get("/")
    assert res.status_code in (200, 404)  # adjust based on your root route

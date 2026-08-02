def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@sentinel.ai", "password": "admin"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_fail(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@sentinel.ai", "password": "wrongpassword"}
    )
    assert response.status_code == 400

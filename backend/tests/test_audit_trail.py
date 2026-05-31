from types import SimpleNamespace

import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend directory is on sys.path so we can import main
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from main import app
from app.core.dependencies import require_superadmin, get_db


class QueryStub:
    def __init__(self):
        self._items = []

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def offset(self, n):
        return self

    def limit(self, n):
        return self

    def count(self):
        return 0

    def all(self):
        return []


def fake_get_db():
    # yield an object with a query method
    class DB:
        def query(self, model):
            return QueryStub()

    yield DB()


def fake_require_superadmin():
    return SimpleNamespace(id="test-user", is_superadmin=True)


def test_audit_trail_list_stubbed():
    app.dependency_overrides[get_db] = fake_get_db
    app.dependency_overrides[require_superadmin] = fake_require_superadmin

    client = TestClient(app)
    resp = client.get("/api/v1/audit-trail")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data and "items" in data
    assert data["total"] == 0
    assert data["items"] == []

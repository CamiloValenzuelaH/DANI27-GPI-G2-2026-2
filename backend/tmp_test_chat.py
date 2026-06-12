import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fastapi.testclient import TestClient
from app.db.database import SessionLocal
from app.core.security import create_access_token, hash_password
from app.core.config import settings
from app.models.plan import Plan
from app.models.organization import Organization
from app.models.user import User
import redis

from main import app

client = TestClient(app)

db = SessionLocal()
try:
    plan = db.query(Plan).filter(Plan.slug == 'test-plan').first()
    if not plan:
        plan = Plan(name='Test Plan', slug='test-plan', has_ai_features=True)
        db.add(plan)
        db.commit()
        db.refresh(plan)

    org = db.query(Organization).filter(Organization.slug == 'test-org').first()
    if not org:
        org = Organization(name='Test Org', slug='test-org', plan_id=plan.id)
        db.add(org)
        db.commit()
        db.refresh(org)

    user = db.query(User).filter(User.email == 'test.chat@example.com').first()
    if not user:
        user = User(
            organization_id=org.id,
            email='test.chat@example.com',
            full_name='Test Chat User',
            hashed_password=hash_password('password123'),
            is_active=True,
            is_superadmin=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(str(user.id))
    print('token', token[:40] + '...')

    r = redis.from_url(settings.redis_url, decode_responses=True)
    doc_key = f"document_job:test-doc"
    r.hset(doc_key, mapping={
        'organization_id': str(org.id),
        'document_text': 'Este es un documento de prueba para verificar la ruta de chat de documentos.'
    })
    r.expire(doc_key, 3600)

    response = client.post(
        '/api/v1/documents/test-doc/chat',
        json={
            'message': '¿Qué controles ISO debería aplicar a este documento?',
            'conversationId': 'chat-test-1',
            'mode': 'both'
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    print('POST status', response.status_code)
    print('POST headers', response.headers.get('content-type'))
    print('POST text start', response.text[:200])

    history = client.get(
        '/api/v1/chat/history',
        params={'conversationId': 'chat-test-1'},
        headers={'Authorization': f'Bearer {token}'}
    )
    print('HISTORY status', history.status_code)
    print('HISTORY body', history.json())
finally:
    db.close()

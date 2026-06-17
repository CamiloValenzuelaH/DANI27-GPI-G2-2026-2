<<<<<<< HEAD
from app.db.database import SessionLocal
from app.models.plan import Plan


def seed_plans():
    db = SessionLocal()
    try:
        if db.query(Plan).first():
            print("Planes ya existen, saltando seeder.")
            return

        plans = [
            Plan(name="Starter", slug="starter", max_users=5, max_documents=20,
                 has_ai_features=False, has_audit_room=False,
                 has_integrations=False, has_capa_tracker=False),
            Plan(name="Professional", slug="professional", max_users=20, max_documents=200,
                 has_ai_features=True, has_audit_room=True,
                 has_integrations=False, has_capa_tracker=True),
            Plan(name="Enterprise", slug="enterprise", max_users=999, max_documents=9999,
                 has_ai_features=True, has_audit_room=True,
                 has_integrations=True, has_capa_tracker=True),
        ]

        db.add_all(plans)
        db.commit()
        print("Planes sembrados correctamente.")
    finally:
        db.close()


if __name__ == "__main__":
=======
from app.db.database import SessionLocal
from app.models.plan import Plan


def seed_plans():
    db = SessionLocal()
    try:
        if db.query(Plan).first():
            print("Planes ya existen, saltando seeder.")
            return

        plans = [
            Plan(name="Starter", slug="starter", max_users=5, max_documents=20,
                 has_ai_features=False, has_audit_room=False,
                 has_integrations=False, has_capa_tracker=False),
            Plan(name="Professional", slug="professional", max_users=20, max_documents=200,
                 has_ai_features=True, has_audit_room=True,
                 has_integrations=False, has_capa_tracker=True),
            Plan(name="Enterprise", slug="enterprise", max_users=999, max_documents=9999,
                 has_ai_features=True, has_audit_room=True,
                 has_integrations=True, has_capa_tracker=True),
        ]

        db.add_all(plans)
        db.commit()
        print("Planes sembrados correctamente.")
    finally:
        db.close()


if __name__ == "__main__":
>>>>>>> Chat-bot
    seed_plans()
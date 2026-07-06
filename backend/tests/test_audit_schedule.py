import sys
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.api.v1.audit_schedule import _compute_next_date


def test_compute_next_date_with_last_and_audit_day_in_future():
    last = datetime(2026, 6, 15, 0, 0, tzinfo=timezone.utc)
    today = datetime(2026, 7, 2, 0, 0, tzinfo=timezone.utc)
    result = _compute_next_date(last, "monthly", 10, today=today)
    assert result == datetime(2026, 7, 10, 0, 0, tzinfo=timezone.utc)


def test_compute_next_date_with_last_and_audit_day_in_past():
    last = datetime(2026, 6, 15, 0, 0, tzinfo=timezone.utc)
    today = datetime(2026, 7, 2, 0, 0, tzinfo=timezone.utc)
    result = _compute_next_date(last, "monthly", 1, today=today)
    assert result == datetime(2026, 8, 1, 0, 0, tzinfo=timezone.utc)


def test_compute_next_date_without_last_and_audit_day():
    today = datetime(2026, 7, 2, 0, 0, tzinfo=timezone.utc)
    result = _compute_next_date(None, "annual", 10, today=today)
    assert result == datetime(2026, 7, 10, 0, 0, tzinfo=timezone.utc)


def test_compute_next_date_without_last_and_no_audit_day():
    today = datetime(2026, 7, 2, 0, 0, tzinfo=timezone.utc)
    result = _compute_next_date(None, "annual", None, today=today)
    assert result == datetime(2027, 7, 2, 0, 0, tzinfo=timezone.utc)

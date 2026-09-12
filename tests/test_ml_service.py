"""
Unit tests for DriftWatch Python ML Service.
Run with: pytest tests/test_ml_service.py -v
"""

import os
import pytest
import pandas as pd
from httpx import AsyncClient, ASGITransport
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "python-ml")))
from app.main import app
from app.services.drift_engine import compute_psi, compute_ks, compute_js_divergence, classify_severity


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


def test_psi_identical():
    data = [1.0, 2.0, 3.0, 4.0, 5.0] * 20
    psi = compute_psi(data, data)
    assert psi == 0.0


def test_psi_drifted():
    base = [1.0, 2.0, 3.0, 4.0, 5.0] * 20
    curr = [10.0, 20.0, 30.0, 40.0, 50.0] * 20
    psi = compute_psi(base, curr)
    assert psi > 0.25
    assert classify_severity(psi) == "severe"


def test_ks_statistic():
    base = [1.0, 2.0, 3.0, 4.0, 5.0] * 20
    curr = [1.0, 2.0, 3.0, 4.0, 5.0] * 20
    ks = compute_ks(base, curr)
    assert ks["ks_statistic"] == 0.0
    assert ks["ks_p_value"] == 1.0


def test_js_divergence():
    base = [1.0, 2.0, 3.0, 4.0, 5.0] * 20
    curr = [1.0, 2.0, 3.0, 4.0, 5.0] * 20
    js = compute_js_divergence(base, curr)
    assert js < 0.01


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

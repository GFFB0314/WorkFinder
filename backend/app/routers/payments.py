"""
WorkFinder Payments Router — PayDunya Mobile Money Integration

Handles payment initiation (MTN MoMo / Orange Money via PayDunya gateway)
and the signed webhook callback that confirms a transaction.

PayDunya docs: https://paydunya.com/developers
"""

import hashlib
import hmac
import json
import os
import uuid

import requests
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.utils import security

router = APIRouter(
    prefix="/api/payments",
    tags=["payments"],
)

# ─── PayDunya credentials (set via environment variables) ────────────────────
PAYDUNYA_MASTER_KEY = os.getenv("PAYDUNYA_MASTER_KEY", "")
PAYDUNYA_PRIVATE_KEY = os.getenv("PAYDUNYA_PRIVATE_KEY", "")
PAYDUNYA_TOKEN = os.getenv("PAYDUNYA_TOKEN", "")
# 'test' or 'live'
PAYDUNYA_MODE = os.getenv("PAYDUNYA_MODE", "test")

_BASE_URL = (
    "https://app.paydunya.com/sandbox-api/v1"
    if PAYDUNYA_MODE == "test"
    else "https://app.paydunya.com/api/v1"
)

# Price per month for university subscription (XAF)
UNIVERSITY_SUBSCRIPTION_PRICE_XAF = 15_000


def _paydunya_headers() -> dict:
    """Build the required PayDunya authentication headers."""
    return {
        "Content-Type": "application/json",
        "PAYDUNYA-MASTER-KEY": PAYDUNYA_MASTER_KEY,
        "PAYDUNYA-PRIVATE-KEY": PAYDUNYA_PRIVATE_KEY,
        "PAYDUNYA-TOKEN": PAYDUNYA_TOKEN,
    }


# ─── Initiate Payment ─────────────────────────────────────────────────────────

class PaymentInitRequest(schemas.BaseModel if False else object):
    """Pydantic-free helper; using a proper Pydantic class below."""
    pass


from pydantic import BaseModel


class PaymentInitRequest(BaseModel):
    """Request body to initiate a university subscription payment."""
    phone_number: str
    operator: str  # 'mtn' | 'orange'
    months: int = 1


@router.post("/initiate")
def initiate_payment(
    payload: PaymentInitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    """
    Initiate a Mobile Money payment for a university subscription via PayDunya.
    Only university_admin users may call this endpoint.
    Returns the PayDunya checkout token and redirect URL.
    """
    if current_user.role != "university_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs d'universités peuvent effectuer un paiement.",
        )

    uni = current_user.university_profile
    if not uni:
        raise HTTPException(status_code=404, detail="Profil d'université introuvable.")

    amount = UNIVERSITY_SUBSCRIPTION_PRICE_XAF * max(1, payload.months)
    transaction_ref = f"WF-UNI-{uni.id}-{uuid.uuid4().hex[:8].upper()}"

    # Build PayDunya invoice payload
    paydunya_payload = {
        "invoice": {
            "total_amount": amount,
            "description": f"WorkFinder Campus — Abonnement {payload.months} mois ({uni.acronym})",
            "return_url": os.getenv("FRONTEND_URL", "http://localhost:5173") + "/dashboard?payment=success",
            "cancel_url": os.getenv("FRONTEND_URL", "http://localhost:5173") + "/dashboard?payment=cancelled",
            "callback_url": os.getenv("BACKEND_URL", "http://localhost:8000") + "/api/payments/webhook",
        },
        "store": {
            "name": "WorkFinder",
            "tagline": "La plateforme emploi tech du Cameroun",
            "phone": "+237600000000",
            "postal_address": "Douala, Cameroun",
            "website_url": "https://workfinder.cm",
            "logo_url": "",
        },
        "custom_data": {
            "university_id": uni.id,
            "user_id": current_user.id,
            "months": payload.months,
            "transaction_ref": transaction_ref,
        },
    }

    # If PayDunya credentials are configured, hit the real API
    if PAYDUNYA_MASTER_KEY and PAYDUNYA_PRIVATE_KEY and PAYDUNYA_TOKEN:
        try:
            resp = requests.post(
                f"{_BASE_URL}/checkout-invoice/create",
                headers=_paydunya_headers(),
                json=paydunya_payload,
                timeout=15,
            )
            resp_data = resp.json()

            if resp_data.get("response_code") != "00":
                raise HTTPException(
                    status_code=502,
                    detail=f"PayDunya error: {resp_data.get('response_text', 'Unknown error')}",
                )

            # Persist the pending transaction
            db_transaction = models.Transaction(
                university_id=uni.id,
                transaction_ref=transaction_ref,
                amount=amount,
                status="pending",
            )
            db.add(db_transaction)
            db.commit()

            return {
                "status": "pending",
                "transaction_ref": transaction_ref,
                "checkout_url": resp_data.get("response_text"),
                "token": resp_data.get("token"),
                "amount": amount,
            }

        except requests.RequestException as exc:
            raise HTTPException(status_code=502, detail=f"Erreur réseau PayDunya: {exc}")

    # ── Simulation mode (no credentials configured) ───────────────────────────
    # Record transaction as if PayDunya confirmed it (for demo / defence).
    db_transaction = models.Transaction(
        university_id=uni.id,
        transaction_ref=transaction_ref,
        amount=amount,
        status="success",  # Auto-confirmed for demo
    )
    db.add(db_transaction)

    # Activate university subscription immediately
    from datetime import datetime, timedelta
    expires = datetime.utcnow() + timedelta(days=30 * payload.months)
    uni.subscription_status = "active"
    uni.subscription_expires_at = expires
    db.commit()

    return {
        "status": "success",
        "message": f"[Mode simulation] Abonnement activé pour {uni.acronym} jusqu'au {expires.strftime('%d/%m/%Y')}.",
        "transaction_ref": transaction_ref,
        "amount": amount,
        "expires_at": expires.isoformat(),
    }


# ─── PayDunya Webhook ─────────────────────────────────────────────────────────

@router.post("/webhook")
async def paydunya_webhook(request: Request, db: Session = Depends(get_db)):
    """
    PayDunya signed webhook callback.
    Verifies HMAC-SHA256 signature then marks a transaction as successful
    and activates the corresponding university subscription.
    """
    raw_body = await request.body()
    signature = request.headers.get("X-PAYDUNYA-SIGNATURE", "")

    # Verify HMAC-SHA256 signature using the Master Key as the secret
    expected_sig = hmac.new(
        PAYDUNYA_MASTER_KEY.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if PAYDUNYA_MASTER_KEY and not hmac.compare_digest(expected_sig, signature):
        raise HTTPException(status_code=400, detail="Signature de webhook invalide.")

    try:
        data = json.loads(raw_body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Payload JSON invalide.")

    # PayDunya wraps custom data inside 'custom_data'
    custom_data = data.get("custom_data", {})
    transaction_ref = custom_data.get("transaction_ref")
    university_id = custom_data.get("university_id")
    months = int(custom_data.get("months", 1))
    payment_status = data.get("status", "")

    if not transaction_ref or not university_id:
        raise HTTPException(status_code=400, detail="Données de transaction manquantes.")

    db_transaction = db.query(models.Transaction).filter(
        models.Transaction.transaction_ref == transaction_ref
    ).first()

    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction introuvable.")

    if payment_status == "completed":
        db_transaction.status = "success"

        # Activate university subscription
        uni = db.query(models.University).filter(
            models.University.id == university_id
        ).first()
        if uni:
            from datetime import datetime, timedelta
            expires = datetime.utcnow() + timedelta(days=30 * months)
            uni.subscription_status = "active"
            uni.subscription_expires_at = expires

        db.commit()
        return {"status": "ok", "message": "Paiement confirmé et abonnement activé."}
    else:
        db_transaction.status = "failed"
        db.commit()
        return {"status": "ok", "message": f"Transaction marquée comme: {payment_status}."}

import logging
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request

from app.auth.supabase_jwt import CurrentUser, get_current_user
from app.schemas.payments import (
    CreateKhqrRequest,
    CreateKhqrResponse,
    CreatePaywayRequest,
    CreatePaywayResponse,
    KhqrStatusResponse,
    PaymentHistory,
    PaymentRecord,
    PaySavedCardRequest,
    PaySavedCardResponse,
    PaywayStatusResponse,
    RecordPaymentRequest,
)
from app.config import settings
from app.services.cards import card_by_id
from app.services.fulfilment import grants_for_sku
from app.services.khqr import (
    KhqrCheckUnavailable,
    KhqrNotConfigured,
    KhqrQuotaExhausted,
    check_khqr_payment,
    create_khqr_payment,
)
from app.services.payments import (
    create_khqr_intent,
    create_payway_intent,
    fulfil_khqr_payment,
    list_payments,
    read_khqr_payment,
    read_payway_payment,
    record_payment,
)
from app.services.payway import (
    PaywayNotConfigured,
    PaywayUnavailable,
    build_card_checkout,
    check_transaction,
    ctid_for_user,
    new_tran_id,
    pay_with_token,
    purchase_url,
)
from app.services.pricing import CURRENCY, UnknownSku, price_cents_for_sku

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["payments"])


@router.get("/payments", response_model=PaymentHistory)
def read_payments(user: CurrentUser = Depends(get_current_user)) -> PaymentHistory:
    return PaymentHistory(payments=list_payments(user.id))


@router.post("/payments/record", response_model=PaymentRecord)
def create_payment_record(
    body: RecordPaymentRequest,
    user: CurrentUser = Depends(get_current_user),
) -> PaymentRecord:
    try:
        return record_payment(user.id, body)
    except UnknownSku as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/payments/khqr/create", response_model=CreateKhqrResponse)
def create_khqr(
    body: CreateKhqrRequest,
    user: CurrentUser = Depends(get_current_user),
) -> CreateKhqrResponse:
    try:
        amount_cents = price_cents_for_sku(body.pack_id)
    except UnknownSku as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        qr_string, md5 = create_khqr_payment(
            amount=amount_cents / 100,
            currency=CURRENCY,
            bill_number=body.pack_id,
        )
    except KhqrQuotaExhausted as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except KhqrNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        logger.error("Bakong rejected the QR details: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Bakong rejected the QR details: {exc}",
        ) from exc

    try:
        create_khqr_intent(
            user_id=user.id,
            sku=body.pack_id,
            pack_name=body.pack_name,
            amount_cents=amount_cents,
            currency=CURRENCY,
            md5=md5,
        )
    except HTTPException as exc:
        logger.error("Could not record KHQR intent %s: %s", md5, exc.detail)
        raise HTTPException(
            status_code=503,
            detail="Could not start this checkout. Please try again shortly.",
        ) from exc

    return CreateKhqrResponse(
        qr_string=qr_string,
        md5=md5,
        amount_cents=amount_cents,
        currency=CURRENCY,
    )


@router.get("/payments/khqr/status/{md5}", response_model=KhqrStatusResponse)
def get_khqr_status(
    md5: str,
    start_time: float | None = None,
    user: CurrentUser = Depends(get_current_user),
) -> KhqrStatusResponse:
    try:
        paid, next_delay = check_khqr_payment(md5, start_time)
    except KhqrNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except KhqrQuotaExhausted as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except KhqrCheckUnavailable as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return KhqrStatusResponse(
        status="paid" if paid else "pending",
        next_delay_seconds=next_delay,
        fulfilled=_fulfil_confirmed_payment(user.id, md5) if paid else False,
    )


def _fulfil_confirmed_payment(user_id: str, md5: str) -> bool:
    """Grant this checkout. True only once the entitlements are in the database."""
    try:
        payment = read_khqr_payment(user_id, md5)
    except HTTPException as exc:
        logger.warning("Could not read KHQR payment %s: %s", md5, exc.detail)
        return False

    if not payment.known:
        logger.error(
            "Paid KHQR %s has no checkout row for user %s - cannot fulfil it",
            md5,
            user_id,
        )
        return False
    if payment.fulfilled:
        return True

    sku = payment.sku or ""
    try:
        spec = grants_for_sku(sku)
    except UnknownSku:
        logger.error("Paid KHQR checkout %s has ungrantable SKU %r", md5, sku)
        return False

    try:
        return fulfil_khqr_payment(user_id, md5, spec).fulfilled
    except HTTPException as exc:
        logger.error("Granting %r after KHQR %s failed: %s", sku, md5, exc.detail)
        return False


_TRAN_ID = re.compile(r"^[0-9]{1,20}$")


def _frontend_origin() -> str:
    return settings.frontend_origin.split(",")[0].strip().rstrip("/")


@router.post("/payments/payway/create", response_model=CreatePaywayResponse)
def create_payway(
    body: CreatePaywayRequest,
    user: CurrentUser = Depends(get_current_user),
) -> CreatePaywayResponse:
    try:
        amount_cents = price_cents_for_sku(body.pack_id)
    except UnknownSku as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    tran_id = new_tran_id()
    back_to = f"{_frontend_origin()}/billing/payment?payway={tran_id}"
    try:
        fields = build_card_checkout(
            tran_id=tran_id,
            amount_cents=amount_cents,
            currency=CURRENCY,
            item_name=body.pack_name or body.pack_id,
            email=user.email,
            continue_success_url=back_to,
            cancel_url=f"{back_to}&cancelled=1",
        )
    except PaywayNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    try:
        create_payway_intent(
            user_id=user.id,
            sku=body.pack_id,
            pack_name=body.pack_name,
            amount_cents=amount_cents,
            currency=CURRENCY,
            tran_id=tran_id,
        )
    except HTTPException as exc:
        logger.error("Could not record PayWay intent %s: %s", tran_id, exc.detail)
        raise HTTPException(
            status_code=503,
            detail="Could not start this checkout. Please try again shortly.",
        ) from exc

    return CreatePaywayResponse(tran_id=tran_id, action_url=purchase_url(), fields=fields)


@router.get("/payments/payway/status/{tran_id}", response_model=PaywayStatusResponse)
def get_payway_status(
    tran_id: str,
    user: CurrentUser = Depends(get_current_user),
) -> PaywayStatusResponse:
    if not _TRAN_ID.match(tran_id):
        raise HTTPException(status_code=400, detail="Invalid transaction id")
    try:
        return _settle_payway(tran_id, user.id)
    except PaywayNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PaywayUnavailable as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/payments/payway/callback")
async def payway_callback(request: Request) -> dict[str, bool]:
    """Untrusted hint to re-check; only Check Transaction can grant."""
    try:
        body = await request.json()
    except ValueError:
        body = {}
    tran_id = str(body.get("tran_id", "")) if isinstance(body, dict) else ""
    if not _TRAN_ID.match(tran_id):
        logger.warning("PayWay callback without a usable tran_id: %r", body)
        return {"ok": False}

    try:
        _settle_payway(tran_id, user_id=None)
    except (PaywayNotConfigured, PaywayUnavailable, HTTPException) as exc:
        logger.error("PayWay callback for %s could not settle: %s", tran_id, exc)
        return {"ok": False}
    return {"ok": True}


def _settle_payway(tran_id: str, user_id: str | None) -> PaywayStatusResponse:
    """Grant the checkout once PayWay says APPROVED."""
    payment = read_payway_payment(tran_id, user_id)
    if payment is None:
        raise HTTPException(status_code=404, detail="Unknown card checkout")
    if payment.fulfilled:
        return PaywayStatusResponse(status="paid", fulfilled=True)

    transaction = check_transaction(tran_id)
    if transaction.status == "pending":
        return PaywayStatusResponse(status="pending")
    if transaction.status == "declined":
        return PaywayStatusResponse(status="declined")
    if transaction.status != "approved":
        return PaywayStatusResponse(status="cancelled")

    if transaction.amount_cents != payment.amount_cents:
        logger.error(
            "PayWay %s approved %s cents but the checkout was priced at %s - not granting",
            tran_id,
            transaction.amount_cents,
            payment.amount_cents,
        )
        return PaywayStatusResponse(status="paid", fulfilled=False)

    try:
        spec = grants_for_sku(payment.sku)
    except UnknownSku:
        logger.error("Paid PayWay checkout %s has ungrantable SKU %r", tran_id, payment.sku)
        return PaywayStatusResponse(status="paid", fulfilled=False)

    try:
        fulfilled = fulfil_khqr_payment(payment.user_id, tran_id, spec).fulfilled
    except HTTPException as exc:
        logger.error("Granting %r after PayWay %s failed: %s", payment.sku, tran_id, exc.detail)
        fulfilled = False
    if fulfilled:
        logger.info("PayWay %s approved and granted %r", tran_id, payment.sku)
    return PaywayStatusResponse(status="paid", fulfilled=fulfilled)


@router.post("/payments/payway/pay-saved-card", response_model=PaySavedCardResponse)
def pay_with_saved_card(
    body: PaySavedCardRequest,
    user: CurrentUser = Depends(get_current_user),
) -> PaySavedCardResponse:
    try:
        amount_cents = price_cents_for_sku(body.pack_id)
    except UnknownSku as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    try:
        uuid.UUID(body.card_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid card id") from exc
    card = card_by_id(body.card_id, user.id)
    if card is None or not card.pwt:
        raise HTTPException(status_code=404, detail="Saved card not found")

    tran_id = new_tran_id()
    try:
        create_payway_intent(
            user_id=user.id,
            sku=body.pack_id,
            pack_name=body.pack_name,
            amount_cents=amount_cents,
            currency=CURRENCY,
            tran_id=tran_id,
        )
    except HTTPException as exc:
        logger.error("Could not record PayWay intent %s: %s", tran_id, exc.detail)
        raise HTTPException(
            status_code=503,
            detail="Could not start this checkout. Please try again shortly.",
        ) from exc

    try:
        accepted = pay_with_token(
            tran_id=tran_id,
            ctid=ctid_for_user(user.id),
            pwt=card.pwt,
            amount_cents=amount_cents,
            currency=CURRENCY,
            item_name=body.pack_name or body.pack_id,
            email=user.email,
        )
        if not accepted:
            return PaySavedCardResponse(tran_id=tran_id, status="declined")
        settled = _settle_payway(tran_id, user.id)
    except PaywayNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PaywayUnavailable as exc:
        # The charge may still land; the browser keeps checking.
        logger.warning("Saved-card payment %s not confirmed yet: %s", tran_id, exc)
        return PaySavedCardResponse(tran_id=tran_id, status="pending")
    return PaySavedCardResponse(
        tran_id=tran_id, status=settled.status, fulfilled=settled.fulfilled
    )

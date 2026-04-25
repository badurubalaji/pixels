"""Transactional email helper (PX-074).

Wraps Resend's REST API for the single use case we have today: sending an
email-change confirmation link to the new address + a notification to the
old address. When ``RESEND_API_KEY`` is empty (dev / test runs), every
``send_email`` call is logged + the in-memory ``OUTBOX`` list captures
the payload so tests can assert what would have been sent.

Why Resend (vs. SendGrid / SES / Postmark):
    - Single API key, REST POST endpoint — no webhook or domain dance for
      the "just send the link" use case we have.
    - Free tier is generous (3000/month) and simple to upgrade.
    - The architect agent's trade-off matrix flagged it as the lowest-friction
      option for our scale; standing autonomy rule lets Orion pick.

If the team later swaps to SendGrid / SES, the entire dependency surface
is this single ``send_email`` function — replace its body and nothing else
changes.
"""
from __future__ import annotations

import logging
from typing import Optional

import httpx

from app.auth import EMAIL_FROM_ADDRESS, RESEND_API_KEY

log = logging.getLogger(__name__)

#: Captured payloads when ``RESEND_API_KEY`` is empty. Tests assert against this.
OUTBOX: list[dict] = []


async def send_email(
    *,
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
) -> None:
    """Send a single transactional email.

    Args:
        to: Recipient's email address.
        subject: Subject line.
        html: HTML body (preferred by Resend).
        text: Optional plain-text fallback. Not strictly required by Resend
            but improves deliverability.

    Returns:
        ``None``. Failures are logged but never raised — the calling endpoint
        already returned 204 to the user; an email-send failure is
        surfaced only via logs / monitoring (mailer outage shouldn't break
        the user's request flow). For the email-change flow specifically,
        the user can re-request a new confirmation link if the email
        never arrives.
    """
    payload = {
        "from": EMAIL_FROM_ADDRESS,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if text:
        payload["text"] = text

    if not RESEND_API_KEY:
        # Dev / test mode — log + capture instead of hitting the network.
        OUTBOX.append(payload)
        log.info("[mailer] no RESEND_API_KEY; captured outbound to %s: %s", to, subject)
        return

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                "https://api.resend.com/emails",
                json=payload,
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            r.raise_for_status()
    except Exception as e:  # noqa: BLE001 — log everything, never raise
        log.exception("[mailer] resend send failed for %s: %s", to, e)


def render_email_change_confirm_html(
    *, name: str, new_email: str, confirm_url: str, ttl_hours: int
) -> str:
    """Plain HTML body for the new-address confirmation message (PX-074)."""
    safe_name = name or "there"
    return f"""\
<!doctype html>
<html><body style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #7c3aed;">Confirm your new email</h2>
  <p>Hi {safe_name},</p>
  <p>You asked to change your pixels account email to <strong>{new_email}</strong>.</p>
  <p>Click the button below within {ttl_hours} hour(s) to confirm:</p>
  <p style="text-align: center; margin: 32px 0;">
    <a href="{confirm_url}" style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Confirm new email</a>
  </p>
  <p style="color: #64748b; font-size: 0.9em;">If you didn't request this change, you can ignore this email — your current address stays active.</p>
</body></html>
"""


def render_email_change_notify_html(*, name: str, new_email: str) -> str:
    """Notification sent to the OLD email when a change is requested (PX-074)."""
    safe_name = name or "there"
    return f"""\
<!doctype html>
<html><body style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #7c3aed;">Email change requested</h2>
  <p>Hi {safe_name},</p>
  <p>Someone — we hope you — requested to change your pixels account email to <strong>{new_email}</strong>.</p>
  <p>If this wasn't you, sign in immediately and rotate your password. The change won't go into effect until the new address confirms it.</p>
  <p style="color: #64748b; font-size: 0.9em;">This is an automated security notice; you don't need to do anything if you initiated the change yourself.</p>
</body></html>
"""

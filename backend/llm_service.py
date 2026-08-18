"""LLM service for AI-drafted messages and rationales via Claude Sonnet 4.6."""
import json
import os
import asyncio
import logging
from typing import Optional

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

SYSTEM_MESSAGE = """You are the JobOS Revenue Recovery drafting agent for a fictional HVAC business demo.

Rules you must follow strictly:
1. You may classify, prioritize, draft, recommend, summarize, and explain.
2. You must NOT invent customer facts, prices, availability, promises, discounts, outcomes, or booking details that are not in the provided context.
3. Use only the fictional customer context supplied in the user message.
4. Never state that a message has been sent or an appointment has been booked.
5. Output valid JSON only, matching the requested schema exactly.
"""

DRAFT_SCHEMA_INSTRUCTIONS = """Return a strict JSON object with this shape and no extra keys:
{
  "serviceNeed": string,
  "urgency": "Low" | "Medium" | "High",
  "confidence": number (0-100 integer),
  "recommendedAction": string (one short sentence),
  "rationale": string (2 short sentences, no invented facts),
  "draftChannel": "SMS" | "Email" | "Phone",
  "draftSubject": string | null,
  "draftMessage": string (under 320 characters, warm, respectful, no invented times or prices unless provided),
  "approvalRequired": true,
  "sourceFactsUsed": string[]
}
No commentary. JSON only."""


async def generate_draft(opportunity: dict, customer: dict, timeout_seconds: int = 12) -> Optional[dict]:
    """Generate a fresh AI draft. Returns dict on success, None on any failure."""
    if not EMERGENT_LLM_KEY:
        return None

    context = {
        "customer": {
            "name": customer.get("name"),
            "preferred_channel": customer.get("preferred_channel"),
            "lifetime_value": customer.get("lifetime_value"),
            "last_service_date": customer.get("last_service_date"),
            "tags": customer.get("tags"),
            "notes": customer.get("notes"),
        },
        "opportunity": {
            "type": opportunity.get("type"),
            "service_need": opportunity.get("service_need"),
            "expected_value": opportunity.get("expected_value"),
            "urgency": opportunity.get("urgency"),
            "age_minutes": opportunity.get("age_minutes"),
            "source_facts": opportunity.get("source_facts_used"),
        },
        "business": {
            "name": "Northstar Heating & Air",
            "location": "Newark, New Jersey",
        },
    }

    prompt = (
        "Draft an approval-controlled response for this fictional demo opportunity.\n\n"
        f"Context (JSON):\n{json.dumps(context, indent=2)}\n\n"
        f"{DRAFT_SCHEMA_INSTRUCTIONS}"
    )

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"draft-{opportunity.get('id', 'unknown')}",
            system_message=SYSTEM_MESSAGE,
        ).with_model("anthropic", "claude-sonnet-4-6")

        response = await asyncio.wait_for(
            chat.send_message(UserMessage(text=prompt)),
            timeout=timeout_seconds,
        )
        text = response.strip() if isinstance(response, str) else str(response).strip()

        # Strip potential markdown code fences
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0]
            if text.startswith("json"):
                text = text[4:].lstrip()

        data = json.loads(text)

        # Basic validation
        required = ["serviceNeed", "urgency", "confidence", "recommendedAction",
                    "rationale", "draftChannel", "draftMessage", "sourceFactsUsed"]
        for key in required:
            if key not in data:
                logger.warning("LLM draft missing key: %s", key)
                return None
        if data["urgency"] not in ("Low", "Medium", "High"):
            return None
        if data["draftChannel"] not in ("SMS", "Email", "Phone"):
            return None
        if not isinstance(data["draftMessage"], str) or len(data["draftMessage"]) < 10:
            return None
        return data
    except asyncio.TimeoutError:
        logger.warning("LLM draft timeout")
        return None
    except json.JSONDecodeError as e:
        logger.warning("LLM draft JSON decode error: %s", e)
        return None
    except Exception as e:  # noqa: BLE001
        logger.warning("LLM draft failed: %s", e)
        return None

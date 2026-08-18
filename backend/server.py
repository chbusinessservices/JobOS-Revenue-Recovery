"""JobOS Revenue Recovery — demo backend."""
from fastapi import FastAPI, APIRouter, HTTPException, Body
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import copy
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

from seed_data import build_seed_state
from llm_service import generate_draft


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="JobOS Revenue Recovery")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ------------------------ Helpers ------------------------
SESSIONS = "sessions"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


async def get_session(session_id: str) -> dict:
    doc = await db[SESSIONS].find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return doc


async def save_session(session_id: str, state: dict) -> None:
    await db[SESSIONS].update_one(
        {"session_id": session_id},
        {"$set": {"session_id": session_id, "state": state, "updated_at": now_iso()}},
        upsert=True,
    )


def compute_dashboard(state: dict) -> dict:
    biz = state["business"]
    opps = state["opportunities"]
    customers = {c["id"]: c for c in state["customers"]}
    needs_approval = [
        {**o, "customer": customers.get(o["customer_id"], {})}
        for o in opps if o["status"] in ("Needs Approval", "Approval Required", "Draft Ready", "Follow-up Due")
    ]
    return {
        "business": biz,
        "kpis": {
            "revenue_at_risk": biz["estimated_recoverable_revenue"],
            "revenue_at_risk_label": "Estimated pipeline",
            "recovered_revenue": biz["recorded_recovered_revenue"],
            "recovered_revenue_label": "Demo scenario",
            "appointments_booked": biz["appointments_booked_this_month"],
            "follow_ups_due": biz["follow_ups_due_today"],
            "response_10min": biz["response_within_10_min"],
            "baseline_10min": biz["baseline_response_within_10_min"],
            "time_saved_hours": biz["modeled_admin_time_saved"],
            "time_saved_label": "Modeled",
        },
        "needs_approval": needs_approval[:6],
        "workflow_health": state["workflows"],
        "agent_feed": state["agent_feed"][:8],
        "trend": state["trend"],
    }


def compute_impact(state: dict) -> dict:
    opps = state["opportunities"]
    biz = state["business"]
    booked = [o for o in opps if o["status"] == "Appointment Booked"]
    recovered_from_flow = sum(o["expected_value"] for o in booked)
    return {
        "estimated": {
            "revenue_pipeline": biz["estimated_recoverable_revenue"],
            "leads_responded": 46,
            "follow_ups_completed": 38,
        },
        "modeled": {
            "hours_saved": biz["modeled_admin_time_saved"],
            "reactivations": 9,
        },
        "recorded": {
            "recovered_revenue": biz["recorded_recovered_revenue"] + recovered_from_flow,
            "appointments_booked": biz["appointments_booked_this_month"] + len(booked),
        },
        "methodology": (
            "Estimated pipeline value is modeled from active opportunities. "
            "Recorded recovered revenue requires an opportunity with a recorded booked or completed outcome. "
            "Modeled time saved is based on configured manual task-time assumptions."
        ),
    }


def append_audit(state: dict, opportunity_id: Optional[str], customer_id: Optional[str], event: str, actor: str, detail: str):
    entry = {
        "id": f"audit-{uuid.uuid4().hex[:10]}",
        "opportunity_id": opportunity_id,
        "customer_id": customer_id,
        "event": event,
        "actor": actor,
        "detail": detail,
        "timestamp": now_iso(),
    }
    state["audit"].insert(0, entry)
    return entry


def find_opp(state: dict, opp_id: str) -> dict:
    for o in state["opportunities"]:
        if o["id"] == opp_id:
            return o
    raise HTTPException(status_code=404, detail="Opportunity not found")


def find_customer(state: dict, customer_id: str) -> dict:
    for c in state["customers"]:
        if c["id"] == customer_id:
            return c
    raise HTTPException(status_code=404, detail="Customer not found")


# ------------------------ Session Endpoints ------------------------
@api_router.post("/demo/session")
async def create_session():
    session_id = f"sess-{uuid.uuid4().hex[:12]}"
    state = build_seed_state()
    await save_session(session_id, state)
    return {"session_id": session_id, "created_at": now_iso()}


@api_router.post("/demo/session/{session_id}/reset")
async def reset_session(session_id: str):
    state = build_seed_state()
    await save_session(session_id, state)
    return {"session_id": session_id, "reset_at": now_iso(), "ok": True}


@api_router.get("/demo/session/{session_id}")
async def session_info(session_id: str):
    doc = await db[SESSIONS].find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        # Auto-create if missing
        state = build_seed_state()
        await save_session(session_id, state)
        return {"session_id": session_id, "auto_created": True}
    return {"session_id": session_id, "updated_at": doc.get("updated_at")}


# ------------------------ Dashboard ------------------------
@api_router.get("/demo/{session_id}/dashboard")
async def dashboard(session_id: str):
    session = await get_session(session_id)
    return compute_dashboard(session["state"])


# ------------------------ Opportunities ------------------------
@api_router.get("/demo/{session_id}/opportunities")
async def list_opportunities(session_id: str, category: Optional[str] = None, q: Optional[str] = None, sort: str = "urgency"):
    session = await get_session(session_id)
    state = session["state"]
    customers = {c["id"]: c for c in state["customers"]}
    opps = state["opportunities"]
    if category and category != "all":
        opps = [o for o in opps if o["category"] == category]
    if q:
        ql = q.lower()
        opps = [
            o for o in opps
            if ql in customers.get(o["customer_id"], {}).get("name", "").lower()
            or ql in o["type"].lower()
            or ql in o["service_need"].lower()
        ]
    if sort == "value":
        opps = sorted(opps, key=lambda o: o["expected_value"], reverse=True)
    else:
        opps = sorted(opps, key=lambda o: o["urgency_score"], reverse=True)

    enriched = []
    for o in opps:
        c = customers.get(o["customer_id"], {})
        enriched.append({**o, "customer": c})
    return {"opportunities": enriched}


@api_router.get("/demo/{session_id}/opportunities/{opp_id}")
async def get_opportunity(session_id: str, opp_id: str):
    session = await get_session(session_id)
    state = session["state"]
    opp = find_opp(state, opp_id)
    customer = find_customer(state, opp["customer_id"])
    audit = [a for a in state["audit"] if a["opportunity_id"] == opp_id]
    ledger = [l for l in state["ledger"] if l.get("opportunity_id") == opp_id or l.get("customer_id") == customer["id"]]
    return {"opportunity": opp, "customer": customer, "audit": audit, "ledger": ledger}


@api_router.post("/demo/{session_id}/opportunities/{opp_id}/regenerate")
async def regenerate_draft(session_id: str, opp_id: str):
    session = await get_session(session_id)
    state = session["state"]
    opp = find_opp(state, opp_id)
    customer = find_customer(state, opp["customer_id"])

    append_audit(state, opp_id, customer["id"], "AI Draft Requested", "Owner", "Owner requested a fresh AI draft.")

    ai_result = await generate_draft(opp, customer)
    if ai_result:
        opp["draft_message"] = ai_result["draftMessage"]
        opp["draft_channel"] = ai_result["draftChannel"]
        opp["draft_subject"] = ai_result.get("draftSubject")
        opp["recommended_action"] = ai_result["recommendedAction"]
        opp["rationale"] = ai_result["rationale"]
        opp["confidence"] = int(ai_result["confidence"])
        opp["source_facts_used"] = ai_result["sourceFactsUsed"]
        opp["draft_source"] = "ai"
        opp["status"] = "Needs Approval" if opp["status"] not in ("Approved", "Sent", "Appointment Booked") else opp["status"]
        append_audit(state, opp_id, customer["id"], "Draft Generated", "AI Agent", "Fresh AI draft generated and prepared for approval.")
    else:
        opp["draft_source"] = "seeded"
        append_audit(state, opp_id, customer["id"], "Fallback Loaded", "System", "AI unavailable — approved seeded draft restored.")

    await save_session(session_id, state)
    return {"opportunity": opp, "source": opp["draft_source"]}


@api_router.post("/demo/{session_id}/opportunities/{opp_id}/action")
async def opportunity_action(session_id: str, opp_id: str, payload: dict = Body(...)):
    action = payload.get("action")
    session = await get_session(session_id)
    state = session["state"]
    opp = find_opp(state, opp_id)
    customer = find_customer(state, opp["customer_id"])

    if action == "edit_draft":
        new_message = payload.get("draft_message")
        if not new_message:
            raise HTTPException(status_code=400, detail="draft_message is required")
        opp["draft_message"] = new_message
        opp["draft_source"] = "edited"
        opp["status"] = "Needs Approval"
        append_audit(state, opp_id, customer["id"], "User Edited", "Owner", "Owner edited the draft.")
    elif action == "approve_and_send":
        opp["status"] = "Sent"
        opp["sent_at"] = now_iso()
        append_audit(state, opp_id, customer["id"], "Approved", "Owner", "Owner approved the draft.")
        append_audit(state, opp_id, customer["id"], "Sent", "System", f"Message dispatched via {opp['draft_channel']} (simulated).")
    elif action == "reject":
        opp["status"] = "Lost"
        append_audit(state, opp_id, customer["id"], "Rejected", "Owner", payload.get("reason") or "Owner rejected the draft.")
    elif action == "snooze":
        opp["status"] = "Snoozed"
        append_audit(state, opp_id, customer["id"], "Snoozed", "Owner", payload.get("reason") or "Snoozed by owner.")
    elif action == "assign":
        opp["assigned_to"] = payload.get("assignee") or "Team"
        append_audit(state, opp_id, customer["id"], "Assigned", "Owner", f"Assigned to {opp['assigned_to']}.")
    elif action == "pause_workflow":
        for w in state["workflows"]:
            if w["id"] == opp["workflow_id"]:
                w["paused"] = True
        opp["status"] = "Paused"
        append_audit(state, opp_id, customer["id"], "Workflow Paused", "Owner", "Owner paused the parent workflow.")
    elif action == "book_appointment":
        opp["status"] = "Appointment Booked"
        opp["booked_at"] = now_iso()
        append_audit(state, opp_id, customer["id"], "Appointment Booked", "Owner", "Simulated appointment booked from reply.")
        state["ledger"].insert(0, {
            "id": f"led-{uuid.uuid4().hex[:8]}",
            "customer_id": customer["id"],
            "opportunity_id": opp_id,
            "event": "Appointment Booked",
            "amount": opp["expected_value"],
            "kind": "recorded",
            "timestamp": now_iso(),
        })
        state["business"]["recorded_recovered_revenue"] += opp["expected_value"]
        state["business"]["appointments_booked_this_month"] += 1
    elif action == "mark_lost":
        opp["status"] = "Lost"
        append_audit(state, opp_id, customer["id"], "Marked Lost", "Owner", payload.get("reason") or "Marked as lost by owner.")
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

    await save_session(session_id, state)
    return {"opportunity": opp}


# ------------------------ Customer ------------------------
@api_router.get("/demo/{session_id}/customers/{customer_id}")
async def get_customer(session_id: str, customer_id: str):
    session = await get_session(session_id)
    state = session["state"]
    customer = find_customer(state, customer_id)
    opportunities = [o for o in state["opportunities"] if o["customer_id"] == customer_id]
    audit = [a for a in state["audit"] if a.get("customer_id") == customer_id]
    ledger = [l for l in state["ledger"] if l.get("customer_id") == customer_id]
    return {"customer": customer, "opportunities": opportunities, "audit": audit, "ledger": ledger}


# ------------------------ Approval Center ------------------------
@api_router.get("/demo/{session_id}/approvals")
async def approvals(session_id: str):
    session = await get_session(session_id)
    state = session["state"]
    customers = {c["id"]: c for c in state["customers"]}
    workflows = {w["id"]: w for w in state["workflows"]}
    queue = []
    for o in state["opportunities"]:
        if o["status"] in ("Needs Approval", "Approval Required", "Draft Ready", "Follow-up Due"):
            queue.append({
                **o,
                "customer": customers.get(o["customer_id"], {}),
                "workflow": workflows.get(o["workflow_id"], {}),
            })
    queue = sorted(queue, key=lambda o: o["urgency_score"], reverse=True)
    return {"queue": queue}


# ------------------------ Workflows ------------------------
@api_router.get("/demo/{session_id}/workflows")
async def list_workflows(session_id: str):
    session = await get_session(session_id)
    return {"workflows": session["state"]["workflows"]}


@api_router.put("/demo/{session_id}/workflows/{workflow_id}")
async def update_workflow(session_id: str, workflow_id: str, payload: dict = Body(...)):
    session = await get_session(session_id)
    state = session["state"]
    updated = None
    for w in state["workflows"]:
        if w["id"] == workflow_id:
            for key in ("name", "description", "trigger", "business_hours", "contact_channel",
                        "message_tone", "follow_up_timing", "approval_mode", "stop_rules",
                        "escalation", "paused"):
                if key in payload:
                    w[key] = payload[key]
            updated = w
            break
    if not updated:
        raise HTTPException(status_code=404, detail="Workflow not found")
    append_audit(state, None, None, "Workflow Updated", "Owner", f"Workflow '{updated['name']}' configuration saved.")
    await save_session(session_id, state)
    return {"workflow": updated}


@api_router.post("/demo/{session_id}/workflows/{workflow_id}/test")
async def test_workflow(session_id: str, workflow_id: str):
    session = await get_session(session_id)
    state = session["state"]
    workflow = next((w for w in state["workflows"] if w["id"] == workflow_id), None)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    append_audit(state, None, None, "Workflow Tested", "Owner", f"'{workflow['name']}' tested with sample data — no messages sent.")
    await save_session(session_id, state)
    return {
        "ok": True,
        "simulated_steps": [
            {"step": "Detect eligible opportunity", "status": "ok"},
            {"step": "Prepare approved draft", "status": "ok"},
            {"step": "Queue for approval", "status": "ok"},
            {"step": "Simulated dispatch (no real messages)", "status": "ok"},
        ],
    }


# ------------------------ Impact & Audit ------------------------
@api_router.get("/demo/{session_id}/impact")
async def impact(session_id: str, period: str = "last_30_days"):
    session = await get_session(session_id)
    return {"period": period, **compute_impact(session["state"])}


@api_router.get("/demo/{session_id}/audit")
async def audit(session_id: str, limit: int = 50):
    session = await get_session(session_id)
    return {"audit": session["state"]["audit"][:limit]}


# ------------------------ Health ------------------------
@api_router.get("/")
async def root():
    return {"service": "JobOS Revenue Recovery", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

from fastapi import APIRouter, HTTPException
from datetime import datetime

from database import reminders_col, notes_col, get_next_id, doc_to_dict
from models import (
    ReminderCreate, ReminderUpdate,
    NoteCreate, NoteUpdate,
)

router = APIRouter()


# ─── Reminders ───

@router.get("/reminders")
def get_reminders(
    start_date: datetime = None,
    end_date: datetime = None,
    is_completed: bool = None,
):
    query = {}
    if start_date:
        query.setdefault("date", {})["$gte"] = start_date
    if end_date:
        query.setdefault("date", {})["$lte"] = end_date
    if is_completed is not None:
        query["is_completed"] = is_completed

    docs = reminders_col.find(query).sort("date", 1)
    return [doc_to_dict(d) for d in docs]


@router.post("/reminders")
def create_reminder(reminder: ReminderCreate):
    now = datetime.utcnow()
    doc = {
        "id": get_next_id("reminders"),
        **reminder.dict(),
        "created_at": now,
        "updated_at": now,
    }
    reminders_col.insert_one(doc)
    return doc_to_dict(doc)


@router.put("/reminders/{reminder_id}")
def update_reminder(reminder_id: int, reminder_update: ReminderUpdate):
    doc = reminders_col.find_one({"id": reminder_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Reminder not found")

    update_data = reminder_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    reminders_col.update_one({"id": reminder_id}, {"$set": update_data})

    updated = reminders_col.find_one({"id": reminder_id})
    return doc_to_dict(updated)


@router.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: int):
    doc = reminders_col.find_one({"id": reminder_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Reminder not found")
    reminders_col.delete_one({"id": reminder_id})
    return {"message": "Reminder deleted successfully"}


# ─── Notes ───

@router.get("/notes")
def get_notes(
    start_date: datetime = None,
    end_date: datetime = None,
    skip: int = 0,
    limit: int = 100,
):
    query = {}
    if start_date:
        query.setdefault("date", {})["$gte"] = start_date
    if end_date:
        query.setdefault("date", {})["$lte"] = end_date

    docs = notes_col.find(query).sort("date", -1).skip(skip).limit(limit)
    return [doc_to_dict(d) for d in docs]


@router.post("/notes")
def create_note(note: NoteCreate):
    now = datetime.utcnow()
    note_data = note.dict()

    # Tarihi günün başına ayarla
    if note_data.get("date"):
        note_date = note_data["date"]
        if isinstance(note_date, str):
            note_date = datetime.fromisoformat(note_date.replace("Z", "+00:00"))
        note_data["date"] = datetime.combine(note_date.date(), datetime.min.time())

    doc = {
        "id": get_next_id("notes"),
        **note_data,
        "created_at": now,
        "updated_at": now,
    }
    notes_col.insert_one(doc)
    return doc_to_dict(doc)


@router.put("/notes/{note_id}")
def update_note(note_id: int, note_update: NoteUpdate):
    doc = notes_col.find_one({"id": note_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Note not found")

    update_data = note_update.dict(exclude_unset=True)

    if "date" in update_data and update_data["date"]:
        note_date = update_data["date"]
        if isinstance(note_date, str):
            note_date = datetime.fromisoformat(note_date.replace("Z", "+00:00"))
        update_data["date"] = datetime.combine(note_date.date(), datetime.min.time())

    update_data["updated_at"] = datetime.utcnow()
    notes_col.update_one({"id": note_id}, {"$set": update_data})

    updated = notes_col.find_one({"id": note_id})
    return doc_to_dict(updated)


@router.delete("/notes/{note_id}")
def delete_note(note_id: int):
    doc = notes_col.find_one({"id": note_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Note not found")
    notes_col.delete_one({"id": note_id})
    return {"message": "Note deleted successfully"}

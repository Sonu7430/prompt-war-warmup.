"""
In-memory Connected State Store.
Allows seamless cross-workflow integration:
Actions in Medical Simplifier or Scam Shield dynamically update the Daily Pulse checklist & advisory notes.
"""

from typing import List
from datetime import datetime
from app.schemas import AdvisoryNote, ChecklistItem

class StateStore:
    def __init__(self):
        self.advisory_notes: List[AdvisoryNote] = [
            AdvisoryNote(
                id="adv-init-1",
                source="system",
                title="Welcome to your Safe Companion",
                message="Your health pulse is active. Tap any button or speak freely to get help.",
                severity="info",
                created_at=datetime.now().strftime("%I:%M %p")
            )
        ]
        self.routine_checklist: List[ChecklistItem] = [
            ChecklistItem(
                id="task-1",
                title="Morning Blood Pressure check & pill",
                time="8:30 AM",
                category="medication",
                completed=False
            ),
            ChecklistItem(
                id="task-2",
                title="Drink a glass of warm water or herbal tea",
                time="9:00 AM",
                category="hydration",
                completed=False
            ),
            ChecklistItem(
                id="task-3",
                title="Gentle 10-minute porch stretch or walk",
                time="10:15 AM",
                category="activity",
                completed=False
            ),
            ChecklistItem(
                id="task-4",
                title="Nutritious lunch & afternoon vitamins",
                time="12:30 PM",
                category="wellness",
                completed=False
            )
        ]

    def add_advisory_note(self, source: str, title: str, message: str, severity: str = "info") -> AdvisoryNote:
        note = AdvisoryNote(
            id=f"adv-{len(self.advisory_notes) + 1}-{int(datetime.now().timestamp())}",
            source=source,
            title=title,
            message=message,
            severity=severity,
            created_at=datetime.now().strftime("%I:%M %p")
        )
        self.advisory_notes.insert(0, note)
        return note

    def add_checklist_item(self, title: str, category: str = "wellness", time_str: str = "Today") -> ChecklistItem:
        item = ChecklistItem(
            id=f"task-{len(self.routine_checklist) + 1}-{int(datetime.now().timestamp())}",
            title=title,
            time=time_str,
            category=category,
            completed=False
        )
        self.routine_checklist.append(item)
        return item

    def toggle_checklist_item(self, task_id: str) -> bool:
        for item in self.routine_checklist:
            if item.id == task_id:
                item.completed = not item.completed
                return item.completed
        return False

    def get_advisories(self) -> List[AdvisoryNote]:
        return self.advisory_notes

    def get_advisory_notes(self) -> List[AdvisoryNote]:
        return self.advisory_notes

    def get_checklist(self) -> List[ChecklistItem]:
        return self.routine_checklist


# Global singleton instance for session
global_state = StateStore()

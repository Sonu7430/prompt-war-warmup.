"""
Workflow: Gentle Cognitive Stimulation & Memory Journal ("Stories of My Life").
Provides open-ended nostalgic prompts, validates spoken reflections,
and stores commemorative memory cards for seniors and family.
"""

from datetime import datetime
from typing import List, Dict, Any
from app.schemas import MemoryReflectionRequest, MemoryCard

DAILY_PROMPTS = [
    {
        "id": "prompt-1",
        "theme": "Music & Youth",
        "prompt_question": "What was your favorite song or melody when you were around twenty years old, and where did you usually listen to it?",
        "suggested_era": "Early Adulthood"
    },
    {
        "id": "prompt-2",
        "theme": "Adventures & Travel",
        "prompt_question": "Tell me about your first car, bicycle, or memorable road trip. Where was the very first place you went?",
        "suggested_era": "Golden Years"
    },
    {
        "id": "prompt-3",
        "theme": "Childhood Summers",
        "prompt_question": "What was your childhood neighborhood like during long summer afternoons? Who was your favorite playmate?",
        "suggested_era": "Childhood"
    },
    {
        "id": "prompt-4",
        "theme": "Family Recipes & Kitchen",
        "prompt_question": "Describe the smells and sounds of your family kitchen on a Sunday morning or holiday. What dish did you love most?",
        "suggested_era": "Family Traditions"
    }
]

MEMORY_CARDS: List[MemoryCard] = [
    MemoryCard(
        id="mem-seed-1",
        prompt_question="What was your first car or memorable road trip?",
        story_text="I remember my blue 1968 Chevrolet Impala. My brother and I drove it all the way up to Lake Michigan with the windows rolled down listening to the radio.",
        ai_reflection="What a vivid and joyful picture! There is nothing quite like the feeling of the open road and cool lake breeze with your brother. Thank you for preserving this beautiful slice of your life.",
        timestamp="Yesterday",
        era_tag="Golden Years"
    )
]


def get_daily_reminiscence_prompt() -> Dict[str, Any]:
    day_index = datetime.now().day % len(DAILY_PROMPTS)
    return DAILY_PROMPTS[day_index]


def create_memory_reflection(req: MemoryReflectionRequest) -> MemoryCard:
    """Generates an empathetic AI reflection honoring the senior's spoken life story."""
    story = req.story_text.strip()
    
    # Warm, empathetic cognitive reflection
    if "song" in req.prompt_question.lower() or "music" in story.lower():
        reflection = (
            f"Hearing you recall that melody brings such warmth. Music has a magical way of holding onto our happiest moments, "
            f"and your story captures the spirit of those years so vividly."
        )
    elif "car" in req.prompt_question.lower() or "drive" in story.lower() or "trip" in story.lower():
        reflection = (
            f"What a spirited journey! Those first adventures on the road shaped so much independence and wonder. "
            f"Your family will treasure reading this wonderful recollection."
        )
    elif "kitchen" in req.prompt_question.lower() or "food" in story.lower() or "cook" in story.lower():
        reflection = (
            f"The aromas and warmth of home stick with us forever. Thank you for sharing such an affectionate memory of family traditions."
        )
    else:
        reflection = (
            f"Thank you for sharing such a precious, heartfelt memory. Every story you speak is a priceless gift to your loved ones and keeps your history bright."
        )

    card = MemoryCard(
        id=f"mem-{len(MEMORY_CARDS) + 1}-{int(datetime.now().timestamp())}",
        prompt_question=req.prompt_question,
        story_text=story,
        ai_reflection=reflection,
        timestamp=datetime.now().strftime("%B %d, %Y at %I:%M %p"),
        era_tag="Stories of My Life"
    )

    MEMORY_CARDS.insert(0, card)
    return card


def get_memory_cards() -> List[MemoryCard]:
    return MEMORY_CARDS

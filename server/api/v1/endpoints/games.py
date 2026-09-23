from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from server.services.dda_engine import evaluate_adaptive_difficulty

router = APIRouter()

class SessionEvaluationRequest(BaseModel):
    patient_id: str
    game_id: str = Field(..., description="smriti_mandir, dhwani_tarang, dhyaan_kendra, or dainik_dinlipi")
    completion_time_ms: int = Field(..., ge=0)
    error_count: int = Field(..., ge=0)
    hesitation_pause_ms: int = Field(0, ge=0)
    current_skill_vector: Optional[List[float]] = None

# Cultural game catalog data tailored for the North Eastern Region
CULTURAL_GAMES_CATALOG = [
    {
        "id": "smriti_mandir",
        "title": "স্মৃতি মন্দিৰ (Smriti Mandir - Memory Temple)",
        "cognitive_domain": "Visual Memory & Cultural Object Recognition",
        "target_skill": "visual_memory",
        "cultural_assets": [
            {"name": "Jaapi (জাপি)", "category": "Traditional Attire", "region": "Assam", "icon": "jaapi.png"},
            {"name": "Xorai (শৰাই)", "category": "Brass Heritage", "region": "Assam", "icon": "xorai.png"},
            {"name": "Gamosa (গামোচা)", "category": "Handloom Textile", "region": "Assam", "icon": "gamosa.png"},
            {"name": "Pepa (পেঁপা)", "category": "Horn Musical Instrument", "region": "Assam", "icon": "pepa.png"},
            {"name": "Hornbill Feather", "category": "Cultural Heritage", "region": "Nagaland", "icon": "hornbill.png"},
            {"name": "Loktak Lotus", "category": "Floral Ecology", "region": "Manipur", "icon": "lotus.png"}
        ],
        "description": "Interactive card-flip and object-matching game using familiar North Eastern cultural motifs."
    },
    {
        "id": "dhwani_tarang",
        "title": "ধ্বনি তৰংগ (Dhwani Tarang - Sound Waves)",
        "cognitive_domain": "Auditory Attention & Pattern Recall",
        "target_skill": "auditory_processing",
        "cultural_assets": [
            {"name": "Bihu Dhol Beat", "sound_type": "rhythm", "audio_clip": "dhol_rhythm.mp3"},
            {"name": "Tokari Geet String", "sound_type": "melody", "audio_clip": "tokari_string.mp3"},
            {"name": "Brahmaputra River Current", "sound_type": "ambient", "audio_clip": "river_ambient.mp3"},
            {"name": "Monsoon Rain on Tin Roof", "sound_type": "calm", "audio_clip": "monsoon_rain.mp3"}
        ],
        "description": "Listen and identify soothing regional acoustic patterns and folk melodies."
    },
    {
        "id": "dhyaan_kendra",
        "title": "ধ্যান কেন্দ্ৰ (Dhyaan Kendra - Focus Center)",
        "cognitive_domain": "Sustained Attention & Semantic Categorization",
        "target_skill": "semantic_fluency",
        "cultural_assets": [
            {"name": "Tea Garden Leaf Sorting", "category": "Agriculture", "region": "Assam"},
            {"name": "Mishing Weaving Geometric Matching", "category": "Textile", "region": "Assam"},
            {"name": "Bazar Vegetable Grouping", "category": "Daily Life", "region": "NER"}
        ],
        "description": "Sort tea leaves, identify authentic handloom weaves, and find matching patterns."
    },
    {
        "id": "dainik_dinlipi",
        "title": "দৈনিক দিনলিপি (Dainik Dinlipi - Daily Chronicle)",
        "cognitive_domain": "Executive Planning & Routine Recall",
        "target_skill": "executive_planning",
        "cultural_assets": [
            {"step": 1, "activity": "Morning Sah (পুৱাৰ চাহ - Morning Tea)"},
            {"step": 2, "activity": "Namghar Prayer / Meditation (প্ৰাৰ্থনা)"},
            {"step": 3, "activity": "Morning Medicine (ঔষধ গ্ৰহণ)"},
            {"step": 4, "activity": "Bazar / Garden Walk (শাক-পাচলি বাগিচা)"}
        ],
        "description": "Chronological timeline sequencing to preserve daily episodic memory and routine independence."
    }
]

REGIONAL_LOCALES = {
    "as": {
        "welcome": "নমস্কাৰ, স্মৃতিসেতুত আপোনাক স্বাগতম",
        "start_game": "খেল আৰম্ভ কৰক",
        "good_job": "বৰ ধুনীয়া হৈছে!",
        "try_again": "আকৌ চেষ্টা কৰক, একো চিন্তা নাই",
        "take_water": "পানী খাবলৈ নাপাহৰিব",
        "take_medicine": "এতিয়া ঔষধ খোৱাৰ সময়"
    },
    "bn": {
        "welcome": "নমস্কার, স্মৃতিসেতুতে আপনাকে স্বাগতম",
        "start_game": "খেলা শুরু করুন",
        "good_job": "খুব সুন্দর হয়েছে!",
        "try_again": "আবার চেষ্টা করুন, কোনো চিন্তা নেই",
        "take_water": "জল খেতে ভুলবেন না",
        "take_medicine": "এখন ওষুধ খাওয়ার সময়"
    },
    "brx": {
        "welcome": "खुलुमबाय, स्मृतीसेतुआव बरायबाय",
        "start_game": "गेम जागाय",
        "good_job": "जोबोर मोजां जाबाय!",
        "try_again": "फिन नाजा, जेबो साननाङा",
        "take_water": "दै लोंनो दाबाव",
        "take_medicine": "मुली लोंनायनि सम जाबाय"
    },
    "en": {
        "welcome": "Welcome to SmritiSetu",
        "start_game": "Start Activity",
        "good_job": "Well done!",
        "try_again": "Take your time, let's try again",
        "take_water": "Remember to take a sip of water",
        "take_medicine": "Time for your scheduled medicine"
    },
    "hi": {
        "welcome": "नमस्ते, स्मृतिसेतु में आपका स्वागत है",
        "start_game": "गतिविधि शुरू करें",
        "good_job": "बहुत बढ़िया!",
        "try_again": "फिर से प्रयास करें, कोई चिंता नहीं",
        "take_water": "पानी पीना न भूलें",
        "take_medicine": "दवा लेने का समय हो गया है"
    }
}

@router.get("/catalog")
async def get_game_catalog():
    """
    Returns the cultural cognitive gaming catalog with regional assets for NER.
    """
    return {
        "catalog": CULTURAL_GAMES_CATALOG,
        "region": "North Eastern Region (NER), India"
    }

@router.get("/locales")
async def get_regional_locales():
    """
    Returns localized strings and voice interaction cues for Assamese, Bengali, Bodo, and English.
    """
    return REGIONAL_LOCALES

@router.post("/evaluate-session")
async def evaluate_game_session(payload: SessionEvaluationRequest):
    """
    Evaluates gameplay telemetry using the AI/ML mElo Dynamic Difficulty Adjustment engine.
    Returns next difficulty tier, updated 4D skill vector, and anxiety-relief triggers.
    """
    dda_result = evaluate_adaptive_difficulty(
        patient_id=payload.patient_id,
        game_id=payload.game_id,
        completion_time_ms=payload.completion_time_ms,
        error_count=payload.error_count,
        hesitation_pause_ms=payload.hesitation_pause_ms,
        current_skill_vector=payload.current_skill_vector
    )
    return dda_result

from datetime import date
from random import Random
from .schemas import (
    AstroRequest,
    AstroResponse,
    CompatibilityRequest,
    CompatibilityResponse,
)

ZODIAC_SIGNS = [
    (120, "Capricorn"),
    (218, "Aquarius"),
    (320, "Pisces"),
    (420, "Aries"),
    (521, "Taurus"),
    (621, "Gemini"),
    (722, "Cancer"),
    (823, "Leo"),
    (923, "Virgo"),
    (1023, "Libra"),
    (1122, "Scorpio"),
    (1222, "Sagittarius"),
    (1231, "Capricorn"),
]

ZODIAC_PROFILES = {
    "Aries": {
        "personality": "Bold, energetic, and adventurous. Today you have a strong drive to start new things and win small personal victories.",
        "dos": [
            "Lead with confidence",
            "Take time for movement",
            "Say yes to a fresh opportunity",
        ],
        "donts": [
            "Avoid rushing emotional decisions",
            "Don’t be aggressive with others",
            "Stay away from unnecessary conflict",
        ],
    },
    "Taurus": {
        "personality": "Grounded, practical, and calm. You can create comfort through steady habits and thoughtful planning.",
        "dos": [
            "Slow down and savor your routine",
            "Treat yourself gently",
            "Use patience to solve a problem",
        ],
        "donts": [
            "Avoid stubborn arguments",
            "Don’t force a change too fast",
            "Hold back from impulse purchases",
        ],
    },
    "Gemini": {
        "personality": "Curious, versatile, and communicative. Conversations and ideas are your strongest tools today.",
        "dos": [
            "Share your ideas clearly",
            "Explore a new perspective",
            "Connect with someone inspiring",
        ],
        "donts": [
            "Avoid overcommitting",
            "Don’t spread yourself too thin",
            "Resist gossip or distractions",
        ],
    },
    "Cancer": {
        "personality": "Sensitive, nurturing, and intuitive. Your emotional intelligence helps you support others and protect your energy.",
        "dos": [
            "Make space for self-care",
            "Listen to your instincts",
            "Create a calm home ritual",
        ],
        "donts": [
            "Avoid emotional overreaction",
            "Don’t take responsibility for others’ moods",
            "Stay away from dramatic situations",
        ],
    },
    "Leo": {
        "personality": "Warm, generous, and radiant. Your presence can brighten the room, and your confidence is magnetic.",
        "dos": [
            "Take a creative risk",
            "Celebrate a small win",
            "Offer encouragement to someone else",
        ],
        "donts": [
            "Avoid needing too much approval",
            "Don’t dominate a conversation",
            "Stay clear of prideful choices",
        ],
    },
    "Virgo": {
        "personality": "Detail-oriented, helpful, and analytical. You thrive when you turn ideas into a clear, polished plan.",
        "dos": [
            "Organize one task",
            "Focus on practical progress",
            "Use clarity to reduce stress",
        ],
        "donts": [
            "Avoid overanalyzing emotions",
            "Don’t criticize yourself too harshly",
            "Resist perfectionism paralysis",
        ],
    },
    "Libra": {
        "personality": "Diplomatic, charming, and balance-seeking. Today is ideal for harmonizing relationships and making graceful choices.",
        "dos": [
            "Create a peaceful moment",
            "Have a kind conversation",
            "Bring balance to a decision",
        ],
        "donts": [
            "Avoid indecision traps",
            "Don’t let others sway your values",
            "Steer clear of people-pleasing",
        ],
    },
    "Scorpio": {
        "personality": "Intense, perceptive, and transformative. Your focus can uncover hidden meaning and move things forward quietly.",
        "dos": [
            "Trust your intuition",
            "Channel energy into a deep goal",
            "Honor a private commitment",
        ],
        "donts": [
            "Avoid jealousy or comparison",
            "Don’t cling to what needs release",
            "Stay away from manipulative games",
        ],
    },
    "Sagittarius": {
        "personality": "Optimistic, adventurous, and honest. You’re drawn to new ideas, distant horizons, and expansive thinking.",
        "dos": [
            "Try something playful",
            "Learn from a fresh source",
            "Share a hopeful message",
        ],
        "donts": [
            "Avoid overpromising",
            "Don’t ignore practical details",
            "Resist reckless spending",
        ],
    },
    "Capricorn": {
        "personality": "Disciplined, ambitious, and reliable. You can build strong momentum by focusing on what matters most today.",
        "dos": [
            "Plan a smart next step",
            "Finish one important task",
            "Honor your commitments",
        ],
        "donts": [
            "Avoid burnout rituals",
            "Don’t delay needed rest",
            "Stay away from rigid thinking",
        ],
    },
    "Aquarius": {
        "personality": "Innovative, humanitarian, and independent. Your ideas can uplift others and shift the energy with ease.",
        "dos": [
            "Share an original idea",
            "Support a community effort",
            "Give yourself creative freedom",
        ],
        "donts": [
            "Avoid emotional detachment",
            "Don’t ignore practical needs",
            "Resist rebellious drama",
        ],
    },
    "Pisces": {
        "personality": "Dreamy, compassionate, and imaginative. Your sensitivity is a gift when you channel it into inspiration.",
        "dos": [
            "Tap into a creative practice",
            "Offer gentle support",
            "Honor your inner rhythm",
        ],
        "donts": [
            "Avoid scattered focus",
            "Don’t ignore boundaries",
            "Stay clear of over-escaping",
        ],
    },
}

COLOR_RECOMMENDATIONS = [
    {
        "name": "Emerald",
        "hex": "#54B689",
        "energy": "High",
        "reason": "Emerald brings calm confidence and helps you stay grounded while moving with your flow.",
    },
    {
        "name": "Gold",
        "hex": "#F5C744",
        "energy": "High",
        "reason": "Gold attracts clarity, abundance, and the courage to take positive action.",
    },
    {
        "name": "Midnight Blue",
        "hex": "#2D3A78",
        "energy": "Medium",
        "reason": "Midnight blue supports stillness and thoughtful insight during busy days.",
    },
    {
        "name": "Lavender",
        "hex": "#BFA6F3",
        "energy": "Medium",
        "reason": "Lavender encourages gentle self-reflection and creative ease.",
    },
    {
        "name": "Rose Quartz",
        "hex": "#F0B6C9",
        "energy": "Low",
        "reason": "Rose quartz helps soothe the heart and restore emotional balance.",
    },
    {
        "name": "Charcoal",
        "hex": "#3F4558",
        "energy": "Low",
        "reason": "Charcoal provides quiet strength when you need to slow down and conserve energy.",
    },
]

ENERGY_STEPS = [
    (70, "High"),
    (40, "Medium"),
    (0, "Low"),
]


def zodiac_sign(dob: date) -> str:
    month_day = dob.month * 100 + dob.day
    for end_date, sign in ZODIAC_SIGNS:
        if month_day <= end_date:
            return sign
    return "Capricorn"


def reduce_to_one_digit(value: int) -> int:
    while value > 9 and value not in (11, 22):
        value = sum(int(ch) for ch in str(value))
    return value


def numerology_score(dob: date) -> int:
    digits = f"{dob.year}{dob.month:02d}{dob.day:02d}"
    total = sum(int(ch) for ch in digits)
    core = reduce_to_one_digit(total)
    return core


def daily_energy_factor(dob: date, key: str) -> int:
    today = date.today()
    seed = (
        int(today.strftime("%Y%m%d"))
        + int(dob.strftime("%Y%m%d"))
        + sum(ord(c) for c in key.lower())
    )
    rng = Random(seed)
    return rng.randint(10, 35)


def calculate_luck_score(zodiac: str, numerology: int, energy: int) -> int:
    zodiac_base = {
        "Aries": 15,
        "Taurus": 12,
        "Gemini": 14,
        "Cancer": 13,
        "Leo": 16,
        "Virgo": 12,
        "Libra": 14,
        "Scorpio": 13,
        "Sagittarius": 15,
        "Capricorn": 12,
        "Aquarius": 14,
        "Pisces": 13,
    }
    score = zodiac_base.get(zodiac, 12)
    score += numerology * 5
    score += int(energy * 1.8)
    return max(0, min(100, score))


def energy_status(score: int) -> str:
    for threshold, label in ENERGY_STEPS:
        if score >= threshold:
            return label
    return "Low"


def pick_lucky_color(energy_label: str, seed_key: str) -> dict:
    filtered = [
        color for color in COLOR_RECOMMENDATIONS if color["energy"] == energy_label
    ]
    if not filtered:
        filtered = COLOR_RECOMMENDATIONS
    rng = Random(sum(ord(c) for c in seed_key.lower()))
    return rng.choice(filtered)


def build_daily_message(zodiac: str, energy: int, country: str) -> str:
    base = f"Today, {zodiac} energy is strongest in your communication and intuition."
    if energy >= 30:
        return (
            base
            + " Trust your instincts and take bold but thoughtful steps toward what feels aligned."
        )
    if energy >= 20:
        return (
            base
            + " Focus on purposeful momentum and allow space for calm reflection between action."
        )
    return (
        base
        + " Honor your pace, stay grounded, and let gentle self-care guide your decisions."
    )


def compatibility_score(sign_a: str, sign_b: str) -> int:
    friendly_pairs = {
        "Aries": ["Leo", "Sagittarius", "Gemini"],
        "Taurus": ["Virgo", "Capricorn", "Cancer"],
        "Gemini": ["Libra", "Aquarius", "Aries"],
        "Cancer": ["Scorpio", "Pisces", "Taurus"],
        "Leo": ["Aries", "Sagittarius", "Libra"],
        "Virgo": ["Taurus", "Capricorn", "Cancer"],
        "Libra": ["Gemini", "Aquarius", "Leo"],
        "Scorpio": ["Cancer", "Pisces", "Virgo"],
        "Sagittarius": ["Aries", "Leo", "Aquarius"],
        "Capricorn": ["Taurus", "Virgo", "Pisces"],
        "Aquarius": ["Gemini", "Libra", "Sagittarius"],
        "Pisces": ["Cancer", "Scorpio", "Capricorn"],
    }
    score = 50
    if sign_a == sign_b:
        score += 20
    if sign_b in friendly_pairs.get(sign_a, []):
        score += 20
    if sign_a in friendly_pairs.get(sign_b, []):
        score += 10
    return max(0, min(100, score))


def compatibility_label(score: int) -> str:
    if score >= 75:
        return "Excellent"
    if score >= 55:
        return "Good"
    return "Balanced"


def compatibility_summary(score: int, sign_a: str, sign_b: str) -> str:
    if score >= 75:
        return f"{sign_a} and {sign_b} share a magnetic connection today. The energy supports strong collaboration and mutual support."
    if score >= 55:
        return f"{sign_a} and {sign_b} have a pleasant harmony. You can find balance by honoring each other’s strengths and listening with curiosity."
    return f"{sign_a} and {sign_b} should focus on empathy and clear boundaries. Slow, thoughtful communication will help the relationship feel grounded."


def generate_report(request: AstroRequest) -> AstroResponse:
    zodiac = zodiac_sign(request.dob)
    numerology = numerology_score(request.dob)
    energy_factor = daily_energy_factor(
        request.dob, request.first_name + request.last_name
    )
    luck_score = calculate_luck_score(zodiac, numerology, energy_factor)
    status = energy_status(energy_factor)
    lucky_color = pick_lucky_color(status, request.first_name + request.last_name)

    profile = ZODIAC_PROFILES.get(zodiac, ZODIAC_PROFILES["Pisces"])
    dos = profile["dos"]
    donts = profile["donts"]
    personality = profile["personality"]
    message = build_daily_message(zodiac, energy_factor, request.country)

    return AstroResponse(
        zodiac=zodiac,
        luck_score=luck_score,
        energy_level=status,
        lucky_color=lucky_color["name"],
        lucky_color_hex=lucky_color["hex"],
        message=message,
        personality=personality,
        dos=dos,
        donts=donts,
        daily_message=f"Your cosmic pulse for {request.first_name} is {status.lower()} energy with supportive rhythm throughout the day.",
        energy_status=status,
    )


def build_compatibility_report(request: CompatibilityRequest) -> CompatibilityResponse:
    sign_a = zodiac_sign(request.user_a.dob)
    sign_b = zodiac_sign(request.user_b.dob)
    score = compatibility_score(sign_a, sign_b)

    return CompatibilityResponse(
        sign_a=sign_a,
        sign_b=sign_b,
        match_score=score,
        compatibility=compatibility_label(score),
        summary=compatibility_summary(score, sign_a, sign_b),
    )

import pytest

from app.ai.buddy import BUDDY_INSTRUCTIONS, generate_buddy_reply, remove_agreement
from app.models import Unit
from tests.fakes import FakeChatModel


@pytest.mark.parametrize(
    "reply, expected",
    [
        (
            "Yeah, that's the main idea. How does light change the amount of glucose?",
            "How does light change the amount of glucose?",
        ),
        ("Exactly! But why do leaves look green?", "But why do leaves look green?"),
        ("Got it. Where does the oxygen go?", "Where does the oxygen go?"),
        ("Sí, eso es. ¿Y por qué las hojas son verdes?", "¿Y por qué las hojas son verdes?"),
        ("¡Exacto! ¿Y de dónde sale el oxígeno?", "¿Y de dónde sale el oxígeno?"),
    ],
)
def test_drops_an_opening_sentence_that_agrees(reply: str, expected: str) -> None:
    assert remove_agreement(reply) == expected


@pytest.mark.parametrize(
    "reply",
    [
        "Hmm, wait. Why do plants need light?",
        "Right? I thought plants ate soil.",
        "Yesterday you said leaves are green. Why is that?",
        "Si las plantas no tienen luz, ¿qué pasa?",
        "Yes.",
    ],
)
def test_keeps_replies_that_do_not_open_by_agreeing(reply: str) -> None:
    # Questions, look-alike words, Spanish "si" meaning "if", and a reply with nothing else
    assert remove_agreement(reply) == reply


def test_buddy_reply_goes_through_the_agreement_filter() -> None:
    fake_model = FakeChatModel()
    fake_model.queue_reply("Correct. So what happens to the oxygen?")
    unit = Unit(title="Photosynthesis", material="Plants make glucose using light.")

    reply = generate_buddy_reply(fake_model, unit, [])

    assert reply == "So what happens to the oxygen?"


def test_instructions_forbid_agreeing_and_repeating() -> None:
    assert "Never agree, confirm or praise" in BUDDY_INSTRUCTIONS
    assert "never repeat a guess you already made" in BUDDY_INSTRUCTIONS
    assert "Never repeat the student's own words or claims" in BUDDY_INSTRUCTIONS

from app.models import SessionTurn, Speaker


def escape_tags(text: str) -> str:
    """Stop a student from closing our tags early and writing their own instructions."""
    return text.replace("<", "&lt;").replace(">", "&gt;")


def wrap_student_text(text: str) -> str:
    """Mark text as the student's words so the model treats it as content, not orders."""
    return f"<student>{escape_tags(text)}</student>"


def format_transcript(turns: list[SessionTurn]) -> str:
    """Write the whole conversation as tagged lines for the checker to read."""
    lines = []
    for turn in turns:
        if turn.speaker == Speaker.STUDENT:
            lines.append(wrap_student_text(turn.text))
        else:
            lines.append(f"<buddy>{escape_tags(turn.text)}</buddy>")
    return "\n".join(lines)

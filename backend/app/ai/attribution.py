import re

# Letters only, in any alphabet, so Spanish accents count as part of a word
WORD_PATTERN = re.compile(r"[^\W\d_]+")

# Words of one or two letters ("a", "of", "en") match almost anything, so they don't count
MIN_WORD_LENGTH = 3

# Small models paraphrase a little, but a real quote shares most of the student's words
MIN_SHARE_FROM_STUDENT = 0.6


def content_words(text: str) -> set[str]:
    """The distinct lowercase words in a text, ignoring punctuation and very short words."""
    words = set()
    for word in WORD_PATTERN.findall(text.lower()):
        if len(word) >= MIN_WORD_LENGTH:
            words.add(word)
    return words


def share_found(claim_words: set[str], source_words: set[str]) -> float:
    """Fraction of the claim's words that appear in the source, from 0 to 1."""
    if len(claim_words) == 0:
        return 0.0
    return len(claim_words & source_words) / len(claim_words)


def said_by_student(claim: str, student_text: str, buddy_text: str) -> bool:
    """Whether a "you said" quote really comes from the student rather than from the buddy."""
    claim_words = content_words(claim)
    from_student = share_found(claim_words, content_words(student_text))
    from_buddy = share_found(claim_words, content_words(buddy_text))
    return from_student >= MIN_SHARE_FROM_STUDENT and from_student >= from_buddy

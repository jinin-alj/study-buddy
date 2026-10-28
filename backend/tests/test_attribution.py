from app.ai.attribution import content_words, said_by_student

STUDENT_TEXT = (
    "Photosynthesis is how plants make food. It happens in the chloroplasts. "
    "Plants get most of their food from the soil through the roots."
)
BUDDY_TEXT = (
    "Hi! I missed the class. Oh, so that means they just need sunlight, air, and water "
    "to grow, right? Do the mitochondria just stop working when there's no oxygen?"
)


def test_content_words_ignore_case_punctuation_and_short_words() -> None:
    assert content_words("Plants, in the SOIL!") == {"plants", "the", "soil"}


def test_content_words_keep_accented_letters() -> None:
    assert content_words("La fotosíntesis ocurre en los cloroplastos") == {
        "fotosíntesis",
        "ocurre",
        "los",
        "cloroplastos",
    }


def test_keeps_an_exact_student_quote() -> None:
    claim = "Plants get most of their food from the soil through the roots."

    assert said_by_student(claim, STUDENT_TEXT, BUDDY_TEXT) is True


def test_keeps_a_close_paraphrase_of_the_student() -> None:
    claim = "Plants get their food from the soil"

    assert said_by_student(claim, STUDENT_TEXT, BUDDY_TEXT) is True


def test_drops_the_buddys_planted_mistake() -> None:
    claim = "Oh, so that means they just need sunlight, air, and water to grow, right?"

    assert said_by_student(claim, STUDENT_TEXT, BUDDY_TEXT) is False


def test_drops_a_buddy_line_even_when_it_shares_some_words_with_the_student() -> None:
    claim = "the mitochondria just stop working when there's no oxygen"

    assert said_by_student(claim, STUDENT_TEXT, BUDDY_TEXT) is False


def test_drops_a_claim_nobody_made() -> None:
    claim = "Glucose is stored in the nucleus as starch crystals"

    assert said_by_student(claim, STUDENT_TEXT, BUDDY_TEXT) is False


def test_keeps_a_buddy_mistake_the_student_repeated_in_their_own_words() -> None:
    student_text = "Yes, plants only need sunlight, air and water to grow."
    claim = "plants only need sunlight, air and water to grow"

    assert said_by_student(claim, student_text, BUDDY_TEXT) is True


def test_drops_a_claim_with_no_real_words() -> None:
    assert said_by_student("a b ?", STUDENT_TEXT, BUDDY_TEXT) is False

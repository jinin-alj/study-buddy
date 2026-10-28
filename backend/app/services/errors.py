class NotFoundError(Exception):
    """The thing doesn't exist, or this user isn't allowed to know it exists."""


class ConflictError(Exception):
    """The request can't happen in the current state, for example a finished session."""

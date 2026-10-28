from typing import Any

import httpx

from app.ai.chat_model import ChatMessage, ChatModel, ChatModelError


class OllamaChatModel(ChatModel):
    """Talks to a local Ollama server. Free placeholder until a hosted model is chosen."""

    def __init__(
        self, base_url: str, model_name: str, timeout_seconds: float, context_tokens: int
    ) -> None:
        self.model_name = model_name
        self.context_tokens = context_tokens
        # One shared client so connections are reused across requests
        self.http_client = httpx.Client(base_url=base_url, timeout=timeout_seconds)

    def complete(
        self,
        messages: list[ChatMessage],
        temperature: float,
        response_schema: dict[str, Any] | None = None,
    ) -> str:
        """Send the chat to Ollama and return the reply text."""
        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature, "num_ctx": self.context_tokens},
        }
        if response_schema is not None:
            # Ollama constrains generation to this JSON schema
            payload["format"] = response_schema

        try:
            response = self.http_client.post("/api/chat", json=payload)
            response.raise_for_status()
            reply_text = response.json()["message"]["content"]
        except httpx.HTTPError as error:
            raise ChatModelError(f"Ollama request failed: {error}") from error
        except (KeyError, TypeError, ValueError) as error:
            raise ChatModelError("Ollama returned an unexpected response") from error

        if not isinstance(reply_text, str) or reply_text.strip() == "":
            raise ChatModelError("Ollama returned an empty reply")
        return reply_text.strip()

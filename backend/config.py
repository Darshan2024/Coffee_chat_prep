import os

from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Model constants
CLAUDE_MODEL = "claude-sonnet-4-6"
DEEPSEEK_MODEL = "deepseek-chat"

# Anthropic client (used by Orchestrator, Synthesis, Evaluator agents)
anthropic_client = AsyncAnthropic(
    api_key=os.environ["ANTHROPIC_API_KEY"],
)

# DeepSeek client — OpenAI-compatible SDK, different base URL
deepseek_client = AsyncOpenAI(
    api_key=os.environ["DEEPSEEK_API_KEY"],
    base_url="https://api.deepseek.com",
)

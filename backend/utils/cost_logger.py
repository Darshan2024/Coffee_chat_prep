import logging

# Cost per million tokens (input, output)
_RATES: dict[str, tuple[float, float]] = {
    "claude-sonnet-4-6": (3.00, 15.00),
    "deepseek-chat":     (0.26,  0.38),
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [COST] %(message)s",
    datefmt="%H:%M:%S",
)
_logger = logging.getLogger("cost_logger")

# Session-level accumulator — reset at the start of each pipeline run
_session_cost: float = 0.0


def reset_session_cost() -> None:
    global _session_cost
    _session_cost = 0.0


def get_session_cost() -> float:
    return _session_cost


def log_cost(
    agent_name: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
) -> float:
    """Log token usage, accumulate to session total, and return USD cost."""
    global _session_cost
    input_rate, output_rate = _RATES.get(model, (0.0, 0.0))
    cost = (input_tokens * input_rate + output_tokens * output_rate) / 1_000_000
    _session_cost += cost

    _logger.info(
        "%s | model=%s | in=%d out=%d | $%.6f",
        agent_name,
        model,
        input_tokens,
        output_tokens,
        cost,
    )
    return cost

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


def log_cost(
    agent_name: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
) -> float:
    """Log token usage and return USD cost for this call."""
    input_rate, output_rate = _RATES.get(model, (0.0, 0.0))
    cost = (input_tokens * input_rate + output_tokens * output_rate) / 1_000_000

    _logger.info(
        "%s | model=%s | in=%d out=%d | $%.6f",
        agent_name,
        model,
        input_tokens,
        output_tokens,
        cost,
    )
    return cost

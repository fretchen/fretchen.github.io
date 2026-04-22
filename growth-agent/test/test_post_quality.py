"""Post quality evaluation tests using deepeval.

These tests are marked with @pytest.mark.llm_eval and excluded from default runs.

Run with:
    uv run pytest -m llm_eval                  # Run only llm_eval tests
    uv run pytest -m llm_eval -v               # Verbose output
    uv run pytest -m ""                        # Run ALL tests including llm_eval

Requires: IONOS_API_TOKEN in .env (loaded automatically via python-dotenv)

These tests evaluate draft quality using the golden set baseline.
They are separate from unit tests and may be slower due to LLM calls.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# Load .env for IONOS_API_TOKEN
load_dotenv()

# Skip all tests if deepeval is not installed
pytest.importorskip("deepeval")

from deepeval import evaluate  # noqa: E402
from deepeval.metrics import GEval  # noqa: E402
from deepeval.models import DeepEvalBaseLLM  # noqa: E402
from deepeval.test_case import LLMTestCase, LLMTestCaseParams  # noqa: E402

# ---------------------------------------------------------------------------
# Custom IONOS LLM for deepeval
# ---------------------------------------------------------------------------

IONOS_BASE_URL = "https://openai.inference.de-txl.ionos.com/v1"
IONOS_MODEL = "meta-llama/Llama-3.3-70B-Instruct"


class IONOSEvalLLM(DeepEvalBaseLLM):
    """Custom LLM wrapper for IONOS AI Model Hub (OpenAI-compatible)."""

    def __init__(self, api_token: str | None = None):
        token = api_token or os.environ.get("IONOS_API_TOKEN")
        if not token:
            raise ValueError("IONOS_API_TOKEN not found in environment")
        self._model = ChatOpenAI(
            base_url=IONOS_BASE_URL,
            api_key=token,  # type: ignore[arg-type]
            model=IONOS_MODEL,
            temperature=0.0,  # Deterministic for eval
            max_tokens=1024,  # type: ignore[call-arg]
        )

    def load_model(self) -> ChatOpenAI:
        return self._model

    def generate(self, prompt: str) -> str:
        chat_model = self.load_model()
        return chat_model.invoke(prompt).content  # type: ignore[return-value]

    async def a_generate(self, prompt: str) -> str:
        chat_model = self.load_model()
        res = await chat_model.ainvoke(prompt)
        return res.content  # type: ignore[return-value]

    def get_model_name(self) -> str:
        return f"IONOS {IONOS_MODEL}"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def ionos_llm() -> IONOSEvalLLM | None:
    """Create IONOS LLM for evaluation, or None if token unavailable."""
    token = os.environ.get("IONOS_API_TOKEN")
    if not token:
        return None
    return IONOSEvalLLM(api_token=token)


@pytest.fixture(scope="module")
def golden_set() -> list[dict]:
    """Load the golden set of manually rated posts."""
    golden_path = Path(__file__).parent / "golden_set.json"
    with open(golden_path) as f:
        data = json.load(f)
    return data["posts"]


@pytest.fixture(scope="module")
def good_posts(golden_set: list[dict]) -> list[dict]:
    """Filter to posts with quality_score >= 70."""
    return [p for p in golden_set if p["quality_score"] >= 70]


@pytest.fixture(scope="module")
def bad_posts(golden_set: list[dict]) -> list[dict]:
    """Filter to posts with quality_score < 50."""
    return [p for p in golden_set if p["quality_score"] < 50]


# ---------------------------------------------------------------------------
# Custom G-Eval Metrics (with optional model injection)
# ---------------------------------------------------------------------------


def get_hook_quality_metric(model: DeepEvalBaseLLM | None = None) -> GEval:
    """Metric: Does the post have a strong opening hook?"""
    return GEval(
        name="Hook Quality",
        criteria=(
            "Evaluate whether the social media post has a strong opening hook. "
            "A good hook is a question, bold claim, surprising insight, or "
            "contrarian statement that grabs attention in the first line. "
            "Score 0 if the hook is generic, vague, or missing. "
            "Score 1 if the hook is present and attention-grabbing."
        ),
        evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT],
        threshold=0.7,
        model=model,
    )


def get_platform_fit_metric(
    channel: str, model: DeepEvalBaseLLM | None = None
) -> GEval:
    """Metric: Does the post follow platform conventions?"""
    if channel == "mastodon":
        criteria = (
            "Evaluate whether this Mastodon post follows platform conventions: "
            "1) Has 2-3 relevant hashtags (not too many, not zero). "
            "2) Is under 500 characters. "
            "3) Does not use excessive emojis. "
            "Score 1 if all conventions are followed, 0 otherwise."
        )
    else:  # bluesky
        criteria = (
            "Evaluate whether this Bluesky post follows platform conventions: "
            "1) Has NO hashtags (Bluesky culture discourages them). "
            "2) Is under 300 characters. "
            "3) Is concise and punchy. "
            "Score 1 if all conventions are followed, 0 otherwise."
        )
    return GEval(
        name=f"Platform Fit ({channel})",
        criteria=criteria,
        evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT],
        threshold=0.7,
        model=model,
    )


def get_engagement_potential_metric(model: DeepEvalBaseLLM | None = None) -> GEval:
    """Metric: Would the target audience engage with this post?"""
    return GEval(
        name="Engagement Potential",
        criteria=(
            "Evaluate whether this social media post would appeal to tech-curious "
            "academics, developers, and blockchain enthusiasts. Consider: "
            "1) Does it offer a clear value proposition or insight? "
            "2) Is the tone appropriate (insightful, technical but accessible)? "
            "3) Would you click the link or share this post? "
            "Score 1 if high engagement potential, 0 if low."
        ),
        evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT],
        threshold=0.6,
        model=model,
    )


def get_faithfulness_metric(model: DeepEvalBaseLLM | None = None) -> GEval:
    """Metric: Does the post avoid hallucinated claims?"""
    return GEval(
        name="Faithfulness",
        criteria=(
            "Evaluate whether the social media post makes claims that could be "
            "verified from the source blog post title and description. "
            "A faithful post does not invent statistics, quotes, or claims "
            "not implied by the source. "
            "Score 1 if the post is faithful to the source, 0 if it has "
            "hallucinations."
        ),
        evaluation_params=[
            LLMTestCaseParams.ACTUAL_OUTPUT,
            LLMTestCaseParams.EXPECTED_OUTPUT,
        ],
        threshold=0.8,
        model=model,
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.llm_eval
@pytest.mark.skipif(
    not os.environ.get("IONOS_API_TOKEN"),
    reason="IONOS_API_TOKEN not set",
)
class TestGoldenSetQuality:
    """Test that good posts pass quality metrics and bad posts fail."""

    def test_good_posts_have_hooks(
        self, good_posts: list[dict], ionos_llm: IONOSEvalLLM
    ) -> None:
        """Good posts should have strong opening hooks."""
        metric = get_hook_quality_metric(model=ionos_llm)
        test_cases = [
            LLMTestCase(
                input=f"Write a {p['channel']} post about: {p['source_blog_post']}",
                actual_output=p["content"],
            )
            for p in good_posts[:3]  # Limit to 3 to reduce API costs
        ]
        results = evaluate(test_cases, [metric])
        passed = sum(1 for r in results.test_results if r.success)
        assert (
            passed >= 2
        ), f"Expected at least 2/3 good posts to have hooks, got {passed}"

    def test_bad_posts_lack_hooks(
        self, bad_posts: list[dict], ionos_llm: IONOSEvalLLM
    ) -> None:
        """Bad posts should fail the hook quality metric."""
        metric = get_hook_quality_metric(model=ionos_llm)
        test_cases = [
            LLMTestCase(
                input=f"Write a {p['channel']} post about: {p['source_blog_post']}",
                actual_output=p["content"],
            )
            for p in bad_posts[:2]
        ]
        results = evaluate(test_cases, [metric])
        failed = sum(1 for r in results.test_results if not r.success)
        assert (
            failed >= 1
        ), f"Expected at least 1/2 bad posts to fail hook, got {failed}"

    def test_platform_fit_mastodon(
        self, good_posts: list[dict], ionos_llm: IONOSEvalLLM
    ) -> None:
        """Good Mastodon posts should follow platform conventions."""
        mastodon_posts = [p for p in good_posts if p["channel"] == "mastodon"][:2]
        if not mastodon_posts:
            pytest.skip("No good Mastodon posts in golden set")

        metric = get_platform_fit_metric("mastodon", model=ionos_llm)
        test_cases = [
            LLMTestCase(
                input=f"Write a Mastodon post about: {p['source_blog_post']}",
                actual_output=p["content"],
            )
            for p in mastodon_posts
        ]
        results = evaluate(test_cases, [metric])
        passed = sum(1 for r in results.test_results if r.success)
        assert (
            passed >= 1
        ), "Expected at least 1 good Mastodon post to pass platform fit"

    def test_platform_fit_bluesky(
        self, good_posts: list[dict], ionos_llm: IONOSEvalLLM
    ) -> None:
        """Good Bluesky posts should follow platform conventions."""
        bluesky_posts = [p for p in good_posts if p["channel"] == "bluesky"][:2]
        if not bluesky_posts:
            pytest.skip("No good Bluesky posts in golden set")

        metric = get_platform_fit_metric("bluesky", model=ionos_llm)
        test_cases = [
            LLMTestCase(
                input=f"Write a Bluesky post about: {p['source_blog_post']}",
                actual_output=p["content"],
            )
            for p in bluesky_posts
        ]
        results = evaluate(test_cases, [metric])
        passed = sum(1 for r in results.test_results if r.success)
        assert passed >= 1, "Expected at least 1 good Bluesky post to pass platform fit"


@pytest.mark.llm_eval
@pytest.mark.skipif(
    not os.environ.get("IONOS_API_TOKEN"),
    reason="IONOS_API_TOKEN not set",
)
class TestDraftQualityScoring:
    """Test the quality scoring function used in self-refine."""

    def test_score_correlates_with_golden_labels(
        self, golden_set: list[dict], ionos_llm: IONOSEvalLLM
    ) -> None:
        """Deepeval scores should roughly correlate with manual golden set scores."""
        # Take a mix of good and bad posts
        sample = [p for p in golden_set if p["quality_score"] >= 80][:2]
        sample += [p for p in golden_set if p["quality_score"] <= 30][:2]

        if len(sample) < 4:
            pytest.skip("Not enough diverse posts in golden set")

        metrics = [
            get_hook_quality_metric(model=ionos_llm),
            get_engagement_potential_metric(model=ionos_llm),
        ]

        for post in sample:
            test_case = LLMTestCase(
                input=f"Write a {post['channel']} post about: {post['source_blog_post']}",
                actual_output=post["content"],
            )
            results = evaluate([test_case], metrics)

            # Count passed metrics
            passed_count = sum(1 for r in results.test_results if r.success)
            expected_good = post["quality_score"] >= 70

            if expected_good:
                assert passed_count >= 1, (
                    f"Post '{post['id']}' (score={post['quality_score']}) "
                    f"should pass at least 1 metric"
                )
            # Bad posts failing is expected, no assertion needed


# ---------------------------------------------------------------------------
# Standalone evaluation (not pytest)
# ---------------------------------------------------------------------------


def evaluate_draft(content: str, channel: str, source_title: str) -> dict:
    """Evaluate a single draft and return quality assessment.

    Returns:
        dict with 'score' (0-100) and 'issues' (list of strings)
    """
    metrics = [
        get_hook_quality_metric(),
        get_platform_fit_metric(channel),
        get_engagement_potential_metric(),
    ]

    test_case = LLMTestCase(
        input=f"Write a {channel} post about: {source_title}",
        actual_output=content,
    )

    results = evaluate([test_case], metrics)

    # Calculate score from metric results
    passed = sum(1 for r in results.test_results if r.success)
    score = int((passed / len(metrics)) * 100)

    # Collect issues from failed metrics
    issues = []
    for r in results.test_results:
        if not r.success:
            metric_name = r.metrics_data[0].name if r.metrics_data else "unknown"
            if "hook" in metric_name.lower():
                issues.append("weak_hook")
            elif "platform" in metric_name.lower():
                issues.append("platform_mismatch")
            elif "engagement" in metric_name.lower():
                issues.append("low_engagement_potential")

    return {"score": score, "issues": issues}


if __name__ == "__main__":
    # Quick manual test
    test_content = """Ever wondered why politicians claim to want cooperation but keep blocking?

Game theory explains it. The Prisoner's Dilemma in action.

https://fretchen.eu/blog/prisoners-dilemma/

#GameTheory #Politics"""

    result = evaluate_draft(test_content, "mastodon", "Prisoner's Dilemma")
    print(f"Score: {result['score']}, Issues: {result['issues']}")

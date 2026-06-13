#!/usr/bin/env python3
"""Deploy growth-agent to Scaleway: build image, push to registry, apply OpenTofu."""


import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import dotenv_values

REQUIRED = [
    "SCW_ACCESS_KEY",
    "SCW_SECRET_KEY",
    "IONOS_API_TOKEN",
    "MASTODON_ACCESS_TOKEN",
    "BLUESKY_APP_PASSWORD",
    "S3_STATE_PREFIX_PROD",
    "LLM_PROVIDER",
]

_PROJECT_DIR = Path(__file__).resolve().parent.parent


def load_env(project_dir: Path = _PROJECT_DIR) -> dict[str, str]:
    """Load .env file; inline comments are stripped by dotenv_values."""
    return {k: v for k, v in dotenv_values(project_dir / ".env").items() if v is not None}


def validate_env(env: dict[str, str]) -> None:
    """Exit with a clear message if any required env vars are missing."""
    missing = [k for k in REQUIRED if not env.get(k)]
    if missing:
        sys.exit(f"Missing required env vars: {', '.join(missing)}")


def _run(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    extra_env: dict[str, str] | None = None,
) -> None:
    proc_env = os.environ.copy()
    if extra_env:
        proc_env.update(extra_env)
    subprocess.run(cmd, check=True, cwd=cwd, env=proc_env)


def _capture(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    extra_env: dict[str, str] | None = None,
) -> str:
    proc_env = os.environ.copy()
    if extra_env:
        proc_env.update(extra_env)
    result = subprocess.run(cmd, check=True, cwd=cwd, env=proc_env, capture_output=True, text=True)
    return result.stdout.strip()


def main() -> None:
    target_platform = os.environ.get("TARGET_PLATFORM", "linux/amd64")

    env = load_env()
    validate_env(env)

    # Pass only the vars OpenTofu needs — avoid exporting SCW_* directly, which
    # would trigger a "multiple variable sources" warning from the Scaleway provider.
    tf_env: dict[str, str] = {
        "AWS_ACCESS_KEY_ID": env["SCW_ACCESS_KEY"],
        "AWS_SECRET_ACCESS_KEY": env["SCW_SECRET_KEY"],
        "TF_VAR_scw_access_key": env["SCW_ACCESS_KEY"],
        "TF_VAR_scw_secret_key": env["SCW_SECRET_KEY"],
        "TF_VAR_ionos_api_token": env["IONOS_API_TOKEN"],
        "TF_VAR_mistral_api_key": env.get("MISTRAL_API_KEY", ""),
        "TF_VAR_llm_provider": env.get("LLM_PROVIDER", "ionos"),
        "TF_VAR_llm_model": env.get("LLM_MODEL", ""),
        "TF_VAR_mastodon_access_token": env["MASTODON_ACCESS_TOKEN"],
        "TF_VAR_bluesky_app_password": env["BLUESKY_APP_PASSWORD"],
        "TF_VAR_s3_state_prefix": env["S3_STATE_PREFIX_PROD"],
    }

    tf_bootstrap_dir = _PROJECT_DIR / "terraform-bootstrap"
    tf_dir = _PROJECT_DIR / "terraform"

    # Verify podman is available
    try:
        subprocess.run(["podman", "buildx", "version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        sys.exit(
            "ERROR: podman with buildx is required but not found.\n"
            "Install: https://podman.io/docs/installation"
        )

    # Init both Terraform roots
    _run(["tofu", "init", "-input=false"], cwd=tf_bootstrap_dir, extra_env=tf_env)
    _run(["tofu", "init", "-input=false"], cwd=tf_dir, extra_env=tf_env)

    # Step 1: Bootstrap registry namespace
    print("==> Bootstrapping registry namespace")
    _run(["tofu", "apply", "-auto-approve"], cwd=tf_bootstrap_dir, extra_env=tf_env)

    # Step 2: Get registry endpoint
    registry = _capture(
        ["tofu", "output", "-raw", "registry_endpoint"],
        cwd=tf_bootstrap_dir,
        extra_env=tf_env,
    )
    tag = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    image = f"{registry}/growth-agent:{tag}"
    image_latest = f"{registry}/growth-agent:latest"

    # Step 3: Authenticate with registry
    print(f"==> Logging in to registry: {registry}")
    subprocess.run(
        ["podman", "login", registry, "--username", env["SCW_ACCESS_KEY"], "--password-stdin"],
        input=env["SCW_SECRET_KEY"],
        text=True,
        check=True,
    )

    # Step 4: Build
    print(f"==> Building image: {image} (platform: {target_platform})")
    _run(
        [
            "podman", "build",
            "--platform", target_platform,
            "-t", image, "-t", image_latest,
            str(_PROJECT_DIR),
        ]
    )

    # Step 5: Push
    print("==> Pushing image")
    _run(["podman", "push", image])
    _run(["podman", "push", image_latest])

    # Step 6: Deploy container + cron
    print("==> Applying full OpenTofu config")
    _run(
        ["tofu", "apply", f"-var=registry_image={image}", "-auto-approve"],
        cwd=tf_dir,
        extra_env=tf_env,
    )

    print(f"==> Deployed: {image}")


if __name__ == "__main__":
    main()

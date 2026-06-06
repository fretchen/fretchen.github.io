#!/bin/bash
set -euo pipefail

# Usage: ./bin/deploy.sh
# Requires: podman with buildx, tofu, active Scaleway profile

# Target platform (override with TARGET_PLATFORM=linux/arm64 if needed)
TARGET_PLATFORM="${TARGET_PLATFORM:-linux/amd64}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env without bulk-exporting — prevents SCW_* from leaking into the
# Scaleway provider env and triggering a "multiple variable sources" warning.
if [ -f "$PROJECT_DIR/.env" ]; then
  _read_env() { grep "^$1=" "$PROJECT_DIR/.env" | cut -d= -f2-; }
  export AWS_ACCESS_KEY_ID="$(_read_env SCW_ACCESS_KEY)"
  export AWS_SECRET_ACCESS_KEY="$(_read_env SCW_SECRET_KEY)"
  export TF_VAR_scw_access_key="$(_read_env SCW_ACCESS_KEY)"
  export TF_VAR_scw_secret_key="$(_read_env SCW_SECRET_KEY)"
  export TF_VAR_ionos_api_token="$(_read_env IONOS_API_TOKEN)"
  export TF_VAR_mistral_api_key="$(_read_env MISTRAL_API_KEY)"
  export TF_VAR_llm_provider="$(_read_env LLM_PROVIDER)"
  export TF_VAR_llm_model="$(_read_env LLM_MODEL)"
  export TF_VAR_umami_api_key="$(_read_env UMAMI_API_KEY)"
  export TF_VAR_mastodon_access_token="$(_read_env MASTODON_ACCESS_TOKEN)"
  export TF_VAR_bluesky_app_password="$(_read_env BLUESKY_APP_PASSWORD)"
fi
TF_BOOTSTRAP_DIR="$PROJECT_DIR/terraform-bootstrap"
TF_DIR="$PROJECT_DIR/terraform"

# Verify podman is available
if ! podman buildx version &>/dev/null; then
  echo "ERROR: podman with buildx is required but not found."
  echo "Install podman: https://podman.io/docs/installation"
  exit 1
fi

# Initialize both Terraform roots.
cd "$TF_BOOTSTRAP_DIR"
tofu init -input=false
cd "$TF_DIR"
tofu init -input=false

# Step 1: Bootstrap registry namespace (full apply, no -target)
echo "==> Bootstrapping registry namespace"
cd "$TF_BOOTSTRAP_DIR"
tofu apply -auto-approve

# Step 2: Get registry endpoint from bootstrap output
REGISTRY=$(tofu output -raw registry_endpoint)
TAG="$(date +%Y%m%d-%H%M%S)"
IMAGE="$REGISTRY/growth-agent:$TAG"
IMAGE_LATEST="$REGISTRY/growth-agent:latest"

# Step 3: Authenticate with registry
echo "==> Logging in to registry: $REGISTRY"
echo "$(_read_env SCW_SECRET_KEY)" | podman login "$REGISTRY" \
  --username "$(_read_env SCW_ACCESS_KEY)" --password-stdin

# Step 4: Build with BuildKit
echo "==> Building image: $IMAGE (platform: $TARGET_PLATFORM)"
podman build --platform "$TARGET_PLATFORM" -t "$IMAGE" -t "$IMAGE_LATEST" "$PROJECT_DIR"

# Step 5: Push
echo "==> Pushing image"
podman push "$IMAGE"
podman push "$IMAGE_LATEST"

# Step 6: Deploy container + cron
echo "==> Applying full OpenTofu config"
cd "$TF_DIR"
tofu apply -var="registry_image=$IMAGE" -auto-approve

echo "==> Deployed: $IMAGE"

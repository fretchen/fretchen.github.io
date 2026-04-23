#!/bin/bash
set -euo pipefail

# Usage: ./bin/deploy.sh
# Requires: docker with buildx, tofu, active Scaleway profile

# Target platform (override with TARGET_PLATFORM=linux/arm64 if needed)
TARGET_PLATFORM="${TARGET_PLATFORM:-linux/amd64}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TF_BOOTSTRAP_DIR="$PROJECT_DIR/terraform-bootstrap"
TF_DIR="$PROJECT_DIR/terraform"

# Verify buildx is available
if ! docker buildx version &>/dev/null; then
  echo "ERROR: docker buildx is required but not found."
  echo "Install buildx: https://docs.docker.com/go/buildx/"
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

# Step 3: Build with BuildKit
echo "==> Building image: $IMAGE (platform: $TARGET_PLATFORM)"
docker buildx build --platform "$TARGET_PLATFORM" --load -t "$IMAGE" -t "$IMAGE_LATEST" "$PROJECT_DIR"

# Step 4: Push
echo "==> Pushing image"
docker push "$IMAGE"
docker push "$IMAGE_LATEST"

# Step 5: Deploy container + cron
echo "==> Applying full OpenTofu config"
cd "$TF_DIR"
tofu apply -var="registry_image=$IMAGE" -auto-approve

echo "==> Deployed: $IMAGE"

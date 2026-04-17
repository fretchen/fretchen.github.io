#!/bin/bash
set -euo pipefail

# Usage: ./bin/deploy.sh
# Requires: docker (Colima), tofu, SCW_ACCESS_KEY, SCW_SECRET_KEY

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TF_DIR="$PROJECT_DIR/terraform"

# Step 1: Ensure registry namespace exists (idempotent)
echo "==> Ensuring registry namespace exists"
cd "$TF_DIR"
tofu init -input=false
tofu apply -target=scaleway_registry_namespace.growth_agent -auto-approve

# Step 2: Get registry endpoint from tofu output
REGISTRY=$(tofu output -raw registry_endpoint 2>/dev/null || echo "rg.fr-par.scw.cloud/growth-agent")
TAG="$(date +%Y%m%d-%H%M%S)"
IMAGE="$REGISTRY/growth-agent:$TAG"
IMAGE_LATEST="$REGISTRY/growth-agent:latest"

# Step 3: Build
echo "==> Building image: $IMAGE"
docker build --platform linux/amd64 -t "$IMAGE" -t "$IMAGE_LATEST" "$PROJECT_DIR"

# Step 4: Push
echo "==> Pushing image"
docker push "$IMAGE"
docker push "$IMAGE_LATEST"

# Step 5: Deploy container + cron
echo "==> Applying full OpenTofu config"
tofu apply -var="registry_image=$IMAGE" -auto-approve

echo "==> Deployed: $IMAGE"

#!/bin/bash
set -euo pipefail

# Usage: ./bin/deploy.sh
# Requires: docker (Colima), tofu, SCW_ACCESS_KEY, SCW_SECRET_KEY

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Get registry endpoint from tofu state (or use default)
REGISTRY="${REGISTRY:-rg.fr-par.scw.cloud/growth-agent}"
TAG="$(date +%Y%m%d-%H%M%S)"
IMAGE="$REGISTRY/growth-agent:$TAG"
IMAGE_LATEST="$REGISTRY/growth-agent:latest"

echo "==> Building image: $IMAGE"
docker build --platform linux/amd64 -t "$IMAGE" -t "$IMAGE_LATEST" "$PROJECT_DIR"

echo "==> Pushing image"
docker push "$IMAGE"
docker push "$IMAGE_LATEST"

echo "==> Applying OpenTofu config"
cd "$PROJECT_DIR/terraform"
tofu apply -var="registry_image=$IMAGE" -auto-approve

echo "==> Deployed: $IMAGE"

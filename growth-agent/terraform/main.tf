terraform {
  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    bucket                      = "my-imagestore"
    key                         = "terraform/growth-agent.tfstate"
    region                      = "nl-ams"
    endpoints                   = { s3 = "https://s3.nl-ams.scw.cloud" }
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
  }
}

provider "scaleway" {}

# --- Serverless Container Namespace ---

resource "scaleway_container_namespace" "growth_agent" {
  name = "growth-agent"
}

# --- Container ---

resource "scaleway_container" "growth_agent" {
  name         = "growth-agent"
  namespace_id = scaleway_container_namespace.growth_agent.id

  registry_image = var.registry_image
  port           = 8080
  cpu_limit      = 560
  memory_limit   = 1024
  min_scale      = 0
  max_scale      = 1
  timeout        = 900
  privacy        = "private"
  deploy         = true

  environment_variables = {
    MASTODON_INSTANCE = var.mastodon_instance
    BLUESKY_HANDLE    = var.bluesky_handle
    UMAMI_WEBSITE_ID  = var.umami_website_id
    S3_BUCKET         = var.s3_bucket
    S3_STATE_PREFIX   = var.s3_state_prefix
  }

  secret_environment_variables = {
    IONOS_API_TOKEN       = var.ionos_api_token
    MASTODON_ACCESS_TOKEN = var.mastodon_access_token
    BLUESKY_APP_PASSWORD  = var.bluesky_app_password
    UMAMI_API_KEY         = var.umami_api_key
    SCW_ACCESS_KEY        = var.scw_access_key
    SCW_SECRET_KEY        = var.scw_secret_key
  }
}

# --- Cron Trigger (daily at 08:00 UTC) ---

resource "scaleway_container_cron" "daily" {
  container_id = scaleway_container.growth_agent.id
  schedule     = "0 8 * * *"
  args         = jsonencode({ source = "cron" })
}

# --- Outputs ---

output "container_url" {
  value       = scaleway_container.growth_agent.domain_name
  description = "The container endpoint URL"
}

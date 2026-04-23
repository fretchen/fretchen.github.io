terraform {
  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    bucket                      = "my-imagestore"
    key                         = "terraform/growth-agent-bootstrap.tfstate"
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

resource "scaleway_registry_namespace" "growth_agent" {
  name      = "growth-agent"
  is_public = false
}

output "registry_endpoint" {
  value       = scaleway_registry_namespace.growth_agent.endpoint
  description = "Container registry endpoint for docker push"
}
variable "registry_image" {
  description = "Full registry image path including tag (set at deploy time)"
  type        = string
  default     = "placeholder"
}

variable "umami_website_id" {
  description = "Umami website ID"
  type        = string
  default     = "e41ae7d9-a536-426d-b40e-f2488b11bf95"
}

variable "ionos_api_token" {
  description = "IONOS AI Model Hub API token"
  type        = string
  sensitive   = true
}

variable "mastodon_access_token" {
  description = "Mastodon OAuth access token"
  type        = string
  sensitive   = true
}

variable "bluesky_app_password" {
  description = "Bluesky app password"
  type        = string
  sensitive   = true
}

variable "umami_api_key" {
  description = "Umami Cloud API key"
  type        = string
  sensitive   = true
}

variable "scw_access_key" {
  description = "Scaleway access key (for S3)"
  type        = string
  sensitive   = true
}

variable "scw_secret_key" {
  description = "Scaleway secret key (for S3)"
  type        = string
  sensitive   = true
}

# --- Non-sensitive configuration ---

variable "s3_bucket" {
  description = "S3 bucket name for state storage"
  type        = string
  default     = "my-imagestore"
}

variable "s3_state_prefix" {
  description = "S3 prefix for growth-agent state files"
  type        = string
  default     = "growth-agent/"
}

variable "mastodon_instance" {
  description = "Mastodon instance URL"
  type        = string
  default     = "https://mastodon.social"
}

variable "bluesky_handle" {
  description = "Bluesky handle"
  type        = string
  default     = "fretchen.eu"
}

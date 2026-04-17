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

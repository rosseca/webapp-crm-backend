# Project Configuration
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_number" {
  description = "GCP Project Number"
  type        = string
}

variable "region" {
  description = "GCP Region for deployment"
  type        = string
  default     = "europe-west1"
}

variable "environment" {
  description = "Environment name (staging, production, etc.)"
  type        = string
  default     = "staging"
}

# Cloud Run Configuration
variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "leadtech-crm-backend"
}

variable "artifact_repo" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "leadtech-crm"
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "cpu" {
  description = "CPU limit for Cloud Run container"
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Memory limit for Cloud Run container"
  type        = string
  default     = "512Mi"
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "allow_unauthenticated" {
  description = "Allow unauthenticated access to Cloud Run service"
  type        = bool
  default     = true
}

# Environment Variables (passed from Cloud Build substitutions)
variable "cors_origin" {
  description = "CORS origin URL (frontend URL)"
  type        = string
}

variable "auth_provider" {
  description = "Auth provider type (baas, firebase, prisma, api)"
  type        = string
  default     = "baas"
}

variable "chatai_api_url" {
  description = "ChatAI BaaS API URL"
  type        = string
}

variable "chatai_api_timeout" {
  description = "ChatAI API timeout in milliseconds"
  type        = string
  default     = "10000"
}

variable "firebase_web_api_key" {
  description = "Firebase Web API Key"
  type        = string
}

variable "secret_env_vars" {
  description = "Secret environment variables from Secret Manager"
  type = map(object({
    secret_name = string
    version     = string
  }))
  default = {}
}

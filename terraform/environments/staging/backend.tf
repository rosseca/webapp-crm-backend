terraform {
  required_version = ">= 1.0.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 5.0.0"
    }
  }

  backend "gcs" {
    # Bucket is configured dynamically via -backend-config in CI/CD
    # Use: terraform init -backend-config="bucket=${PROJECT_ID}-tf-state"
    prefix = "staging/state"
  }
}

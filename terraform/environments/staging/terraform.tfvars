# Project Configuration
project_id     = "wa-aichat-test"
project_number = "1038920093558"
region         = "europe-west1"
environment    = "staging"

# Cloud Run Configuration
service_name  = "leadtech-crm-backend"
artifact_repo = "leadtech-crm"
image_tag     = "latest"

# Resource Configuration
cpu           = "1"
memory        = "512Mi"
min_instances = 0
max_instances = 10

# Access Configuration
allow_unauthenticated = true

# Environment Variables are passed from Cloud Build substitutions:
# - _CORS_ORIGIN
# - _AUTH_PROVIDER
# - _CHATAI_API_URL
# - _CHATAI_API_TIMEOUT
# - _FIREBASE_WEB_API_KEY

# Secret Environment Variables (from Secret Manager)
# Uncomment and configure as needed:
# secret_env_vars = {
#   FIREBASE_CREDENTIALS = {
#     secret_name = "firebase-admin-credentials"
#     version     = "latest"
#   }
# }

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

# Environment Variables (PORT is reserved by Cloud Run, don't set it here)
env_vars = {
  NODE_ENV             = "staging"
  CORS_ORIGIN          = "https://leadtech-crm-ew.a.run.app"
  AUTH_PROVIDER        = "baas"
  CHATAI_API_URL       = "https://europe-west2-wa-aichat-test.cloudfunctions.net/api"
  CHATAI_API_TIMEOUT   = "10000"
  FIREBASE_WEB_API_KEY = "AIzaSyAzU3bw-oi0ewROzEFdK00hX8ghjjfQ2BI"
}

# Secret Environment Variables (from Secret Manager)
# Uncomment and configure as needed:
# secret_env_vars = {
#   FIREBASE_CREDENTIALS = {
#     secret_name = "firebase-admin-credentials"
#     version     = "latest"
#   }
#   DATABASE_URL = {
#     secret_name = "database-url"
#     version     = "latest"
#   }
# }

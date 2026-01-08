# Provider configurations
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "apis" {
  provider = google-beta
  for_each = toset([
    "serviceusage.googleapis.com",       # Service Usage API
    "run.googleapis.com",                # Cloud Run service
    "cloudbuild.googleapis.com",         # Required for deployments
    "artifactregistry.googleapis.com",   # Container image storage
    "cloudresourcemanager.googleapis.com", # Resource management
    "secretmanager.googleapis.com",      # Secret storage
    "firebase.googleapis.com",           # Firebase services
    "iam.googleapis.com",                # IAM management
  ])

  project = var.project_id
  service = each.key

  disable_on_destroy = false
}

# Create Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "crm_repo" {
  provider = google-beta

  location      = var.region
  repository_id = var.artifact_repo
  description   = "Docker repository for LeadTech CRM Backend"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

# Grant Cloud Build (Compute Engine default SA) permission to push to Artifact Registry
resource "google_artifact_registry_repository_iam_member" "cloudbuild_writer" {
  provider = google-beta

  project    = var.project_id
  location   = var.region
  repository = google_artifact_registry_repository.crm_repo.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"

  depends_on = [google_artifact_registry_repository.crm_repo]
}

# Create service account for Cloud Run
resource "google_service_account" "crm_backend_sa" {
  account_id   = "${var.environment}-crm-backend-sa"
  display_name = "${var.environment}-crm-backend-sa"
  project      = var.project_id

  depends_on = [google_project_service.apis]
}

# IAM roles for service account
resource "google_project_iam_member" "secret_manager_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.crm_backend_sa.email}"

  depends_on = [google_service_account.crm_backend_sa]
}

resource "google_project_iam_member" "logging_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.crm_backend_sa.email}"

  depends_on = [google_service_account.crm_backend_sa]
}

resource "google_project_iam_member" "firebase_admin" {
  project = var.project_id
  role    = "roles/firebase.admin"
  member  = "serviceAccount:${google_service_account.crm_backend_sa.email}"

  depends_on = [google_service_account.crm_backend_sa]
}

resource "google_project_iam_member" "datastore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.crm_backend_sa.email}"

  depends_on = [google_service_account.crm_backend_sa]
}

# Cloud Run service
resource "google_cloud_run_v2_service" "crm_backend" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.crm_backend_sa.email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_repo}/${var.service_name}:${var.image_tag}"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      # Environment variables
      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      # Environment variables from secrets
      dynamic "env" {
        for_each = var.secret_env_vars
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value.secret_name
              version = env.value.version
            }
          }
        }
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 3000
        }
        initial_delay_seconds = 10
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 3000
        }
        timeout_seconds   = 3
        period_seconds    = 30
        failure_threshold = 3
      }
    }

    timeout = "300s"
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.crm_repo,
    google_service_account.crm_backend_sa,
    google_project_iam_member.secret_manager_accessor
  ]
}

# Allow unauthenticated access (public API) - Optional, remove if you want authenticated access only
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  count = var.allow_unauthenticated ? 1 : 0

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.crm_backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"

  depends_on = [google_cloud_run_v2_service.crm_backend]
}

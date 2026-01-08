output "service_url" {
  description = "URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.crm_backend.uri
}

output "service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_v2_service.crm_backend.name
}

output "container_registry" {
  description = "Google Container Registry URL"
  value       = "gcr.io/${var.project_id}/${var.service_name}"
}

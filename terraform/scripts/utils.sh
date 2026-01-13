#!/bin/bash

# Utility functions for Cloud Build steps

# Run a command and exit with error if it fails
run_or_fail() {
  echo "Running: $*"
  "$@"
  local status=$?
  if [ $status -ne 0 ]; then
    echo "ERROR: Command failed with status $status: $*"
    exit $status
  fi
  return $status
}

# Send notification to Google Chat webhook
notify_google_chat() {
  local status="$1"
  local webhook_url="${_CHAT_WEBHOOK_URL:-}"

  if [ -z "$webhook_url" ]; then
    echo "No Google Chat webhook URL configured, skipping notification"
    return 0
  fi

  local color
  local icon
  if [ "$status" = "SUCCESS" ]; then
    color="#00FF00"
    icon="✅"
  else
    color="#FF0000"
    icon="❌"
  fi

  local message=$(cat <<EOF
{
  "cards": [{
    "header": {
      "title": "${icon} Build ${status}",
      "subtitle": "${REPO_NAME:-unknown}"
    },
    "sections": [{
      "widgets": [
        {
          "keyValue": {
            "topLabel": "Repository",
            "content": "${REPO_FULL_NAME:-unknown}"
          }
        },
        {
          "keyValue": {
            "topLabel": "Branch",
            "content": "${BRANCH_NAME:-unknown}"
          }
        },
        {
          "keyValue": {
            "topLabel": "Commit",
            "content": "${SHORT_SHA:-unknown}"
          }
        },
        {
          "keyValue": {
            "topLabel": "Environment",
            "content": "${_ENVIRONMENT:-unknown}"
          }
        },
        {
          "buttons": [{
            "textButton": {
              "text": "View Build",
              "onClick": {
                "openLink": {
                  "url": "https://console.cloud.google.com/cloud-build/builds/${BUILD_ID}?project=${PROJECT_ID}"
                }
              }
            }
          }]
        }
      ]
    }]
  }]
}
EOF
)

  curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$message" \
    "$webhook_url" || echo "Warning: Failed to send Google Chat notification"
}

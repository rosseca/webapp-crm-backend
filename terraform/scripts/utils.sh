#!/bin/bash

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "Error: utils.sh script file source is required."
  exit 1
fi

notify_google_chat() {
  local status="$1"
  local title="Deploy Status Unknown"

  if [ "$status" = "SUCCESS" ]; then
    title="Deploy Succeed"
  elif [ "$status" = "FAIL" ]; then
    title="Deploy Failed"
  fi

  local environment="${_ENVIRONMENT:-unknown}"
  local repo_name="${REPO_NAME:-unknown}"
  local branch_name="${BRANCH_NAME:-unknown}"
  local short_sha="${SHORT_SHA:-unknown}"

  local build_url="https://console.cloud.google.com/cloud-build/builds;region=${LOCATION}/${BUILD_ID}?project=${PROJECT_ID}"
  local branch_url="https://github.com/${REPO_FULL_NAME}/tree/${branch_name}"
  local commit_url="https://github.com/${REPO_FULL_NAME}/commit/${short_sha}"

  local preview_url=""
  case "$environment" in
    production)
      preview_url="https://api.crm.leadtech.com"
      ;;
    staging)
      preview_url="https://stage.api.crm.leadtech.com"
      ;;
    test)
      preview_url="https://test.api.crm.leadtech.com"
      ;;
    qa)
      preview_url="https://qa.api.crm.leadtech.com"
      ;;
  esac

  echo "Webhook URL: ${_CHAT_WEBHOOK_URL}"

  curl -X POST -H "Content-Type: application/json" \
    -d @- "${_CHAT_WEBHOOK_URL}" <<-EOF
{
  "cardsV2": [
    {
      "card": {
        "header": {
          "title": "$title",
          "subtitle": "[$environment] $repo_name"
        },
        "sections": [
          {
            "widgets": [
              {
                "chipList": {
                  "chips": [
                    {
                      "label": "Preview",
                      "icon": { "materialIcon": { "name": "preview" } },
                      "onClick": { "openLink": { "url": "$preview_url" } }
                    },
                    {
                      "label": "Build",
                      "icon": { "materialIcon": { "name": "deployed_code_history" } },
                      "onClick": { "openLink": { "url": "$build_url" } }
                    },
                    {
                      "label": "$branch_name",
                      "icon": { "materialIcon": { "name": "graph_1" } },
                      "onClick": { "openLink": { "url": "$branch_url" } }
                    },
                    {
                      "label": "$short_sha",
                      "icon": { "materialIcon": { "name": "commit" } },
                      "onClick": { "openLink": { "url": "$commit_url" } }
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    }
  ]
}
EOF
}

run_or_fail() {
  "$@" || {
    echo "COMMAND FAILED: $*"
    notify_google_chat "FAIL"
    touch /workspace/step_failed.txt
    exit 1
  }
}

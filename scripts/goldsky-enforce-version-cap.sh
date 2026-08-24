#!/usr/bin/env bash
# Enforce Goldsky always-on version budget for one subgraph (RAI-1962).
#
# Usage:
#   scripts/goldsky-enforce-version-cap.sh <subgraph-name> [--keep <version>] [--max 2] [--check-only]
#
# Behavior:
#   - Lists deployments for <subgraph-name>
#   - Deletes oldest versions until at most --max remain (keeps --keep first when set)
#   - Fails if more than --max versions remain after cleanup
#   - Fails if exactly 2 versions have been overlapping for >24h (migration forgotten)
#
# Requires goldsky on PATH and CLI auth (goldsky login --token … or --token / GOLDSKY_TOKEN).

set -euo pipefail

SUBGRAPH_NAME=""
KEEP_VERSION=""
MAX_VERSIONS=2
CHECK_ONLY=0
MIGRATION_HOURS=24
GOLDSKY_TOKEN_ARG=()

usage() {
  cat <<'EOF'
Usage: goldsky-enforce-version-cap.sh <subgraph-name> [options]

Options:
  --keep <version>   Prefer keeping this version (e.g. the just-deployed git SHA)
  --max <n>          Max live versions to allow (default: 2)
  --migration-hours  Overlap window before alerting (default: 24)
  --check-only       Do not delete; only verify cap + migration window
  --token <token>    Goldsky API token (else CLI login / GOLDSKY_TOKEN)
  -h, --help         Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --keep)
      KEEP_VERSION="${2:?}"
      shift 2
      ;;
    --max)
      MAX_VERSIONS="${2:?}"
      shift 2
      ;;
    --migration-hours)
      MIGRATION_HOURS="${2:?}"
      shift 2
      ;;
    --check-only)
      CHECK_ONLY=1
      shift
      ;;
    --token)
      GOLDSKY_TOKEN_ARG=(--token "${2:?}")
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      if [[ -z "$SUBGRAPH_NAME" ]]; then
        SUBGRAPH_NAME="$1"
        shift
      else
        echo "Unexpected argument: $1" >&2
        usage >&2
        exit 2
      fi
      ;;
  esac
done

if [[ -z "$SUBGRAPH_NAME" ]]; then
  usage >&2
  exit 2
fi

if [[ -n "${GOLDSKY_TOKEN:-}" && ${#GOLDSKY_TOKEN_ARG[@]} -eq 0 ]]; then
  GOLDSKY_TOKEN_ARG=(--token "$GOLDSKY_TOKEN")
fi

goldsky_cmd() {
  goldsky "$@" "${GOLDSKY_TOKEN_ARG[@]}" --color=false
}

# Print version|epoch rows (epoch 0 if unknown).
list_version_rows() {
  local raw
  raw="$(goldsky_cmd subgraph list "$SUBGRAPH_NAME" --filter deployments 2>&1 || true)"
  printf '%s\n' "$raw" >&2

  local versions
  versions="$(
    printf '%s\n' "$raw" |
      sed 's/\x1b\[[0-9;]*m//g' |
      grep -oE "${SUBGRAPH_NAME}/[^[:space:]│|]+" |
      sed "s|^${SUBGRAPH_NAME}/||" |
      sed 's/[^A-Za-z0-9._-]//g' |
      awk 'NF' |
      sort -u
  )"

  if [[ -z "$versions" ]]; then
    versions="$(
      printf '%s\n' "$raw" |
        sed 's/\x1b\[[0-9;]*m//g' |
        awk -v name="$SUBGRAPH_NAME" '
          $1 == name && NF >= 2 { print $2 }
        ' |
        sed 's/[^A-Za-z0-9._-]//g' |
        awk 'NF' |
        sort -u
    )"
  fi

  local version detail created epoch
  while IFS= read -r version; do
    [[ -z "$version" ]] && continue
    epoch=0
    detail="$(goldsky_cmd subgraph list "${SUBGRAPH_NAME}/${version}" --filter deployments 2>/dev/null || true)"
    created="$(
      printf '%s\n' "$detail" |
        sed 's/\x1b\[[0-9;]*m//g' |
        grep -oiE '(created([ _]at)?|created):[[:space:]]*[0-9T:Z.+-]+' |
        head -n1 |
        grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}[^[:space:]]*' ||
        true
    )"
    if [[ -n "$created" ]]; then
      epoch="$(date -u -d "$created" +%s 2>/dev/null || echo 0)"
    fi
    printf '%s|%s\n' "$version" "$epoch"
  done <<<"$versions"
}

sort_rows_newest_first() {
  local keep="${1:-}"
  awk -F'|' -v keep="$keep" '
    {
      version=$1
      epoch=$2+0
      priority=(keep != "" && version == keep) ? 2 : 0
      printf "%d %020d %s|%s\n", priority, epoch, version, epoch
    }
  ' | sort -k1,1nr -k2,2nr -k3,3r | awk '{ print $3 }'
}

delete_version() {
  local version="$1"
  echo "Deleting ${SUBGRAPH_NAME}/${version}"
  goldsky_cmd subgraph delete "${SUBGRAPH_NAME}/${version}" --force
}

echo "==> Enforcing version cap for ${SUBGRAPH_NAME} (max=${MAX_VERSIONS}, keep=${KEEP_VERSION:-none}, check_only=${CHECK_ONLY})"

ROWS=()
while IFS= read -r row; do
  [[ -n "$row" ]] && ROWS+=("$row")
done < <(list_version_rows | sort_rows_newest_first "$KEEP_VERSION")

if [[ ${#ROWS[@]} -eq 0 ]]; then
  echo "No deployments found for ${SUBGRAPH_NAME}."
  exit 0
fi

echo "Live versions (${#ROWS[@]}):"
for row in "${ROWS[@]}"; do
  echo "  - ${SUBGRAPH_NAME}/${row%%|*} (created_epoch=${row##*|})"
done

if [[ $CHECK_ONLY -eq 0 && ${#ROWS[@]} -gt $MAX_VERSIONS ]]; then
  for ((i = MAX_VERSIONS; i < ${#ROWS[@]}; i++)); do
    delete_version "${ROWS[$i]%%|*}"
  done
  ROWS=()
  while IFS= read -r row; do
    [[ -n "$row" ]] && ROWS+=("$row")
  done < <(list_version_rows | sort_rows_newest_first "$KEEP_VERSION")
  echo "After cleanup (${#ROWS[@]}):"
  for row in "${ROWS[@]}"; do
    echo "  - ${SUBGRAPH_NAME}/${row%%|*} (created_epoch=${row##*|})"
  done
fi

if [[ ${#ROWS[@]} -gt $MAX_VERSIONS ]]; then
  echo "::error title=Goldsky version cap exceeded::${SUBGRAPH_NAME} has ${#ROWS[@]} live versions; max allowed is ${MAX_VERSIONS}. Delete stale versions (goldsky subgraph delete ${SUBGRAPH_NAME}/<version> -f)."
  exit 1
fi

# Migration overlap alert: two live versions and the newer one is already >24h old
# (they have been billable side-by-side for more than a day).
if [[ ${#ROWS[@]} -eq 2 ]]; then
  newer_epoch="${ROWS[0]##*|}"
  older_epoch="${ROWS[1]##*|}"
  now_epoch="$(date -u +%s)"
  limit_seconds=$((MIGRATION_HOURS * 3600))

  if [[ "$newer_epoch" -gt 0 ]]; then
    age=$((now_epoch - newer_epoch))
    if [[ "$age" -gt "$limit_seconds" ]]; then
      echo "::error title=Goldsky migration overlap >${MIGRATION_HOURS}h::${SUBGRAPH_NAME} still has 2 live versions after ${MIGRATION_HOURS}h (${ROWS[0]%%|*} and ${ROWS[1]%%|*}). Delete the old version to stop double billing."
      exit 1
    fi
  elif [[ "$older_epoch" -gt 0 ]]; then
    age=$((now_epoch - older_epoch))
    if [[ "$age" -gt "$limit_seconds" ]]; then
      echo "::error title=Goldsky migration overlap >${MIGRATION_HOURS}h::${SUBGRAPH_NAME} still has 2 live versions and the older one is >${MIGRATION_HOURS}h old (${ROWS[1]%%|*}). Delete the old version to stop double billing."
      exit 1
    fi
  elif [[ -z "$KEEP_VERSION" ]]; then
    # Scheduled check without timestamps: fail closed so overdue migrations
    # cannot hide. Deploy runs pass --keep for the fresh version and skip this.
    echo "::error title=Goldsky migration overlap unknown age::${SUBGRAPH_NAME} has 2 live versions and creation times could not be parsed. Delete the old version or re-run deploy cleanup with timestamps available."
    exit 1
  else
    echo "Two versions present; newer is the just-deployed keep=${KEEP_VERSION}. Migration window OK."
  fi
fi

echo "Version cap OK for ${SUBGRAPH_NAME}."

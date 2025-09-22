#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> DataAccessHub startup: backend :8003, frontend :3003"

FORCE_KILL=false
DETACHED=false
RESET_DB=false
# Seed initial data (admin/admin123) when DB is fresh or when forced via --seed
SEED=false
# Defaults per user request
BACKEND_PORT=8003
FRONTEND_PORT=3003
while [ $# -gt 0 ]; do
  case "$1" in
    --force)
      FORCE_KILL=true; shift ;;
    --detached)
      DETACHED=true; shift ;;
    --seed)
      SEED=true; shift ;;
    --reset-db)
      RESET_DB=true; shift ;;
    --backend)
      BACKEND_PORT="$2"; shift 2 ;;
    --frontend)
      FRONTEND_PORT="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "Error: '$1' is required." >&2; exit 1; }; }

need_cmd node
need_cmd npm
need_cmd lsof

# Pick python
PY=python3
command -v python3 >/dev/null 2>&1 || PY=python
need_cmd "$PY"

# Resolve virtualenv to use
VENV_PATH=""
if [ -f "$DIR/backend/.venv/bin/activate" ]; then
  VENV_PATH="$DIR/backend/.venv"
elif [ -f "$DIR/venv/bin/activate" ]; then
  VENV_PATH="$DIR/venv"
else
  VENV_PATH="$DIR/venv"
  echo "==> Creating Python venv at $VENV_PATH"
  "$PY" -m venv "$VENV_PATH"
fi

source "$VENV_PATH/bin/activate"
VENV_PY="$VENV_PATH/bin/python"
VENV_PIP="$VENV_PATH/bin/pip"

# Ensure packaging basics are present (for Python 3.13 environments)
echo "==> Ensuring pip/setuptools/wheel"
"$VENV_PIP" install -q --upgrade pip setuptools wheel || true

# Ensure required Python modules are present
need_py_mod() { "$VENV_PY" -c "import $1" >/dev/null 2>&1; }
NEED_INSTALL=false
for mod in django corsheaders drf_yasg rest_framework rest_framework_simplejwt; do
  if ! need_py_mod "$mod"; then
    NEED_INSTALL=true
  fi
done
if $NEED_INSTALL; then
  echo "==> Installing backend Python dependencies"
  if [ -f "$DIR/requirements-dev.txt" ]; then
    echo "    Using requirements-dev.txt (SQLite dev)"
    "$VENV_PIP" install -q -r "$DIR/requirements-dev.txt"
  elif [ -f "$DIR/requirements.txt" ]; then
    "$VENV_PIP" install -q -r "$DIR/requirements.txt"
  else
    echo "Warning: requirements file not found; skipping install" >&2
  fi
fi

ensure_port_free() {
  local port="$1"; shift
  local label="$1"; shift
  local expected_hint="$1"; shift || true
  local pids
  pids=$(lsof -ti tcp:"$port" || true)
  if [ -n "$pids" ]; then
    echo "!! Port $port in use for $label"
    if $FORCE_KILL; then
      echo "   --force set: killing PIDs: $pids"
      kill -9 $pids || true
      sleep 1
    else
      echo "   Tip: close the process using $port or run with --force."
      echo "   Expected: $expected_hint"
      exit 1
    fi
  fi
}

# Kill any existing servers before migrating (prevents stale Anaconda server)
ensure_port_free "$BACKEND_PORT" "backend" "Django runserver on $BACKEND_PORT"
ensure_port_free "$FRONTEND_PORT" "frontend" "Next.js dev server on $FRONTEND_PORT"

echo "==> Applying migrations"
pushd "$DIR/backend" >/dev/null
# Track whether DB existed before migration
DB_FILE="$DIR/backend/db.sqlite3"
DB_WAS_PRESENT=false
[ -f "$DB_FILE" ] && DB_WAS_PRESENT=true
if $RESET_DB && [ -f "$DB_FILE" ]; then
  echo "==> --reset-db requested: removing $DB_FILE"
  rm -f "$DB_FILE"
  DB_WAS_PRESENT=false
fi
"$VENV_PY" manage.py migrate --noinput
MIGRATE_STATUS=$?
if [ $MIGRATE_STATUS -ne 0 ]; then
  echo "Migration failed. Output (last 200 lines):"
  tail -n 200 "$DIR/backend/backend.log" 2>/dev/null || true
  exit $MIGRATE_STATUS
fi
popd >/dev/null

wait_for_port() {
  local port="$1"; shift
  local label="$1"; shift
  local timeout="${1:-25}"; shift || true
  local i=0
  while [ $i -lt "$timeout" ]; do
    if lsof -iTCP -sTCP:LISTEN -nP | grep -q ":$port "; then
      return 0
    fi
    sleep 1; i=$((i+1))
  done
  echo "Timeout waiting for $label on port $port" >&2
  return 1
}

# Ensure admin superuser exists (and mark approved if model supports it)
echo "==> Ensuring admin superuser exists"
pushd "$DIR/backend" >/dev/null
"$VENV_PY" manage.py shell -c "from django.contrib.auth import get_user_model; U=get_user_model(); u=U.objects.filter(username='admin').first();\n\
import sys;\n\
\nif not u:\n\
    u=U.objects.create_superuser(username='admin', email='admin@dataaccesshub.local', password='admin123')\n\
else:\n\
    changed=False\n\
    \n    \n\
    
\n\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
    
\
if not u.is_superuser:\n\
    u.is_superuser=True; changed=True\n\
if not u.is_staff:\n\
    u.is_staff=True; changed=True\n\
\n\
if hasattr(u, 'is_approved') and not u.is_approved:\n\
    u.is_approved=True; changed=True\n\
if changed: u.save(); print('Updated admin flags')\n\
print('Admin OK:', u.username)" || true
popd >/dev/null

# Start backend on 8001
mkdir -p "$DIR/backend"
BACKEND_LOG="$DIR/backend/backend.log"
echo "==> Starting backend at http://localhost:$BACKEND_PORT (log: $BACKEND_LOG)"
pushd "$DIR/backend" >/dev/null
nohup "$VENV_PY" manage.py runserver "$BACKEND_PORT" >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
popd >/dev/null

# Confirm backend port is open or show log then exit
if ! wait_for_port "$BACKEND_PORT" "backend" 20; then
  echo "--- backend log (last 120 lines) ---"
  tail -n 120 "$BACKEND_LOG" || true
  exit 1
fi

# Frontend deps
echo "==> Preparing frontend dependencies"
if [ ! -d "$DIR/frontend/node_modules" ]; then
  pushd "$DIR/frontend" >/dev/null
  npm ci
  popd >/dev/null
fi

# Start frontend on 3001 with API pointing to backend :8001
FRONTEND_LOG="$DIR/frontend/frontend.log"
echo "==> Starting frontend at http://localhost:$FRONTEND_PORT (log: $FRONTEND_LOG)"
pushd "$DIR/frontend" >/dev/null
export NEXT_PUBLIC_API_URL="http://localhost:$BACKEND_PORT/api/v1"
# Install deps if needed (fallback to npm install if ci fails)
if [ ! -d node_modules ]; then
  npm ci || npm install
fi
nohup npm run dev -- -p "$FRONTEND_PORT" >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
popd >/dev/null

# Confirm frontend port is open or show log then exit
if ! wait_for_port "$FRONTEND_PORT" "frontend" 25; then
  echo "--- frontend log (last 160 lines) ---"
  tail -n 160 "$FRONTEND_LOG" || true
  kill "$BACKEND_PID" >/dev/null 2>&1 || true
  exit 1
fi

cleanup() {
  printf "\n==> Shutting down (PIDs: %s %s)\n" "$BACKEND_PID" "$FRONTEND_PID"
  kill "$BACKEND_PID" "$FRONTEND_PID" >/dev/null 2>&1 || true
}
if ! $DETACHED; then
  trap cleanup EXIT INT TERM
fi

printf "\n✅ Backend:  http://localhost:%s/\n" "$BACKEND_PORT"
printf "✅ Frontend: http://localhost:%s/\n" "$FRONTEND_PORT"
printf "   Logs: %s, %s\n" "$BACKEND_LOG" "$FRONTEND_LOG"
if $DETACHED; then
  printf "   Mode: detached (script will exit without stopping processes)\n"
else
  printf "   Stop: press Ctrl+C\n"
fi

# Keep script attached to processes (unless detached)
if ! $DETACHED; then
  wait "$BACKEND_PID" "$FRONTEND_PID" || true
else
  # In detached mode, do not kill processes on exit
  trap - EXIT INT TERM
fi

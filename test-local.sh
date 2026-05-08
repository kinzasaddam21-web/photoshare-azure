#!/usr/bin/env bash
# Smoke test the running stack
# Usage: ./test-local.sh

set -e

BASE_AUTH="http://localhost:8001"
BASE_INT="http://localhost:8002"

echo "=== 1. Health checks ==="
curl -fsS $BASE_AUTH/health && echo
curl -fsS $BASE_INT/health && echo

echo ""
echo "=== 2. Login as admin ==="
TOKEN=$(curl -fsS -X POST $BASE_AUTH/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token acquired: ${TOKEN:0:30}..."

echo ""
echo "=== 3. List images (empty initially) ==="
curl -fsS $BASE_AUTH/images | python3 -m json.tool

echo ""
echo "=== 4. Search (empty) ==="
curl -fsS "$BASE_INT/search" | python3 -m json.tool

echo ""
echo "=== 5. Verify token ==="
curl -fsS $BASE_AUTH/auth/verify -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "✓ All checks passed"

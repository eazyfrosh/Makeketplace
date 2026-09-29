#!/usr/bin/env python3
import hashlib, hmac, json, os, time, urllib.error, urllib.request, uuid

BASE = os.environ.get("CONNECTOR_TEST_URL", "http://127.0.0.1:8787").rstrip("/")
SECRET = os.environ["RESELLERCLUB_CONNECTOR_SECRET"].encode()

def call(path, payload):
    body = json.dumps(payload, separators=(",", ":")).encode(); timestamp = str(int(time.time())); nonce = str(uuid.uuid4())
    signature = hmac.new(SECRET, timestamp.encode() + b"\n" + nonce.encode() + b"\n" + body, hashlib.sha256).hexdigest()
    request = urllib.request.Request(BASE + path, data=body, method="POST", headers={"Content-Type": "application/json", "X-EazyTool-Timestamp": timestamp, "X-EazyTool-Nonce": nonce, "X-EazyTool-Signature": signature})
    try:
        with urllib.request.urlopen(request, timeout=30) as response: return response.status, json.loads(response.read())
    except urllib.error.HTTPError as error: return error.code, json.loads(error.read())

for path, payload in [
    ("/v1/domains/availability", {"domain": "eazytool-connector-test-2026.com"}),
    ("/v1/domains/price", {"domain": "eazytool-connector-test-2026.com", "years": 1}),
    ("/v1/domains/buyers/ensure", {"registrant": {}}),
]:
    status, response = call(path, payload)
    print(path, status, response.get("status") or response.get("currency") or response.get("code"))

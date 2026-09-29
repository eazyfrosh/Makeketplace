#!/usr/bin/env python3
"""HMAC-authenticated, allowlisted EazyTool registrar connector."""
import hashlib, hmac, json, os, re, threading, time
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from connector import ConnectorError, dispatch

SECRET = os.environ.get("RESELLERCLUB_CONNECTOR_SECRET", "").encode(); MAX_BODY, MAX_SKEW_SECONDS, MAX_REQUESTS_PER_MINUTE = 16384, 300, 120
NONCE_RE = re.compile(r"^[a-f0-9-]{20,80}$", re.I)
ROUTES = {"/v1/domains/availability": "availability", "/v1/domains/price": "price", "/v1/domains/buyers/ensure": "ensure_buyer", "/v1/domains/register": "register", "/v1/domains/status": "status", "/v1/domains/nameservers": "nameservers", "/v1/domains/dns/list": "dns_list", "/v1/domains/dns/create": "dns_create", "/v1/domains/dns/update": "dns_update", "/v1/domains/dns/remove": "dns_remove", "/v1/domains/renew": "renew"}
seen_nonces, request_times, lock = {}, deque(), threading.Lock()

class Handler(BaseHTTPRequestHandler):
    server_version = "EazyToolConnector/2.0"
    def log_message(self, message, *args): print("connector", self.address_string(), message % args, flush=True)
    def send_json(self, status, payload):
        encoded = json.dumps(payload, separators=(",", ":")).encode(); self.send_response(status); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(encoded))); self.send_header("Cache-Control", "no-store"); self.send_header("X-Content-Type-Options", "nosniff"); self.end_headers(); self.wfile.write(encoded)
    def do_GET(self): self.send_json(404, {"ok": False, "code": "NOT_FOUND"})
    def do_POST(self):
        operation = ROUTES.get(self.path)
        if not operation: return self.send_json(404, {"ok": False, "code": "NOT_FOUND"})
        try: length = int(self.headers.get("Content-Length", "0"))
        except ValueError: return self.send_json(400, {"ok": False, "code": "INVALID_REQUEST"})
        if length < 2 or length > MAX_BODY: return self.send_json(413, {"ok": False, "code": "INVALID_REQUEST"})
        body = self.rfile.read(length); timestamp = self.headers.get("X-EazyTool-Timestamp", ""); nonce = self.headers.get("X-EazyTool-Nonce", ""); supplied = self.headers.get("X-EazyTool-Signature", "")
        try: timestamp_number = int(timestamp)
        except ValueError: return self.send_json(401, {"ok": False, "code": "UNAUTHORIZED"})
        now = int(time.time()); expected = hmac.new(SECRET, timestamp.encode() + b"\n" + nonce.encode() + b"\n" + body, hashlib.sha256).hexdigest() if SECRET else ""
        if len(SECRET) < 32 or abs(now - timestamp_number) > MAX_SKEW_SECONDS or not NONCE_RE.fullmatch(nonce) or not hmac.compare_digest(expected, supplied): return self.send_json(401, {"ok": False, "code": "UNAUTHORIZED"})
        with lock:
            for value, created in list(seen_nonces.items()):
                if now - created > MAX_SKEW_SECONDS: del seen_nonces[value]
            while request_times and now - request_times[0] >= 60: request_times.popleft()
            if nonce in seen_nonces: return self.send_json(409, {"ok": False, "code": "REPLAY_REJECTED"})
            if len(request_times) >= MAX_REQUESTS_PER_MINUTE: return self.send_json(429, {"ok": False, "code": "RATE_LIMITED"})
            seen_nonces[nonce] = now; request_times.append(now)
        try: self.send_json(200, dispatch(operation, json.loads(body)))
        except json.JSONDecodeError: self.send_json(400, {"ok": False, "code": "INVALID_JSON"})
        except ConnectorError as error: self.send_json(error.http_status, {"ok": False, "code": error.code, "message": error.safe_message})
        except Exception as error: print("connector internal", type(error).__name__, flush=True); self.send_json(500, {"ok": False, "code": "INTERNAL_ERROR"})

if __name__ == "__main__":
    if len(SECRET) < 32: raise SystemExit("RESELLERCLUB_CONNECTOR_SECRET must contain at least 32 characters")
    ThreadingHTTPServer(("127.0.0.1", 8787), Handler).serve_forever()

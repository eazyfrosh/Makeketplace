#!/usr/bin/env python3
"""Restricted ResellerClub API adapter. Mutations require a separate Droplet gate."""
import json, os, re, secrets, sqlite3, urllib.error, urllib.parse, urllib.request

API_BASE = os.environ.get("RESELLERCLUB_API_BASE_URL", "https://httpapi.com").rstrip("/")
DOMAIN_RE = re.compile(r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$")
ID_RE = re.compile(r"^[0-9]{1,30}$")
MUTATIONS_ENABLED = os.environ.get("RESELLERCLUB_REGISTRATION_ENABLED", "false").lower() == "true"
DNA_MUTATIONS_ENABLED = os.environ.get("DOMAINNAMEAPI_LIVE_OPERATIONS_ENABLED", "false").lower() == "true"
DB_PATH = os.environ.get("RESELLERCLUB_CONNECTOR_DB", "/var/lib/eazytool-resellerclub/idempotency.sqlite")

class ConnectorError(Exception):
    def __init__(self, code, http_status=502, message=""):
        super().__init__(message or code); self.code, self.http_status, self.safe_message = code, http_status, message or code

def _config():
    reseller_id = os.environ.get("RESELLERCLUB_RESELLER_ID", "").strip(); api_key = os.environ.get("RESELLERCLUB_API_KEY", "").strip()
    if not reseller_id or not api_key: raise ConnectorError("PROVIDER_NOT_CONFIGURED", 503)
    return reseller_id, api_key

def _domain(value):
    value = str(value or "").strip().lower().removeprefix("www.")
    if not DOMAIN_RE.fullmatch(value): raise ConnectorError("INVALID_DOMAIN", 400)
    return value

def _provider_id(value):
    value = str(value or "")
    if not ID_RE.fullmatch(value): raise ConnectorError("INVALID_PROVIDER_ID", 400)
    return value

def _request(path, method="GET", params=None):
    reseller_id, api_key = _config(); values = {"auth-userid": reseller_id, "api-key": api_key, **(params or {})}; pairs = []
    for key, raw in values.items():
        for value in raw if isinstance(raw, list) else [raw]:
            if value is not None: pairs.append((key, str(value).lower() if isinstance(value, bool) else str(value)))
    encoded = urllib.parse.urlencode(pairs).encode(); url = f"{API_BASE}/{path.lstrip('/')}"
    request = urllib.request.Request(url + ("?" + encoded.decode() if method == "GET" else ""), data=encoded if method == "POST" else None, method=method, headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(request, timeout=25) as response: payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace"); message = ""
        try:
            parsed = json.loads(body); message = str(parsed.get("message") or parsed.get("error") or "") if isinstance(parsed, dict) else ""
        except json.JSONDecodeError: pass
        raise ConnectorError("ACCESS_DENIED" if "access denied" in message.lower() else "PROVIDER_REJECTED", 502, message[:240] or "Registrar rejected the request") from error
    except (urllib.error.URLError, TimeoutError) as error: raise ConnectorError("PROVIDER_UNREACHABLE", 502) from error
    if isinstance(payload, dict) and (payload.get("status") == "ERROR" or payload.get("error")):
        message = str(payload.get("message") or payload.get("error")); raise ConnectorError("PROVIDER_REJECTED", 502, message[:240])
    return payload

def _require_mutations():
    if not MUTATIONS_ENABLED: raise ConnectorError("REGISTRATION_DISABLED", 503, "Registrar-changing operations are disabled on the connector")

def availability(payload):
    domain = _domain(payload.get("domain")); name, tld = domain.split(".", 1)
    result = _request("api/domains/available.json", params={"domain-name": name, "tlds": tld}); item = result.get(domain) or next(iter(result.values()), {})
    return {"domain": domain, "status": str(item.get("status", "unknown"))}

def price(payload):
    domain = _domain(payload.get("domain")); years = int(payload.get("years", 1))
    if years < 1 or years > 10: raise ConnectorError("INVALID_YEARS", 400)
    tld = domain.split(".", 1)[1]; prices = _request("api/products/reseller-price.json")
    legacy_keys = {"com": "domcno", "org": "domorg", "info": "dominfo", "biz": "dombiz", "us": "domus"}
    product_key = legacy_keys.get(tld, "dot" + tld.replace(".", ""))
    product = prices.get(product_key, {})
    if not isinstance(product, dict) or not product:
        product = next((item for item in prices.values() if isinstance(item, dict) and str(item.get("productkey", "")).lower() == product_key), {})
    tier = product.get("0", {}) if isinstance(product, dict) else {}
    pricing = tier.get("pricing", {}) if isinstance(tier, dict) else {}
    add = pricing.get("addnewdomain", {}) if isinstance(pricing, dict) else {}; raw = add.get(str(years), add.get("1"))
    try: amount = round(float(raw) * 100)
    except (TypeError, ValueError): raise ConnectorError("PRICE_UNAVAILABLE", 502)
    return {"domain": domain, "years": years, "currency": os.environ.get("RESELLERCLUB_ACCOUNT_CURRENCY", "USD"), "amountMinor": amount}

def _phone(registrant):
    digits = re.sub(r"\D", "", str(registrant.get("phone", ""))); cc = os.environ.get("RESELLERCLUB_DEFAULT_PHONE_CC", "234")
    return cc, digits[len(cc):] if digits.startswith(cc) else digits.lstrip("0")

def _entity_id(data):
    if isinstance(data, (str, int)): return str(data)
    return str(data.get("customerid") or data.get("contactid") or data.get("entityid") or data.get("id") or "") if isinstance(data, dict) else ""

def _find_contact(data, email):
    if not isinstance(data, dict): return ""
    contact, entity = data.get("contact"), data.get("entity")
    if isinstance(contact, dict) and isinstance(entity, dict) and str(contact.get("emailaddr", "")).lower() == email.lower(): return str(entity.get("entityid", ""))
    return next((found for value in data.values() if (found := _find_contact(value, email))), "")

def ensure_buyer(payload):
    _require_mutations(); r = payload.get("registrant")
    if not isinstance(r, dict): raise ConnectorError("INVALID_REGISTRANT", 400)
    required = ("name", "email", "phone", "address", "city", "state", "country", "postalCode")
    if any(not str(r.get(key, "")).strip() for key in required): raise ConnectorError("INVALID_REGISTRANT", 400)
    email = str(r["email"]).strip().lower(); customer_id = ""
    try: customer_id = _entity_id(_request("api/customers/details.json", params={"username": email}))
    except ConnectorError as error:
        if error.code != "PROVIDER_REJECTED": raise
    cc, phone = _phone(r)
    if not customer_id:
        customer_id = _entity_id(_request("api/customers/v2/signup.json", "POST", {"username": email, "passwd": "Ez!1" + secrets.token_urlsafe(24), "name": r["name"], "company": r.get("organization") or "N/A", "address-line-1": r["address"], "city": r["city"], "state": r["state"], "country": r["country"], "zipcode": r["postalCode"], "phone-cc": cc, "phone": phone, "lang-pref": "en", "accept-policy": True}))
    contacts = _request("api/contacts/search.json", params={"customer-id": customer_id, "email": email, "no-of-records": 10, "page-no": 1}); contact_id = _find_contact(contacts, email)
    if not contact_id:
        contact_id = _entity_id(_request("api/contacts/add.json", "POST", {"name": r["name"], "company": r.get("organization") or "N/A", "email": email, "address-line-1": r["address"], "city": r["city"], "state": r["state"], "country": r["country"], "zipcode": r["postalCode"], "phone-cc": cc, "phone": phone, "customer-id": customer_id, "type": "Contact"}))
    if not customer_id or not contact_id: raise ConnectorError("BUYER_SETUP_FAILED", 502)
    return {"providerCustomerId": customer_id, "providerContactId": contact_id}

def _db():
    connection = sqlite3.connect(DB_PATH); connection.execute("CREATE TABLE IF NOT EXISTS operations (key TEXT PRIMARY KEY, response TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)"); return connection

def _mapped(provider_id, domain, data):
    return {"providerDomainId": provider_id, "domain": domain or str(data.get("domainname") or data.get("description") or ""), "status": str(data.get("currentstatus") or data.get("status") or "pending"), "registeredAt": data.get("creationtime"), "expiresAt": data.get("endtime") or data.get("expirydate")}

def register(payload):
    _require_mutations(); domain = _domain(payload.get("domain")); years = int(payload.get("years", 1)); buyer = payload.get("buyer") or {}; key = str(payload.get("idempotencyKey", ""))
    if not re.fullmatch(r"[A-Za-z0-9_-]{8,160}", key): raise ConnectorError("INVALID_IDEMPOTENCY_KEY", 400)
    connection = _db(); row = connection.execute("SELECT response FROM operations WHERE key=?", ("register:" + key,)).fetchone()
    if row: connection.close(); return json.loads(row[0])
    if availability({"domain": domain})["status"] != "available": connection.close(); raise ConnectorError("DOMAIN_UNAVAILABLE", 409)
    nameservers = [v.strip() for v in os.environ.get("RESELLERCLUB_DEFAULT_NAMESERVERS", "").split(",") if v.strip()]
    if len(nameservers) < 2: connection.close(); raise ConnectorError("PROVIDER_NOT_CONFIGURED", 503, "Default nameservers are not configured")
    contact = _provider_id(buyer.get("providerContactId")); customer = _provider_id(buyer.get("providerCustomerId"))
    data = _request("api/domains/register.json", "POST", {"domain-name": domain, "years": years, "ns": nameservers, "customer-id": customer, "reg-contact-id": contact, "admin-contact-id": contact, "tech-contact-id": contact, "billing-contact-id": contact, "invoice-option": "KeepInvoice", "purchase-privacy": True})
    provider_id = str(data.get("entityid") or data.get("orderid") or ""); result = _mapped(provider_id, domain, data)
    if not provider_id: connection.close(); raise ConnectorError("REGISTRATION_FAILED", 502)
    connection.execute("INSERT INTO operations(key,response) VALUES(?,?)", ("register:" + key, json.dumps(result))); connection.commit(); connection.close(); return result

def status(payload):
    provider_id = _provider_id(payload.get("providerDomainId")); data = _request("api/domains/details-by-id.json", params={"order-id": provider_id, "options": "All"}); return _mapped(provider_id, "", data)

def nameservers(payload):
    provider_id = _provider_id(payload.get("providerDomainId")); data = _request("api/domains/details-by-id.json", params={"order-id": provider_id, "options": "NsDetails"}); return {"nameservers": data.get("ns", [])}

def _record(value):
    if not isinstance(value, dict) or value.get("type") not in ("A", "AAAA", "CNAME", "MX", "TXT"): raise ConnectorError("INVALID_DNS_RECORD", 400)
    host, content = str(value.get("host", ""))[:253], str(value.get("value", ""))[:4096]
    ttl = int(value.get("ttl", 3600)); priority = int(value.get("priority", 0))
    if not host or not content or ttl < 300 or ttl > 86400 or priority < 0 or priority > 65535: raise ConnectorError("INVALID_DNS_RECORD", 400)
    return {"host": host, "type": value["type"], "value": content, "ttl": ttl, "priority": priority}

def _dns_params(record):
    return {"host": record["host"], "type": record["type"], "value": record["value"], "ttl": record["ttl"], "priority": record["priority"]}

def dns_create(payload):
    _require_mutations(); provider_id = _provider_id(payload.get("providerDomainId")); record = _record(payload.get("record")); _request("api/dns/manage/add-record.json", "POST", {"order-id": provider_id, **_dns_params(record)}); return {}

def dns_update(payload):
    _require_mutations(); provider_id = _provider_id(payload.get("providerDomainId")); current, next_record = _record(payload.get("current")), _record(payload.get("next")); _request("api/dns/manage/update-record.json", "POST", {"order-id": provider_id, **_dns_params(next_record), "current-value": current["value"], "current-host": current["host"]}); return {}

def dns_remove(payload):
    _require_mutations(); provider_id = _provider_id(payload.get("providerDomainId")); record = _record(payload.get("record")); _request("api/dns/manage/delete-record.json", "POST", {"order-id": provider_id, **_dns_params(record)}); return {}

def dns_list(payload):
    provider_id = _provider_id(payload.get("providerDomainId")); data = _request("api/dns/manage/search-records.json", params={"order-id": provider_id, "no-of-records": 100, "page-no": 1}); records = data.get("records", []) if isinstance(data, dict) else []
    return {"records": records if isinstance(records, list) else []}

def renew(payload):
    _require_mutations(); provider_id = _provider_id(payload.get("providerDomainId")); domain = _domain(payload.get("domain")); years = int(payload.get("years", 1)); expiration = str(payload.get("currentExpiration", ""))
    if years < 1 or years > 10 or not expiration: raise ConnectorError("INVALID_RENEWAL", 400)
    import datetime
    try: exp_date = int(datetime.datetime.fromisoformat(expiration.replace("Z", "+00:00")).timestamp())
    except ValueError: raise ConnectorError("INVALID_RENEWAL", 400)
    data = _request("api/domains/renew.json", "POST", {"order-id": provider_id, "years": years, "exp-date": exp_date, "invoice-option": "KeepInvoice"}); return _mapped(provider_id, domain, data)

DNA_OPERATIONS = {
    "account": ("GET", "deposit/accounts/me", {"currency"}),
    "search": ("POST", "domains/search", set()),
    "register": ("POST", "domains/register-with-contacts", set()),
    "info": ("GET", "domains/info", {"DomainName"}),
    "dns_list": ("GET", "domains/zones", {"domainName"}),
    "dns_create": ("POST", "domains/zones", {"domainName"}),
    "dns_update": ("PUT", "domains/zones", {"domainName", "recordName"}),
    "dns_delete": ("DELETE", "domains/zones", {"domainName", "Name", "Record", "RecordType"}),
    "dns_apply": ("POST", "domains/zones/apply", {"domainName"}),
    "renew": ("POST", "domains/renew", set()),
    "transfer": ("POST", "domains/transfer", set()),
}
DNA_CHARGEABLE = {"register", "renew", "transfer"}
DNA_RESELLER_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)

def _dna_domain(params, body):
    value = params.get("domainName") or params.get("DomainName") or (body.get("domainName") if isinstance(body, dict) else None)
    return _domain(value) if value else None

def _dna_request(reseller_id, api_key, environment, method, path, params, body):
    base = "https://api.domainresellerapi.com/api/v1" if environment == "production" else "https://ote.domainresellerapi.com/api/v1"
    query = urllib.parse.urlencode([(key, str(value)) for key, value in params.items() if value is not None])
    url = f"{base}/{path}" + (f"?{query}" if query else "")
    encoded = json.dumps(body, separators=(",", ":")).encode() if method in ("POST", "PUT") and body is not None else None
    request = urllib.request.Request(url, data=encoded, method=method, headers={"X-API-KEY": api_key, "__reseller": reseller_id, "Accept": "application/json", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            raw = response.read().decode("utf-8")
            try: parsed = json.loads(raw) if raw else None
            except json.JSONDecodeError: parsed = None
            return {"providerStatus": response.status, "body": parsed}
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        try: parsed = json.loads(raw) if raw else None
        except json.JSONDecodeError: parsed = {"error": {"message": "The domain provider returned an unreadable error."}}
        return {"providerStatus": error.code, "body": parsed}
    except (urllib.error.URLError, TimeoutError) as error:
        raise ConnectorError("PROVIDER_UNREACHABLE", 502, "Domain Name API could not be reached from the fixed-IP connector.") from error

def domainnameapi(payload):
    operation = str(payload.get("operation", ""))
    definition = DNA_OPERATIONS.get(operation)
    if not definition: raise ConnectorError("OPERATION_NOT_ALLOWED", 404)
    if operation in DNA_CHARGEABLE and not DNA_MUTATIONS_ENABLED:
        raise ConnectorError("REGISTRATION_DISABLED", 503, "Chargeable Domain Name API operations are disabled on the connector.")
    reseller_id = str(payload.get("resellerId", "")).strip(); api_key = str(payload.get("apiKey", "")).strip()
    if not DNA_RESELLER_RE.fullmatch(reseller_id) or not 16 <= len(api_key) <= 512 or any(char.isspace() for char in api_key):
        raise ConnectorError("PROVIDER_NOT_CONFIGURED", 503, "Domain Name API credentials are missing or invalid.")
    environment = str(payload.get("environment", "test"))
    if environment not in ("test", "production"): raise ConnectorError("INVALID_REQUEST", 400)
    method, path, allowed_params = definition
    params = payload.get("params") or {}; body = payload.get("body")
    if not isinstance(params, dict) or any(key not in allowed_params for key in params): raise ConnectorError("INVALID_REQUEST", 400)
    if body is not None and not isinstance(body, dict): raise ConnectorError("INVALID_REQUEST", 400)
    domain = _dna_domain(params, body)
    if operation != "account" and not domain: raise ConnectorError("INVALID_DOMAIN", 400)
    if "domainName" in params: params["domainName"] = domain
    if "DomainName" in params: params["DomainName"] = domain
    if isinstance(body, dict) and "domainName" in body: body["domainName"] = domain
    return _dna_request(reseller_id, api_key, environment, method, path, params, body)

READ_OPERATIONS = {"availability": availability, "price": price, "status": status, "nameservers": nameservers, "dns_list": dns_list}
MUTATION_OPERATIONS = {"ensure_buyer": ensure_buyer, "register": register, "dns_create": dns_create, "dns_update": dns_update, "dns_remove": dns_remove, "renew": renew, "domainnameapi": domainnameapi}

def dispatch(operation, payload):
    handler = READ_OPERATIONS.get(operation) or MUTATION_OPERATIONS.get(operation)
    if not handler: raise ConnectorError("OPERATION_NOT_ALLOWED", 404)
    return {"ok": True, **handler(payload)}

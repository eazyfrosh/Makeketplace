import type { DnsRecord } from "@/types/domains";

export function relativeDnsHost(host: string, domain: string) {
  const normalizedHost = host.trim().replace(/\.$/, "").toLowerCase();
  const normalizedDomain = domain.trim().replace(/\.$/, "").toLowerCase();
  if (!normalizedHost || normalizedHost === "@" || normalizedHost === normalizedDomain) return "";
  const suffix = `.${normalizedDomain}`;
  return normalizedHost.endsWith(suffix) ? normalizedHost.slice(0, -suffix.length) : normalizedHost;
}

function comparableDnsValue(record: DnsRecord) {
  const value = record.value.trim();
  if (record.type === "TXT") {
    // DNS APIs can quote a whole TXT value in reads even when the write was unquoted.
    return /^"[^"]*"$/.test(value) ? value.slice(1, -1) : value;
  }
  if (record.type === "MX") {
    const prefixed = value.match(/^(\d+)\s+(.+)$/);
    const priority = Number.isFinite(record.priority) ? record.priority : prefixed ? Number(prefixed[1]) : null;
    const target = (prefixed ? prefixed[2] : value).replace(/\.$/, "").toLowerCase();
    return `${priority ?? ""}|${target}`;
  }
  if (record.type === "CNAME" || record.type === "AAAA") return value.replace(/\.$/, "").toLowerCase();
  return value;
}

export function dnsRecordsMatch(left: DnsRecord, right: DnsRecord, domain: string) {
  return relativeDnsHost(left.host, domain) === relativeDnsHost(right.host, domain)
    && left.type.toUpperCase() === right.type.toUpperCase()
    && comparableDnsValue(left) === comparableDnsValue(right);
}

export type LicenseStatus = "active" | "suspended" | "expired" | "revoked";

export interface License {
  id: string;
  licenseKey: string;
  userId: string;
  userEmail: string;
  serviceSlug: string;
  serviceName: string;
  orderId: string;
  status: LicenseStatus;
  billing: "one-time" | "monthly";
  issuedAt: string;
  expiresAt: string | null;
  renewedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  suspendedAt: string | null;
  suspendedReason: string | null;
}

export type ValidationResult =
  | "granted"
  | "denied_expired"
  | "denied_revoked"
  | "denied_suspended"
  | "denied_service_mismatch"
  | "denied_not_found"
  | "denied_invalid_token"
  | "denied_unauthenticated";

export interface LicenseValidationLog {
  id: string;
  licenseId: string | null;
  userId: string | null;
  serviceSlug: string;
  result: ValidationResult;
  createdAt: string;
}

export interface AccessTokenPayload {
  sub: string;
  serviceId: string;
  licenseId: string;
}

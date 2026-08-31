export type AffiliateStatus = "active" | "suspended";

export interface Affiliate {
  id: string;
  userId: string;
  email: string;
  code: string;
  commissionRatePercent: number;
  status: AffiliateStatus;
  totalClicks: number;
  createdAt: string;
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  referredUserId: string;
  referredEmail: string;
  createdAt: string;
}

export type CommissionStatus = "pending" | "paid";

export interface AffiliateCommission {
  id: string;
  affiliateId: string;
  orderId: string;
  referredUserId: string;
  orderTotalCents: number;
  commissionCents: number;
  status: CommissionStatus;
  /** Set once a payout request is created that covers this commission; cleared again if that request is rejected. */
  payoutRequestId: string | null;
  createdAt: string;
}

export type PayoutRequestStatus = "requested" | "paid" | "rejected";

export interface AffiliatePayoutRequest {
  id: string;
  affiliateId: string;
  amountCents: number;
  status: PayoutRequestStatus;
  requestedAt: string;
  resolvedAt: string | null;
}

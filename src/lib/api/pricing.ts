import { csmsApiPath } from "../config";
import { apiRequestAuth } from "./http";

/* ── Types ── */

export type PricingPlanStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export interface PricingPlan {
  id: number;
  operatorId: number | null;
  name: string;
  status: PricingPlanStatus;
  energyRatePerKwh: number;
  idleFeePerMin: number;
  idleGraceMinutes: number;
  reservationFee: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePricingPlanRequest {
  operatorId: number | null;
  name: string;
  energyRatePerKwh: number;
  idleFeePerMin: number;
  idleGraceMinutes: number;
  reservationFee: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface PlatformConfigResponse {
  platformMarginPerKwh: number;
  reservationPlatformSharePct: number;
  idlePlatformSharePct: number;
  minEnergyRate: number;
  maxEnergyRate: number;
  vatRatePct: number;
  minTopup: number;
  maxWalletBalance: number;
  reservationWindowMinutes: number;
  lowBalanceThreshold: number;
  defaultPricingPlanId: number | null;
  updatedAt: string;
}

export interface UpdatePlatformConfigRequest {
  platformMarginPerKwh?: number;
  reservationPlatformSharePct?: number;
  idlePlatformSharePct?: number;
  minEnergyRate?: number;
  maxEnergyRate?: number;
  vatRatePct?: number;
  minTopup?: number;
  maxWalletBalance?: number;
  reservationWindowMinutes?: number;
  lowBalanceThreshold?: number;
  defaultPricingPlanId?: number | null;
}

/* ── Pricing Plans ── */

const PLANS_BASE = "/api/v1/admin/pricing-plans";

export async function fetchPricingPlans(
  operatorId?: number,
  status?: string,
): Promise<PricingPlan[]> {
  const q = new URLSearchParams();
  if (operatorId != null) q.set("operatorId", String(operatorId));
  if (status) q.set("status", status);
  const qs = q.toString();
  return apiRequestAuth<PricingPlan[]>(
    csmsApiPath(`${PLANS_BASE}${qs ? `?${qs}` : ""}`),
  );
}

export async function fetchPricingPlan(id: number): Promise<PricingPlan> {
  return apiRequestAuth<PricingPlan>(csmsApiPath(`${PLANS_BASE}/${id}`));
}

export async function createPricingPlan(
  data: CreatePricingPlanRequest,
): Promise<PricingPlan> {
  return apiRequestAuth<PricingPlan>(csmsApiPath(PLANS_BASE), {
    method: "POST",
    body: data,
  });
}

export async function activatePricingPlan(id: number): Promise<PricingPlan> {
  return apiRequestAuth<PricingPlan>(
    csmsApiPath(`${PLANS_BASE}/${id}/activate`),
    { method: "PUT" },
  );
}

export async function deactivatePricingPlan(id: number): Promise<PricingPlan> {
  return apiRequestAuth<PricingPlan>(
    csmsApiPath(`${PLANS_BASE}/${id}/deactivate`),
    { method: "PUT" },
  );
}

/* ── Platform Config ── */

const CONFIG_BASE = "/api/v1/admin/platform-config";

export async function fetchPlatformConfig(): Promise<PlatformConfigResponse> {
  return apiRequestAuth<PlatformConfigResponse>(csmsApiPath(CONFIG_BASE));
}

export async function updatePlatformConfig(
  data: UpdatePlatformConfigRequest,
): Promise<PlatformConfigResponse> {
  return apiRequestAuth<PlatformConfigResponse>(csmsApiPath(CONFIG_BASE), {
    method: "PUT",
    body: data,
  });
}

/* ── Assignments ── */

export interface PricingAssignment {
  operatorId: number;
  pricingPlanId: number;
  pricingPlanName: string;
  /** ISO string, or Jackson LocalDateTime array `[y, M, d, H, m, …]`. */
  assignedAt: string | number[];
}

const ASSIGNMENTS_BASE = "/api/v1/admin/pricing-assignments";

export async function fetchPricingAssignments(): Promise<PricingAssignment[]> {
  return apiRequestAuth<PricingAssignment[]>(csmsApiPath(ASSIGNMENTS_BASE));
}

export async function assignPricingPlan(
  operatorId: number,
  pricingPlanId: number,
): Promise<PricingAssignment> {
  return apiRequestAuth<PricingAssignment>(
    csmsApiPath(`${ASSIGNMENTS_BASE}/${operatorId}`),
    { method: "PUT", body: { pricingPlanId } },
  );
}

export async function removeAssignment(operatorId: number): Promise<void> {
  return apiRequestAuth<void>(
    csmsApiPath(`${ASSIGNMENTS_BASE}/${operatorId}`),
    { method: "DELETE" },
  );
}

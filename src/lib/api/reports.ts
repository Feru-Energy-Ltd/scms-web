import { apiRequestAuth } from "./http";
import { csmsApiPath } from "../config";

// --- Types ---

export interface ProviderReportSummary {
  totalRevenue: number;
  energyRevenue: number;
  reservationRevenue: number;
  idleRevenue: number;
  platformFees: number;
  totalSessions: number;
  totalEnergyWh: number;
  avgSessionDurationMin: number;
  avgRevenuePerSession: number;
}

export interface RevenueTrendPoint {
  date: string;
  operatorRevenue: number;
  platformFees: number;
  sessionCount: number;
}

export interface DailyBreakdown {
  date: string;
  revenue: number;
  sessionCount: number;
  energyWh: number;
}

export interface ChargerReportRow {
  chargerId: string;
  chargerName: string;
  totalRevenue: number;
  sessionCount: number;
  totalEnergyWh: number;
  avgSessionDurationMin: number;
  dailyBreakdown: DailyBreakdown[];
}

export interface PlatformReportSummary {
  totalPlatformRevenue: number;
  totalOperatorRevenue: number;
  totalDriverSpend: number;
  totalSessions: number;
  totalEnergyWh: number;
  activeProviderCount: number;
}

// --- API Functions ---

function buildDateParams(from: string, to: string, providerId?: number): string {
  const params = new URLSearchParams();
  params.set("from", new Date(from).toISOString());
  params.set("to", new Date(to).toISOString());
  if (providerId != null) params.set("providerId", String(providerId));
  return params.toString();
}

export async function fetchProviderReportSummary(
  from: string,
  to: string,
  providerId?: number
): Promise<ProviderReportSummary> {
  const qs = buildDateParams(from, to, providerId);
  return apiRequestAuth<ProviderReportSummary>(csmsApiPath(`/reports/provider/summary?${qs}`));
}

export async function fetchRevenueTrend(
  from: string,
  to: string,
  providerId?: number
): Promise<RevenueTrendPoint[]> {
  const qs = buildDateParams(from, to, providerId);
  return apiRequestAuth<RevenueTrendPoint[]>(csmsApiPath(`/reports/provider/revenue-trend?${qs}`));
}

export async function fetchChargerBreakdown(
  from: string,
  to: string,
  providerId?: number
): Promise<ChargerReportRow[]> {
  const qs = buildDateParams(from, to, providerId);
  return apiRequestAuth<ChargerReportRow[]>(csmsApiPath(`/reports/provider/chargers?${qs}`));
}

export async function fetchPlatformReportSummary(
  from: string,
  to: string
): Promise<PlatformReportSummary> {
  const params = new URLSearchParams();
  params.set("from", new Date(from).toISOString());
  params.set("to", new Date(to).toISOString());
  return apiRequestAuth<PlatformReportSummary>(csmsApiPath(`/reports/platform/summary?${params}`));
}

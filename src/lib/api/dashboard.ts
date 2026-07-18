import { csmsApiPath, paymentApiPath } from "../config";
import { apiRequestAuth } from "./http";

export interface ProviderDashboardStats {
  totalChargers: number;
  onlineChargers: number;
  offlineChargers: number;
  activeSessions: number;
  activeReservations: number;
  totalSessionsToday: number;
  energyDeliveredTodayKwh: number;
}

export interface OperatorDashboardStats {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  earnedBalance: number;
  pendingSettlement: number;
  totalSettled: number;
}

export async function fetchProviderDashboardStats(): Promise<ProviderDashboardStats | undefined> {
  return apiRequestAuth<ProviderDashboardStats>(csmsApiPath("/dashboard/provider/stats"));
}

export async function fetchOperatorDashboardStats(operatorId: number): Promise<OperatorDashboardStats | undefined> {
  return apiRequestAuth<OperatorDashboardStats>(paymentApiPath(`/operators/${operatorId}/dashboard`));
}

export async function fetchAggregateOperatorDashboardStats(): Promise<OperatorDashboardStats | undefined> {
  return apiRequestAuth<OperatorDashboardStats>(paymentApiPath("/operators/dashboard"));
}

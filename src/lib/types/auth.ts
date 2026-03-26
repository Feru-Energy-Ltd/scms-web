export type AccountSummary = {
  accountId: number;
  accountName: string;
  accountType: string;
  role: string;
};

export type ProviderSummary = {
  providerId: number;
  providerName: string;
  status: string;
  role: string;
};

export type Phase1Response = {
  identityType: string;
  identityToken?: string;
  autoSelect?: boolean;
  accounts?: AccountSummary[];
  provider?: ProviderSummary;
  // Phase 1 token issuance varies by identity type; some responses omit these.
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
};

// Returned by Phase 2 context selection for customers.
export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  account?: AccountSummary;
  provider?: ProviderSummary;
};


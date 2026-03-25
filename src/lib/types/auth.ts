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
  identityToken: string;
  autoSelect: boolean;
  accounts: AccountSummary[];
  provider: ProviderSummary;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};


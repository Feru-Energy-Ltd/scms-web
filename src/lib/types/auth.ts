export type ProviderRegistrationPayload = {
  displayName: string;
  ownerEmail: string;
  ownerPassword: string;
  businessName: string;
  registration: string;
  phone: string;
};
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

export type TokenResponse = {
  identityType: string;
  identityToken: string;
  autoSelect?: boolean;
  accounts?: AccountSummary[];
  provider?: ProviderSummary;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};




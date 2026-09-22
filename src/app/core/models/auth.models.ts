export interface LoginRequest {
  email: string;
  password: string;
  keepMeSignedIn: boolean;
}

export interface LoginResponse {
  token: string;
  role: string;
  userID: number;
  fullName: string;
  expiry: string;
  permissions?: string[];
}

export interface OtpChallengeResponse {
  requiresOtp: true;
  otpReference: string;
  expiresAt: string;
}

export type LoginResult = LoginResponse | OtpChallengeResponse;

export function isOtpChallenge(result: LoginResult): result is OtpChallengeResponse {
  return (result as OtpChallengeResponse).requiresOtp === true;
}

export interface VerifyOtpRequest {
  otpReference: string;
  code: string;
  keepMeSignedIn: boolean;
}

export interface ResendOtpRequest {
  otpReference: string;
}

export interface ResendOtpResponse {
  message: string;
  otpReference: string;
  otpExpiresAt: string;
}

export interface ToggleTwoFactorRequest {
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
  companyName?: string;
  phoneNumber?: string;
}

export interface RegisterSupplierRequest {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  registrationNumber?: string;
  /** SA format 0XXXXXXXXX or +27XXXXXXXXX; unique when provided */
  phoneNumber?: string;
  documents: File[];
  docTypeIds: number[];
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
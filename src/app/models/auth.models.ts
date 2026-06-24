export interface LoginRequest {
  phone: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  phone: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  ville: string;
  password: string;
  role: Role;
  supervisorId?: number;
}

export interface VerifyPhoneRequest {
  phone: string;
  code: string;
}

export interface LoginResponse {
  token: string;
  role: Role;
  status: string;
}

export type Role = 'CITOYEN' | 'AGENT' | 'SUPER_AGENT' | 'ADMIN';

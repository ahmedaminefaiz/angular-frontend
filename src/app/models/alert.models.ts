export interface ApiPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  timestamp?: number;
}

export interface UserSummary {
  id: number;
  phone: string;
  nom: string;
  prenom: string;
  ville: string;
  role: string;
  status: string;
}

export interface ProblemTypeSummary {
  id: number;
  name: string;
  icon?: string;
  adminId?: number;
  adminName?: string;
}

export type AlertStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AlertResponse {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  status: AlertStatus;
  priority: AlertPriority;
  isAnonymous: boolean;
  images: string[];
  videos: string[];
  createdAt: string;
  updatedAt: string;
  user: UserSummary;
  category: ProblemTypeSummary;
  ticketId?: number;
}

export interface CreateAlertRequest {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  categoryId: number;
  priority: AlertPriority;
  isAnonymous?: boolean;
}

export interface UpdateAlertRequest {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  categoryId?: number;
  priority?: AlertPriority;
  isAnonymous?: boolean;
}

export interface AddMediaRequest {
  mediaUrl: string;
  description?: string;
}

export interface AlertSimilarityResponse extends AlertResponse {
  score: number;
}

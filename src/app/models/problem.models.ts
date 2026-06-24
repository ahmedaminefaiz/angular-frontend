import { AlertStatus } from './alert.models';

export type ProblemStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface CreateProblemRequest {
  title?: string;
  description?: string;
  alertIds: number[];
}

export interface UpdateProblemRequest {
  title?: string;
  description?: string;
  addAlertIds?: number[];
  removeAlertIds?: number[];
}

export interface ProblemStatusChangeRequest {
  newStatus: ProblemStatus;
  comment?: string;
}

export interface ProblemUserSummary {
  id: number;
  phone: string;
  firstName: string;
  lastName: string;
}

export interface ProblemAlertSummary {
  id: number;
  title: string;
  status: AlertStatus;
  userId: number;
}

export interface ProblemStatusHistory {
  id: number;
  previousStatus: ProblemStatus;
  newStatus: ProblemStatus;
  changedBy: string;
  comment?: string;
  changedAt: string;
}

export interface ProblemResponse {
  id: number;
  status: ProblemStatus;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  createdBy: ProblemUserSummary;
  alerts: ProblemAlertSummary[];
  statusHistory: ProblemStatusHistory[];
}

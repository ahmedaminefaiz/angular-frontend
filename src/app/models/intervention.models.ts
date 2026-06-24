export type InterventionStatus =
  | 'AFFECTEE'
  | 'EN_COURS'
  | 'SUSPENDUE'
  | 'EN_ATTENTE_AUTRE_EQUIPE'
  | 'RESOLUE'
  | 'PARTIELLEMENT_RESOLUE'
  | 'ECHEC_INTERVENTION'
  | 'CLOTUREE';

export type InterventionActionType =
  | 'VISITE_TERRAIN'
  | 'REPARATION'
  | 'INSPECTION'
  | 'TENTATIVE_RESOLUTION'
  | 'DIAGNOSTIC'
  | 'MISE_A_JOUR_OPERATIONNELLE';

export const INTERVENTION_STATUS_LABELS: Record<InterventionStatus, string> = {
  AFFECTEE: 'Affectée',
  EN_COURS: 'En cours',
  SUSPENDUE: 'Suspendue',
  EN_ATTENTE_AUTRE_EQUIPE: 'En attente autre équipe',
  RESOLUE: 'Résolue',
  PARTIELLEMENT_RESOLUE: 'Partiellement résolue',
  ECHEC_INTERVENTION: 'Échec intervention',
  CLOTUREE: 'Clôturée'
};

export const INTERVENTION_ACTION_TYPE_LABELS: Record<InterventionActionType, string> = {
  VISITE_TERRAIN: 'Visite terrain',
  REPARATION: 'Réparation',
  INSPECTION: 'Inspection',
  TENTATIVE_RESOLUTION: 'Tentative de résolution',
  DIAGNOSTIC: 'Diagnostic',
  MISE_A_JOUR_OPERATIONNELLE: 'Mise à jour opérationnelle'
};

export interface InterventionResponse {
  id: number;
  problemId: number;
  problemTitle: string;
  agentId: number;
  agentFullName: string;
  description: string;
  status: InterventionStatus;
  actionType: InterventionActionType;
  interventionDate: string;
  duration?: number;
  photos: string[];
}

export interface CreateInterventionRequest {
  problemId: number;
  agentId: number;
  description: string;
  actionType: InterventionActionType;
  photos?: string[];
}

export interface CreateInterventionUpdateRequest {
  rapport: string;
  status: InterventionStatus;
  photos?: string[];
}

export interface InterventionUpdateResponse {
  id: number;
  interventionId: number;
  rapport: string;
  status: InterventionStatus;
  statusLabel: string;
  photos: string[];
  createdAt: string;
}

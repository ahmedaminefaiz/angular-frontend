export interface AlertKpi {
  total: number;
  enAttente: number;
  qualifiees: number;
  delaiMoyenQualificationHeures: number | null;
}

export interface ProblemKpi {
  total: number;
  ouverts: number;
  resolus: number;
  sansInterventionActive: number;
  tempsMoyenResolutionHeures: number | null;
}

export interface AgentPerformance {
  agentId: number;
  nom: string;
  prenom: string;
  total: number;
  reussies: number;
  enCours: number;
}

export interface InterventionKpi {
  total: number;
  parStatut: Record<string, number>;
  tauxReussite: number | null;
  tauxEchec: number | null;
  dureeMoyenneMinutes: number | null;
  enRetard: number;
  parAgent: AgentPerformance[];
}

export interface KpiDashboard {
  alerts: AlertKpi;
  problems: ProblemKpi;
  interventions: InterventionKpi;
}

export interface KpiFilters {
  periodDays: number | null;
  agentId: number | null;
}
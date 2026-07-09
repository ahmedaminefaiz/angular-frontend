export function isPdfReport(rapport: string | null | undefined): boolean {
  if (!rapport) return false;
  return /^https?:\/\/\S+\.pdf($|\?)/i.test(rapport.trim());
}
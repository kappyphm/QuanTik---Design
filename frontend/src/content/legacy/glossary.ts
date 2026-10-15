import definitions from './glossary.json';

// Effective tooltip data copied verbatim from QuanTik-website at
// 521a093b56fefd21493026adb4ead77882cdf082. No editorial changes.
export type TermDefinition = {
  id: string;
  en: string;
  vi: string;
  short: string;
  formulaLatex: string;
  variables: string;
  parameters: string;
  example?: string;
  interpretation?: string;
  conditions?: string;
  usage: string;
  limitations: string;
  methodId: string;
  sourceFormula?: string;
};
export const glossary: TermDefinition[] = definitions;
export const getTerm = (id: string) => glossary.find(term => term.id === id);

// Only connect fields with an existing definition in the old glossary.
export const criterionTerms: Record<string, string> = {
  N: 'sharpe', O: 'up_day_ratio', P: 'max_drawdown', Q: 'annual_return',
  R: 'hmm', S: 'volatility_regime', U: 'ensemble_return', V: 'confidence',
  W: 'model_coverage', X: 'directional_support_pct', Y: 'active_model_count',
  Z: 'meta_trust_pct', AA: 'hurst', AB: 'hurst', AC: 'lightgbm_rank_pct',
  AD: 'lightgbm_alpha_pct', AG: 'net_forecast', AI: 'lock_drawdown',
  AJ: 'probability_loss', AQ: 'gap_abs_p95_pct', AW: 'risk_pct_nav',
  AO: 'adv20_value_vnd', AR: 'entry', AS: 'stop_loss', AT: 'take_profit', AU: 'take_profit',
};

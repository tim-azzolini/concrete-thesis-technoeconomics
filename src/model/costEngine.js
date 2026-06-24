// ─── Paper data ──────────────────────────────────────────────────────────────
export const SF_PER_PANEL      = 16;
export const PANELS_PER_TRUCK  = 26;
export const TRUCK_COST_PER_KM = 3.5;
export const MASS_PC_KG        = 233;
export const MASS_SC_KG        = 156;
export const EC_PC             = 103.32;
export const EC_SC             = 73.07;

export const C = {
  bg:     "#0D1117",
  card:   "#161B22",
  border: "#30363D",
  t1:     "#E6EDF3",
  t2:     "#8B949E",
  t3:     "#484F58",
  cmu:    "#6E7681",
  pc:     "#7C84E0",
  sc:     "#3FB950",
  scNet:  "#F0A742",
};

export function buildCosts({ vol, carbonPrice, distKm, plantRate, concPrice, foamPrem }) {
  const siteRate  = plantRate * 1.85;
  const foamPrice = concPrice * (1 + foamPrem / 100);
  const truckRun  = TRUCK_COST_PER_KM * distKm;
  const tBase     = truckRun / PANELS_PER_TRUCK;

  const cmu_block   = SF_PER_PANEL * 10.50;
  const cmu_extra   = SF_PER_PANEL * 5.90;
  const cmu_finish  = SF_PER_PANEL * 1.50;
  const cmu_labor   = SF_PER_PANEL * siteRate * 0.16;
  const cmu_deliver = 18;
  const cmuTotal    = cmu_block + cmu_extra + cmu_finish + cmu_labor + cmu_deliver;

  const concVol       = MASS_PC_KG / 2200;
  const pc_formwork   = 500 / Math.min(vol, 200);
  const pc_mfg        = concVol * concPrice + 2 + pc_formwork + plantRate * 1.5 + 15;
  const pc_transport  = tBase;
  const pc_site_mat   = SF_PER_PANEL * 5.90 + SF_PER_PANEL * 1.50;
  const pc_site_labor = siteRate * 0.45;
  const pcTotal       = pc_mfg + pc_transport + pc_site_mat + pc_site_labor;

  const sc_concVol    = (MASS_SC_KG * 0.75) / 2200;
  const sc_foamVol    = (MASS_SC_KG * 0.25) / 800;
  const sc_form_ply   = 800 / Math.min(vol, 200);
  const sc_form_foam  = 150 / Math.min(vol, 15);
  const sc_design     = 2500 / Math.max(vol, 25);
  const sc_mfg        = sc_concVol * concPrice + sc_foamVol * foamPrice + 6.50
                        + sc_form_ply + sc_form_foam + plantRate * 2.25
                        + sc_design + 15;
  const sc_transport  = tBase * (MASS_SC_KG / MASS_PC_KG);
  const sc_site_mat   = SF_PER_PANEL * 1.50;
  const sc_site_labor = siteRate * 0.35;
  const scTotal       = sc_mfg + sc_transport + sc_site_mat + sc_site_labor;

  const ecSavings    = EC_PC - EC_SC;
  const carbonCredit = (ecSavings / 1000) * carbonPrice;
  const scNet        = scTotal - carbonCredit;

  return {
    cmu: { total: cmuTotal, block: cmu_block, extra: cmu_extra, finish: cmu_finish, labor: cmu_labor, transport: cmu_deliver },
    pc:  { total: pcTotal, panel: pc_mfg, extra: pc_site_mat, labor: pc_site_labor, transport: pc_transport },
    sc:  { total: scTotal, net: scNet, panel: sc_mfg, finish: sc_site_mat, labor: sc_site_labor, transport: sc_transport },
    ecSavings,
    carbonCredit,
    scNet,
    siteRate,
    sc_concVol,
    sc_foamVol,
    sc_form_ply,
    sc_form_foam,
    sc_design,
    pc_formwork,
    tBase,
    truckRun,
    foamPrice,
  };
}

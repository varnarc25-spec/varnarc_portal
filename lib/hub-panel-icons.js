/**
 * Local SVG icons for all section hub sidebars.
 * Files: public/assets/images/hub/icons/{file}
 */

var HUB_ICON_BASE = "/assets/images/hub/icons/";

/** Normalized slug (lowercase, underscores) → SVG filename */
var HUB_ICON_SLUG_MAP = {
  /* Bill Payments */
  cabletv: "cabletv.svg",
  cable_tv: "cabletv.svg",
  book_cylinder: "book-cylinder.svg",
  "book-cylinder": "book-cylinder.svg",
  electricity: "electricity.svg",
  gas: "gas.svg",
  piped_gas: "gas.svg",
  water: "water.svg",
  municipal_tax: "municipal-tax.svg",
  "municipal-tax": "municipal-tax.svg",
  broadband_landline: "broadband_landline.svg",
  broadband: "broadband.svg",
  mobile_postpaid: "mobile-postpaid.svg",
  "mobile-postpaid": "mobile-postpaid.svg",
  education_fee: "education-fee.svg",
  "education-fee": "education-fee.svg",
  loan: "loan.svg",
  loan_repayment: "loan.svg",
  credit_card: "credit-card.svg",
  credit_card_bill: "credit-card.svg",
  "credit-card": "credit-card.svg",
  card_repay: "credit-card.svg",
  lic_insurance: "lic-insurance.svg",
  "lic-insurance": "lic-insurance.svg",
  nps: "nps.svg",
  nps_contribution: "nps.svg",
  echallan: "echallan.svg",
  devotion: "devotion.svg",
  donation: "donation.svg",
  portfolio: "portfolio.svg",
  portfolio_holdings: "portfolio.svg",

  /* Recharge */
  mobile: "mobile.svg",
  mobile_recharge: "mobile-recharge.svg",
  dth: "dth.svg",
  subscription: "subscription.svg",
  fastag: "fastag.svg",
  fastag_recharge: "fastag.svg",
  apple_store: "apple-store.svg",
  "apple-store": "apple-store.svg",
  ev_recharge: "ev-recharge.svg",
  "ev-recharge": "ev-recharge.svg",
  get_sim: "get-sim.svg",
  "get-sim": "get-sim.svg",
  datacard: "datacard.svg",
  landline: "landline.svg",
  metro: "metro.svg",

  /* Money Transfer */
  to_mobile_number: "to-mobile-number.svg",
  to_bank_self_a_c: "to-bank-self-ac.svg",
  to_bank_self_ac: "to-bank-self-ac.svg",
  check_balance: "check-balance.svg",
  money_transfer: "money-transfer.svg",

  /* Travel */
  travel_flight: "travel-flight.svg",
  "travel-flight": "travel-flight.svg",
  flight: "travel-flight.svg",
  travel_bus: "travel-bus.svg",
  "travel-bus": "travel-bus.svg",
  bus: "travel-bus.svg",
  travel_train: "travel-train.svg",
  "travel-train": "travel-train.svg",
  train: "travel-train.svg",
  travel_hotel: "travel-hotel.svg",
  "travel-hotel": "travel-hotel.svg",
  hotel: "travel-hotel.svg",

  /* Insurance */
  insurance: "insurance-term.svg",
  insurance_bike: "insurance-bike.svg",
  "insurance-bike": "insurance-bike.svg",
  bike_insurance: "insurance-bike.svg",
  insurance_car: "insurance-car.svg",
  "insurance-car": "insurance-car.svg",
  car_insurance: "insurance-car.svg",
  insurance_health: "insurance-health.svg",
  "insurance-health": "insurance-health.svg",
  health_insurance: "insurance-health.svg",
  insurance_term: "insurance-term.svg",
  "insurance-term": "insurance-term.svg",
  term_life_insurance: "insurance-term.svg",
  insurance_accident: "insurance-term.svg",
  "insurance-accident": "insurance-term.svg",
  accident_insurance: "insurance-term.svg",

  /* Digi Gold & Silver */
  digigold: "digigold.svg",
  buy_gold: "buy-gold.svg",
  daily_gold_savings: "daily-gold-savings.svg",
  buy_silver_999: "buy-silver.svg",
  buy_silver: "buy-silver.svg",
  daily_silver_saving: "daily-silver-saving.svg",
  smart_sip: "smart-sip.svg",
  gift_gold_silver: "gift-gold-silver.svg",
  family_vault: "family-vault.svg",
  profit_loss: "profit-loss.svg",
  price_alerts: "price-alerts.svg",
  sell_gold_silver: "sell-gold-silver.svg",
  convert_to_physical_gold: "convert-physical-gold.svg",
  convert_to_physical_silver: "convert-physical-silver.svg",
  transaction_history: "transaction-history.svg",
  tax_capital_gain_report: "tax-capital-gain.svg",
  annual_statement: "annual-statement.svg",

  /* Financial Hub */
  financial: "financial.svg",
  investments: "investments.svg",
  budget: "budget.svg",
  budget_2: "budget.svg",

  /* Fallback */
  generic: "generic.svg",
  services: "generic.svg",
};

function normalizeSlugKey(slug) {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

function resolveHubIconFile(panelSlug) {
  var raw = String(panelSlug || "").trim();
  if (!raw) {
    return "";
  }
  if (HUB_ICON_SLUG_MAP[raw]) {
    return HUB_ICON_SLUG_MAP[raw];
  }
  var key = normalizeSlugKey(raw);
  return HUB_ICON_SLUG_MAP[key] || "";
}

function hubPanelIconUrl(sectionFolder, panelSlug) {
  var file = resolveHubIconFile(panelSlug);
  if (!file) {
    return "";
  }
  return HUB_ICON_BASE + file;
}

/** @deprecated use hubPanelIconUrl */
function billPaymentsHubIconUrl(panelSlug) {
  return hubPanelIconUrl("BillPayments", panelSlug);
}

module.exports = {
  HUB_ICON_BASE: HUB_ICON_BASE,
  HUB_ICON_SLUG_MAP: HUB_ICON_SLUG_MAP,
  resolveHubIconFile: resolveHubIconFile,
  hubPanelIconUrl: hubPanelIconUrl,
  billPaymentsHubIconUrl: billPaymentsHubIconUrl,
};

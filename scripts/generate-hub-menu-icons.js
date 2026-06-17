#!/usr/bin/env node
/**
 * Writes hub sidebar SVG icons under public/assets/images/hub/icons/
 * Run: node scripts/generate-hub-menu-icons.js
 */
"use strict";

var fs = require("fs");
var path = require("path");

var OUT = path.join(__dirname, "../public/assets/images/hub/icons");

var wrap = function (body) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">\n' +
    body +
    "\n</svg>\n"
  );
};

var ICONS = {
  "mobile-recharge.svg": wrap(
    '<rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M10 18h4M12 7v4M12 11l2 2" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  "dth.svg": wrap(
    '<rect x="4" y="8" width="16" height="10" rx="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M8 8V5a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.75"/>' +
      '<circle cx="12" cy="13" r="1.5" fill="currentColor"/>',
  ),
  "subscription.svg": wrap(
    '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M10 9.5v5l4.5-2.5-4.5-2.5z" fill="currentColor"/>',
  ),
  "fastag.svg": wrap(
    '<path d="M5 17h14l-1.5-9H6.5L5 17z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<circle cx="8" cy="17" r="1.5" fill="currentColor"/><circle cx="16" cy="17" r="1.5" fill="currentColor"/>' +
      '<path d="M9 8h6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "apple-store.svg": wrap(
    '<path d="M12 4c-1.5 2.5-3.5 3-5 3 0 4 2 8 5 11 3-3 5-7 5-11-1.5 0-3.5-.5-5-3z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<path d="M12 7v10" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "ev-recharge.svg": wrap(
    '<path d="M5 17h11l1-6H7l-2 6z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<circle cx="8.5" cy="17" r="1.25" fill="currentColor"/><circle cx="13.5" cy="17" r="1.25" fill="currentColor"/>' +
      '<path d="M16 10h3v4h-3l1.5-2-1.5-2z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>',
  ),
  "get-sim.svg": wrap(
    '<path d="M8 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M9 8h6M9 12h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "datacard.svg": wrap(
    '<rect x="5" y="6" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<path d="M16 4v3M8 4v3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "landline.svg": wrap(
    '<path d="M6 4h4l2 4-2 1a11 11 0 0 0 5 5l1-2 4 2v4a2 2 0 0 1-2 2 9 9 0 0 1-9-9 2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>',
  ),
  "metro.svg": wrap(
    '<rect x="4" y="9" width="16" height="8" rx="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M8 17v2M16 17v2M4 13h16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<circle cx="8" cy="13" r="1" fill="currentColor"/><circle cx="16" cy="13" r="1" fill="currentColor"/>',
  ),
  "broadband.svg": wrap(
    '<path d="M5 12.5a7 7 0 0 1 14 0" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<path d="M8.5 15.5a4 4 0 0 1 7 0" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<circle cx="12" cy="18" r="1.25" fill="currentColor"/>',
  ),
  "to-mobile-number.svg": wrap(
    '<rect x="8" y="3" width="8" height="14" rx="1.5" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M4 12h3l2-2 2 4 2-4 2 2h3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  "to-bank-self-ac.svg": wrap(
    '<path d="M4 20h16M6 20V10l6-4 6 4v10" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<circle cx="12" cy="14" r="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M12 12v-1" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "check-balance.svg": wrap(
    '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" opacity="0"/>',
  ),
  "travel-flight.svg": wrap(
    '<path d="M3 12h5l2-5 4 10 2-5h5" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round"/>',
  ),
  "travel-bus.svg": wrap(
    '<rect x="4" y="7" width="16" height="10" rx="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M8 17v2M16 17v2M4 12h16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<circle cx="8" cy="12" r="1" fill="currentColor"/><circle cx="16" cy="12" r="1" fill="currentColor"/>',
  ),
  "travel-train.svg": wrap(
    '<rect x="5" y="6" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M8 17v2M16 17v2M5 11h14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/>',
  ),
  "travel-hotel.svg": wrap(
    '<path d="M4 20V8l8-4 8 4v12" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<path d="M9 20v-6h6v6M12 8v3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "insurance-bike.svg": wrap(
    '<circle cx="6" cy="17" r="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<circle cx="18" cy="17" r="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M8 17h8M10 12l2-4h2l2 4" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>',
  ),
  "insurance-car.svg": wrap(
    '<path d="M5 17h14l-1.5-8H6.5L5 17z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<circle cx="8" cy="17" r="1.5" fill="currentColor"/><circle cx="16" cy="17" r="1.5" fill="currentColor"/>',
  ),
  "insurance-health.svg": wrap(
    '<path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.75"/>',
  ),
  "insurance-term.svg": wrap(
    '<path d="M12 3 5 6.5V12c0 4.2 3 7.4 7 8.5 4-1.1 7-4.3 7-8.5V6.5L12 3z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<path d="M12 8v5M9.5 10.5h5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "digigold.svg": wrap(
    '<circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M12 7v10M9 10h6M9 14h6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "buy-gold.svg": wrap(
    '<path d="M8 16l4-8 4 8H8z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<path d="M6 16h12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "daily-gold-savings.svg": wrap(
    '<rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<circle cx="16" cy="4" r="2" stroke="currentColor" stroke-width="1.75"/>',
  ),
  "buy-silver.svg": wrap(
    '<rect x="6" y="8" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M8 16h8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "daily-silver-saving.svg": wrap(
    '<rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<path d="M16 4v4M14 6h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "smart-sip.svg": wrap(
    '<path d="M5 18V6M5 18h14M19 10l-3 3-2-4-2 4-3-3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  "gift-gold-silver.svg": wrap(
    '<rect x="4" y="8" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M12 8V5M9.5 6.5h5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<path d="M12 12v4M10 14h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "family-vault.svg": wrap(
    '<rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" stroke-width="1.75"/>' +
      '<circle cx="12" cy="15" r="1.25" fill="currentColor"/>',
  ),
  "profit-loss.svg": wrap(
    '<path d="M4 19V5M4 19h16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<path d="M8 14l3-4 3 2 4-7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  "price-alerts.svg": wrap(
    '<path d="M12 4a6 6 0 0 0-6 6v2l-2 2h16l-2-2v-2a6 6 0 0 0-6-6z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<path d="M10 20h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "sell-gold-silver.svg": wrap(
    '<path d="M7 15l5-8 5 8H7z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<path d="M5 15h14M12 11v6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "convert-physical-gold.svg": wrap(
    '<rect x="7" y="6" width="10" height="12" rx="1" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M9 4h6v2H9V4zM12 14v4M10 18h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "convert-physical-silver.svg": wrap(
    '<rect x="7" y="6" width="10" height="12" rx="1" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M9 4h6v2H9V4zM10 18h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "transaction-history.svg": wrap(
    '<path d="M6 4h12v16H6z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<path d="M14 4v3h3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "tax-capital-gain.svg": wrap(
    '<path d="M7 4h10v16H7z" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<path d="M16 6l2 2" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "annual-statement.svg": wrap(
    '<path d="M6 3h12v18H6z" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<path d="M9 3v3h6V3" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>',
  ),
  "financial.svg": wrap(
    '<path d="M4 19V5M4 19h16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<path d="M8 15V11M12 15V8M16 15v-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "investments.svg": wrap(
    '<path d="M4 18V6M20 18H4M16 10l-3 3-2-4-2 4-3-3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  "budget.svg": wrap(
    '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M12 12V7M12 12h4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "generic.svg": wrap(
    '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "mobile.svg": wrap(
    '<rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" stroke-width="1.75"/>' +
      '<path d="M10 18h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ),
  "money-transfer.svg": wrap(
    '<path d="M7 12h10M14 9l3 3-3 3M10 9L7 12l3 3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
};

fs.mkdirSync(OUT, { recursive: true });
Object.keys(ICONS).forEach(function (name) {
  fs.writeFileSync(path.join(OUT, name), ICONS[name], "utf8");
  console.log("wrote", name);
});

console.log("Done:", Object.keys(ICONS).length, "icons");

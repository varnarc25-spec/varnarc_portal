var fetchServiceSections = require("./sections").fetchServiceSections;
var fetchServiceCategories = require("./categories").fetchServiceCategories;
var fetchServiceMenuItems = require("./menuitems").fetchServiceMenuItems;
var fetchPopularServices = require("./popular").fetchPopularServices;
var fetchPublicFaqs = require("./faqs").fetchPublicFaqs;
var fetchWebcomponentsRows = require("./webcomponents").fetchWebcomponentsRows;
var fetchWebBannersRows = require("./webbanners").fetchWebBannersRows;
var detectMobileOperator = require("./services/mobile-detect-operator").detectMobileOperator;
var MARG_API_BASE_URL = require("./config").MARG_API_BASE_URL;

module.exports = {
  MARG_API_BASE_URL: MARG_API_BASE_URL,
  fetchServiceSections: fetchServiceSections,
  fetchServiceCategories: fetchServiceCategories,
  fetchServiceMenuItems: fetchServiceMenuItems,
  fetchPopularServices: fetchPopularServices,
  fetchPublicFaqs: fetchPublicFaqs,
  fetchWebcomponentsRows: fetchWebcomponentsRows,
  fetchWebBannersRows: fetchWebBannersRows,
  detectMobileOperator: detectMobileOperator,
};

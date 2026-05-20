#!/usr/bin/env node
/**
 * Writes views/pages/services/<PascalSection>/<snake_name>.ejs per menu leaf
 * and <PascalSection>/index.ejs (static hub pages under views/pages/services/<Section>/index.ejs).
 * Re-run after menu/API changes: npm run generate:service-pages
 */

var fs = require("fs");
var path = require("path");

var fetchLandingBundle = require("../lib/landing-bundle").fetchLandingBundle;
var buildMenuSections = require("../lib/menu-sections-from-tabs").buildMenuSections;
var computeStaticServicePaths = require("../lib/service-leaf-urls-map").computeStaticServicePaths;

var viewsRoot = path.join(__dirname, "..", "views");
var servicesRoot = path.join(viewsRoot, "pages", "services");

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function upPrefix(relPath) {
  var n = String(relPath || "")
    .split("/")
    .filter(Boolean).length;
  return "../".repeat(n + 1);
}

function findItemContextInTree(menuSections, itemId) {
  var want = String(itemId);
  for (var s = 0; s < menuSections.length; s++) {
    var section = menuSections[s];
    var cats = section.categories || [];
    for (var c = 0; c < cats.length; c++) {
      var cat = cats[c];
      var subs = cat.subcategories || [];
      for (var u = 0; u < subs.length; u++) {
        var sub = subs[u];
        var items = sub.items || [];
        for (var i = 0; i < items.length; i++) {
          if (String(items[i].id) === want) {
            return { section: section, category: cat, subcategory: sub, item: items[i] };
          }
        }
      }
      var citems = cat.items || [];
      for (var j = 0; j < citems.length; j++) {
        if (String(citems[j].id) === want) {
          return { section: section, category: cat, subcategory: null, item: citems[j] };
        }
      }
    }
  }
  return null;
}

function writeLeafFile(relPath, ctx) {
  var up = upPrefix(relPath);
  var row = ctx.item || {};
  var desc = row.description || row.summary || row.subtitle || "";
  var filePath = path.join(servicesRoot, relPath + ".ejs");
  var dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  var iconBlock = row.icon_url
    ? '        <div class="col-auto">\n' +
      '          <img src="' +
      escapeHtml(row.icon_url) +
      '" alt="" class="rounded-3 service-item-icon" style="width:72px;height:72px;object-fit:contain;">\n' +
      "        </div>\n"
    : "";

  var descBlock = desc
    ? '          <p class="lead text-muted mb-0">' + escapeHtml(desc) + "</p>\n"
    : '          <p class="text-muted mb-3">Add your form and content below. This file: <code>views/pages/services/' +
      escapeHtml(relPath) +
      ".ejs</code></p>\n" +
      '          <div class="service-page-custom-placeholder border rounded p-4 bg-light">\n' +
      '            <p class="mb-0 text-muted small">Replace this block with your unique form and layout.</p>\n' +
      "          </div>\n";

  var body =
    "<!DOCTYPE html>\n" +
    '<html lang="en">\n' +
    "\n" +
    "<%- include('" +
    up +
    "components/landing/head') %>\n" +
    "\n" +
    '<body class="landing-page service-item-page">\n' +
    '  <div class="landing-page1">\n' +
    "    <div class=\"sticky-header\"><%- include('" +
    up +
    "components/landing/header') %></div>\n" +
    "  </div>\n" +
    "\n" +
    '  <section class="section-space service-item-section">\n' +
    '    <div class="container text-start py-4">\n' +
    '      <div class="row align-items-start g-4">\n' +
    iconBlock +
    '        <div class="col">\n' +
    '          <h1 class="h2 mb-3">' +
    escapeHtml(row.name || "Service") +
    "</h1>\n" +
    descBlock +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </section>\n" +
    "\n" +
    "<%- include('" +
    up +
    "components/landing/footer') %>\n" +
    "<%- include('" +
    up +
    "components/landing/scripts') %>\n" +
    "</body>\n" +
    "\n" +
    "</html>\n";

  fs.writeFileSync(filePath, body, "utf8");
  console.log("Wrote", path.relative(viewsRoot, filePath));
}

function writeSectionIndex(folderName, sectionTitle, links) {
  var filePath = path.join(servicesRoot, folderName, "index.ejs");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  if (fs.existsSync(filePath)) {
    console.log("Skip index (hand-maintained hub):", path.relative(viewsRoot, filePath));
    return;
  }

  console.warn(
    "No index template for",
    folderName,
    "— add views/pages/services/" + folderName + "/index.ejs manually.",
  );
}

fetchLandingBundle()
  .then(function (data) {
    /* Custom leaf templates — do not overwrite when running npm run generate:service-pages */
    var SKIP_LEAF_FILES = {
      "BillPayments/book_cylinder": true,
      "BillPayments/broadband_landline": true,
      "BillPayments/credit_card_bill": true,
      "BillPayments/education_fee": true,
      "BillPayments/lic_insurance": true,
      "BillPayments/electricity": true,
      "BillPayments/loan_repayment": true,
      "BillPayments/mobile_postpaid": true,
      "BillPayments/municipal_tax": true,
      "BillPayments/piped_gas": true,
      "BillPayments/water": true,
      "Recharge/fastag_recharge": true,
      "Recharge/subscription": true,
    };

    var menuSections = buildMenuSections(data.landingMenuTabs);
    var paths = computeStaticServicePaths(menuSections);
    var byItemId = paths.byItemId;
    /* Renamed in product: prepaid meter → same leaf as piped gas (menu/API may still use old label). */
    byItemId["d8987a99-4f44-42be-82f3-5e0baccb7a56"] = "BillPayments/piped_gas";

    var sectionFolders = paths.sectionFolders;

    Object.keys(byItemId).forEach(function (id) {
      var rel = byItemId[id];
      var ctx = findItemContextInTree(menuSections, id);
      if (!ctx) {
        console.warn("Skip missing context for item id", id);
        return;
      }
      if (SKIP_LEAF_FILES[rel]) {
        console.log("Skip custom leaf template:", rel);
        return;
      }
      writeLeafFile(rel, ctx);
    });

    var linksByFolder = {};
    Object.keys(byItemId).forEach(function (id) {
      var rel = byItemId[id];
      var folder = rel.split("/")[0];
      if (!linksByFolder[folder]) linksByFolder[folder] = [];
      var ctx = findItemContextInTree(menuSections, id);
      var title = (ctx && ctx.item && ctx.item.name) || "Service";
      linksByFolder[folder].push({
        href: "/services/" + rel,
        title: title,
      });
    });

    sectionFolders.forEach(function (sf) {
      var links = linksByFolder[sf.folder] || [];
      links.sort(function (a, b) {
        return String(a.title).localeCompare(String(b.title));
      });
      writeSectionIndex(sf.folder, sf.name, links);
    });

    var manifestPath = path.join(__dirname, "..", "lib", "service-leaf-urls.generated.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          byItemId: byItemId,
        },
        null,
        2,
      ),
      "utf8",
    );
    console.log("Wrote", path.relative(path.join(__dirname, ".."), manifestPath));
    console.log("Done. Pages:", Object.keys(byItemId).length);
  })
  .catch(function (err) {
    console.error(err);
    process.exit(1);
  });

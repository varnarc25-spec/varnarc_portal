/**
 * Paths like views/pages/services/MoneyTransfer/to_mobile_transfer.ejs
 * (PascalCase section folder + snake_case filename).
 */

var sectionCounts = {};

function resetSectionFolderCounts() {
  sectionCounts = {};
}

/** PascalCase folder for URLs / View all (no duplicate suffix). */
function sectionFolderBaseName(section) {
  var slug = section && section.slug ? String(section.slug) : "";
  var name = section && section.name ? String(section.name) : "";
  var raw = slug || name || "Section";
  var parts = raw.split(/[\s/_-]+/).filter(Boolean);
  var pascal = parts
    .map(function (p) {
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    })
    .join("");
  return pascal || "Section";
}

/** Unique folder when multiple API sections map to the same Pascal name (file paths). */
function sectionFolderName(section) {
  var pascal = sectionFolderBaseName(section);

  if (!sectionCounts[pascal]) sectionCounts[pascal] = 0;
  sectionCounts[pascal]++;
  if (sectionCounts[pascal] > 1) {
    return pascal + sectionCounts[pascal];
  }
  return pascal;
}

function toSnakeFileSlug(label) {
  var t = String(label || "item")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return t || "item";
}

function buildLeafRelPath(folder, item, usedInSection) {
  var base = toSnakeFileSlug(item && item.name);
  var key = folder + "/" + base;
  if (!usedInSection[key]) {
    usedInSection[key] = 1;
    return folder + "/" + base;
  }
  var n = usedInSection[key];
  usedInSection[key] = n + 1;
  return folder + "/" + base + "_" + (n + 1);
}

module.exports = {
  resetSectionFolderCounts: resetSectionFolderCounts,
  sectionFolderBaseName: sectionFolderBaseName,
  sectionFolderName: sectionFolderName,
  toSnakeFileSlug: toSnakeFileSlug,
  buildLeafRelPath: buildLeafRelPath,
};

/**
 * Match views/pages/services/<PascalFolder>/index.ejs to menuSectionsTree entry.
 * Uses base folder names (Recharge, BillPayments) — not suffixed paths (Recharge2).
 */

var sectionFolderBaseName = require("./service-static-paths").sectionFolderBaseName;
var sectionFolderName = require("./service-static-paths").sectionFolderName;
var resetSectionFolderCounts = require("./service-static-paths").resetSectionFolderCounts;

function findMenuSectionByFolder(menuSections, folder) {
  var want = String(folder || "");
  var sections = menuSections || [];
  var i;

  for (i = 0; i < sections.length; i++) {
    if (sectionFolderBaseName(sections[i]) === want) {
      return sections[i];
    }
  }

  /* Disambiguated folders from generate:service-pages (e.g. Recharge2). */
  resetSectionFolderCounts();
  for (i = 0; i < sections.length; i++) {
    if (sectionFolderName(sections[i]) === want) {
      return sections[i];
    }
  }

  return null;
}

module.exports = {
  findMenuSectionByFolder: findMenuSectionByFolder,
};

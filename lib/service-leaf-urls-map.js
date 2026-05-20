var staticPaths = require("./service-static-paths");

function sectionKey(section) {
  if (!section) return "";
  if (section.id != null && section.id !== "") return String(section.id);
  return String(section.slug || section.name || "");
}

/**
 * @returns {{
 *   byItemId: Record<string, string>,
 *   sectionFolders: Array<{ folder: string, name: string, slug: string }>,
 *   folderBySectionKey: Record<string, string>
 * }}
 */
function computeStaticServicePaths(menuSections) {
  staticPaths.resetSectionFolderCounts();
  var sections = menuSections || [];
  var folderAssignments = sections.map(function (section) {
    return {
      folder: staticPaths.sectionFolderName(section),
      section: section,
    };
  });

  var map = {};
  var usedInSection = {};
  var folderBySectionKey = {};

  folderAssignments.forEach(function (a) {
    folderBySectionKey[sectionKey(a.section)] = a.folder;
  });

  folderAssignments.forEach(function (a) {
    var folder = a.folder;
    var section = a.section;
    var cats = section.categories || [];
    for (var c = 0; c < cats.length; c++) {
      var cat = cats[c];
      var subs = cat.subcategories || [];
      for (var u = 0; u < subs.length; u++) {
        var sub = subs[u];
        var items = sub.items || [];
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          if (item && item.id != null && item.id !== "") {
            map[String(item.id)] = staticPaths.buildLeafRelPath(folder, item, usedInSection);
          }
        }
      }
      var citems = cat.items || [];
      for (var j = 0; j < citems.length; j++) {
        var citem = citems[j];
        if (citem && citem.id != null && citem.id !== "") {
          map[String(citem.id)] = staticPaths.buildLeafRelPath(folder, citem, usedInSection);
        }
      }
    }
  });

  var sectionFolders = folderAssignments.map(function (a) {
    return {
      folder: a.folder,
      name: a.section.name || "Services",
      slug: a.section.slug || "",
    };
  });

  return {
    byItemId: map,
    sectionFolders: sectionFolders,
    folderBySectionKey: folderBySectionKey,
  };
}

module.exports = {
  computeStaticServicePaths: computeStaticServicePaths,
};

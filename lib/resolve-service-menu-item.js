/**
 * Resolve hierarchy + leaf row from flat menu-items API rows for a section.
 */

function alphaValue(val) {
  return String(val || "").toLowerCase();
}

function findItemContext(section, rows, itemIdStr) {
  if (!section || !Array.isArray(rows)) return null;
  var idNeed = String(itemIdStr);

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i] || {};
    if (String(row.id) !== idNeed) continue;

    var categoryKey = row.category_id || row.category_slug || row.category_name || "general";
    var categoryName = row.category_name || row.category || "General";
    var categorySlug = row.category_slug || null;

    var hasSub = Boolean(
      row.subcategory_id || row.subcategory_slug || row.subcategory_name || row.sub_category,
    );
    var subName = row.subcategory_name || row.sub_category || null;
    var subSlug = row.subcategory_slug || null;

    return {
      section: section,
      item: row,
      category: {
        key: categoryKey,
        name: categoryName,
        slug: categorySlug,
      },
      subcategory: hasSub
        ? {
            name: subName || "Other",
            slug: subSlug,
          }
        : null,
    };
  }

  return null;
}

module.exports = {
  findItemContext: findItemContext,
  alphaValue: alphaValue,
};

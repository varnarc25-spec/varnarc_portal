/**
 * Same mega-menu tree as views/components/landing/header.ejs (menuSections).
 */

function alphaValue(val) {
  return String(val || "").toLowerCase();
}

function toSortedArray(mapObj, sortFn) {
  return Object.keys(mapObj)
    .map(function (key) {
      return mapObj[key];
    })
    .sort(sortFn);
}

function buildMenuSections(landingMenuTabs) {
  var menuTabs = Array.isArray(landingMenuTabs) ? landingMenuTabs : [];
  return menuTabs
    .map(function (tab) {
      var section = tab && tab.section ? tab.section : {};
      var items = Array.isArray(tab && tab.items) ? tab.items : [];
      var categoryMap = {};

      items.forEach(function (item) {
        var row = item || {};
        var categoryKey = row.category_id || row.category_slug || row.category_name || "general";
        if (!categoryMap[categoryKey]) {
          categoryMap[categoryKey] = {
            key: categoryKey,
            id: row.category_id || null,
            slug: row.category_slug || null,
            name: row.category_name || row.category || "General",
            order: Number.isFinite(Number(row.category_display_order))
              ? Number(row.category_display_order)
              : 9999,
            subcategoriesMap: {},
            items: [],
          };
        }

        var hasSubCategory = Boolean(
          row.subcategory_id || row.subcategory_slug || row.subcategory_name || row.sub_category,
        );
        if (hasSubCategory) {
          var subKey = row.subcategory_id || row.subcategory_slug || row.subcategory_name || row.sub_category;
          if (!categoryMap[categoryKey].subcategoriesMap[subKey]) {
            categoryMap[categoryKey].subcategoriesMap[subKey] = {
              key: subKey,
              id: row.subcategory_id || null,
              slug: row.subcategory_slug || null,
              name: row.subcategory_name || row.sub_category || "Other",
              order: Number.isFinite(Number(row.subcategory_display_order))
                ? Number(row.subcategory_display_order)
                : 9999,
              items: [],
            };
          }
          categoryMap[categoryKey].subcategoriesMap[subKey].items.push(row);
        } else {
          categoryMap[categoryKey].items.push(row);
        }
      });

      var categories = toSortedArray(categoryMap, function (a, b) {
        if (a.order !== b.order) return a.order - b.order;
        return alphaValue(a.name).localeCompare(alphaValue(b.name));
      }).map(function (category) {
        var subcategories = toSortedArray(category.subcategoriesMap, function (a, b) {
          if (a.order !== b.order) return a.order - b.order;
          return alphaValue(a.name).localeCompare(alphaValue(b.name));
        }).map(function (sub) {
          sub.items = sub.items.sort(function (a, b) {
            var aOrder = Number.isFinite(Number(a.display_order)) ? Number(a.display_order) : 9999;
            var bOrder = Number.isFinite(Number(b.display_order)) ? Number(b.display_order) : 9999;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return alphaValue(a.name).localeCompare(alphaValue(b.name));
          });
          return sub;
        });

        category.items = category.items.sort(function (a, b) {
          var aOrder = Number.isFinite(Number(a.display_order)) ? Number(a.display_order) : 9999;
          var bOrder = Number.isFinite(Number(b.display_order)) ? Number(b.display_order) : 9999;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return alphaValue(a.name).localeCompare(alphaValue(b.name));
        });
        category.subcategories = subcategories;
        return category;
      });

      return {
        id: section.id || null,
        slug: section.slug || "",
        order: Number.isFinite(Number(section.display_order)) ? Number(section.display_order) : 9999,
        name: section.name || "Services",
        categories: categories,
      };
    })
    .sort(function (a, b) {
      if (a.order !== b.order) return a.order - b.order;
      return alphaValue(a.name).localeCompare(alphaValue(b.name));
    });
}

module.exports = {
  buildMenuSections: buildMenuSections,
};

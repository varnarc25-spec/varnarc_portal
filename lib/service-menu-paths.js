/**
 * URL helpers for API-driven mega menu (section "folder" + item pages).
 */

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

/**
 * @param {string} sectionSlug - from API section.slug
 * @param {{ id?: * }} item - menu item row
 * @returns {string}
 */
function buildItemUrl(sectionSlug, item) {
  if (!sectionSlug || !item || item.id == null || item.id === "") {
    return "#";
  }
  var sec = encodeURIComponent(String(sectionSlug).trim());
  var id = encodeURIComponent(String(item.id));
  return "/services/" + sec + "/item/" + id;
}

/**
 * @param {string} sectionSlug
 * @returns {string}
 */
function buildSectionUrl(sectionSlug) {
  if (!sectionSlug) return "#";
  return "/services/" + encodeURIComponent(String(sectionSlug).trim());
}

/**
 * @param {object} section - API section object
 * @param {string} param - URL segment (case-insensitive)
 */
function sectionSlugMatches(section, param) {
  if (!section || !param) return false;
  var p = String(param).toLowerCase().trim();
  if (section.slug && String(section.slug).toLowerCase() === p) return true;
  if (slugify(section.name) === p) return true;
  return false;
}

module.exports = {
  slugify: slugify,
  buildItemUrl: buildItemUrl,
  buildSectionUrl: buildSectionUrl,
  sectionSlugMatches: sectionSlugMatches,
};

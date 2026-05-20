var express = require("express");
var fs = require("fs");
var path = require("path");
var createError = require("http-errors");
var fetchLandingBundle = require("../lib/landing-bundle").fetchLandingBundle;
var buildHubNavForIndexPage = require("../lib/section-hub-nav").buildHubNavForIndexPage;
var buildHubTemplateLocals = require("../lib/hub-ejs-helpers").buildHubTemplateLocals;
var requireVarnarcSession = require("../middleware/require-session").requireVarnarcSession;
var optionalVarnarcSession = require("../middleware/require-session").optionalVarnarcSession;
var router = express.Router();

var viewsRoot = path.join(__dirname, "..", "views");
var servicesViewsRoot = path.join(viewsRoot, "pages", "services");

var PageData = [
  { name: "according", breadcrumbData: { name: "Ui Kits", subName: "accordion" } },
  { name: "gallery", breadcrumbData: { name: "Gallery", subName: "Gallery" } },
  { name: "ace-code-editor", breadcrumbData: { name: "Editors", subName: "ACE Code Editor" } },
  { name: "gallery-hover", breadcrumbData: { name: "Gallery", subName: "Image Hover Effects" } },
  { name: "add-post", breadcrumbData: { name: "Blog", subName: "Add Post" } },
  { name: "alert", breadcrumbData: { name: "Ui Kits", subName: "alert" } },
  { name: "gallery-with-description", breadcrumbData: { name: "Gallery", subName: "Masonry Gallery With Description" } },
  { name: "animate", breadcrumbData: { name: "Animation", subName: "Animate" } },
  { name: "general-widget", breadcrumbData: { name: "Widgets", subName: "General" } },
  { name: "AOS", breadcrumbData: { name: "Animation", subName: "AOS Animation" } },
  { name: "grid", breadcrumbData: { name: "Ui Kits", subName: "grid" } },
  { name: "avatars", breadcrumbData: { name: "Ui Kits", subName: "Avatars" } },
  { name: "helper-classes", breadcrumbData: { name: "Ui Kits", subName: "Helper Classes" } },
  { name: "base-input", breadcrumbData: { name: "Form Controls", subName: "Base Inputs" } },

  { name: "basic-card", breadcrumbData: { name: "Bonus Ui", subName: "Basic Card" } },
  { name: "ico-icon", breadcrumbData: { name: "Icons", subName: "ICO Icon" } },
  { name: "image-cropper", breadcrumbData: { name: "Bonus Ui", subName: "Image Cropper" } },
  { name: "blog", breadcrumbData: { name: "Blog", subName: "Blog Details" } },
  { name: "index", breadcrumbData: { name: "Dashboard", subName: "Default" } },
  { name: "blog-single", breadcrumbData: { name: "Blog", subName: "Blog Single" } },
  { name: "input-group", breadcrumbData: { name: "Form Controls", subName: "Input Groups" } },
  { name: "bookmark", breadcrumbData: { name: "Apps", subName: "Bookmark" } },
  { name: "internationalization", breadcrumbData: { name: "Pages", subName: "Internationalization" } },
  { name: "bootstrap-basic-table", breadcrumbData: { name: "Bootstrap Tables", subName: "Bootstrap Basic Tables" } },
  { name: "invoice-template", breadcrumbData: { name: "Ecommerce", subName: "Invoice" } },
  { name: "bootstrap-border-table", breadcrumbData: { name: "Bootstrap Tables", subName: "Bootstrap Border Table" } },
  { name: "job-apply", breadcrumbData: { name: "Job", subName: "Apply Job" } },
  { name: "bootstrap-notify", breadcrumbData: { name: "Bonus Ui", subName: "Bootstrap Notify" } },
  { name: "job-cards-view", breadcrumbData: { name: "Job Search", subName: "Cards View" } },
  { name: "bootstrap-sizing-table", breadcrumbData: { name: "Bootstrap Tables", subName: "Bootstrap Table Sizes" } },
  { name: "job-details", breadcrumbData: { name: "Job Search", subName: "Job Details" } },
  { name: "bootstrap-styling-table", breadcrumbData: { name: "Bootstrap Tables", subName: "Bootstrap Styling Tables" } },
  { name: "job-list-view", breadcrumbData: { name: "Job Search", subName: "List View" } },

  { name: "jsgrid-table", breadcrumbData: { name: "Tables", subName: "JS Grid Tables" } },
  { name: "box-shadow", breadcrumbData: { name: "Ui Kits", subName: "Box Shadow" } },
  { name: "kanban", breadcrumbData: { name: "Apps", subName: "Kanban Board" } },
  { name: "breadcrumb", breadcrumbData: { name: "Bonus Ui", subName: "Breadcrumb" } },
  { name: "knowledgebase", breadcrumbData: { name: "Knowledge Base", subName: "Knowledge Base" } },
  { name: "button-builder", breadcrumbData: { name: "Form Builder", subName: "Button Builder" } },
  { name: "button-group", breadcrumbData: { name: "Buttons", subName: "Button Group" } },
  { name: "buttons-edge", breadcrumbData: { name: "Buttons", subName: "edge" } },
  { name: "layout-light", breadcrumbData: { name: "Light", subName: "Light Layout" } },
  { name: "buttons", breadcrumbData: { name: "Buttons", subName: "Default Style" } },

  { name: "buttons-flat", breadcrumbData: { name: "Buttons", subName: "Flat Buttons" } },
  { name: "learning-detailed", breadcrumbData: { name: "Learning", subName: "Detailed Course" } },
  { name: "calendar-advanced", breadcrumbData: { name: "Calendar", subName: "Calendar Advanced" } },
  { name: "learning-list-view", breadcrumbData: { name: "Learning", subName: "Learning List" } },
  { name: "calendar-basic", breadcrumbData: { name: "Calendar", subName: "Calendar Basic" } },
  { name: "list", breadcrumbData: { name: "Ui Kits", subName: "Lists" } },
  { name: "calendar", breadcrumbData: { name: "Calendar", subName: "Calendar" } },
  { name: "list-products", breadcrumbData: { name: "Ecommerce", subName: "Product List" } },
  { name: "calendar-event", breadcrumbData: { name: "Calendar", subName: "Calendar Event" } },
  { name: "list-wish", breadcrumbData: { name: "Ecommerce", subName: "Wishlist" } },
  { name: "loader", breadcrumbData: { name: "Ui Kits", subName: "Loader" } },
  { name: "calendar-weekly", breadcrumbData: { name: "Calendar", subName: "Calendar Weekly" } },
  { name: "calender-basic", breadcrumbData: { name: "Apps", subName: "Calender Basic" } },
  { name: "cart", breadcrumbData: { name: "Ecommerce", subName: "Cart" } },
  { name: "chart-apex", breadcrumbData: { name: "charts", subName: "Apex Chart" } },
  { name: "chart-flot", breadcrumbData: { name: "charts", subName: "flot" } },
  { name: "chart-google", breadcrumbData: { name: "charts", subName: "Google Chart" } },
  { name: "chartist", breadcrumbData: { name: "charts", subName: "chartist" } },
  { name: "chartjs", breadcrumbData: { name: "charts", subName: "ChartJS Chart" } },
  { name: "map-js", breadcrumbData: { name: "Maps", subName: "Map JS" } },
  { name: "chart-knob", breadcrumbData: { name: "charts", subName: "Knob Chart" } },
  { name: "masonry-gallery-with-disc", breadcrumbData: { name: "Gallery", subName: "Masonry Gallery With Disc" } },
  { name: "chart-morris", breadcrumbData: { name: "charts", subName: "Morris Chart" } },
  { name: "megaoptions", breadcrumbData: { name: "Form control", subName: "Mega Options" } },
  { name: "chart-peity", breadcrumbData: { name: "charts", subName: "Peity Chart" } },
  { name: "modal-animated", breadcrumbData: { name: "Bonus Ui", subName: "Animated Modal" } },
  { name: "chart-sparkline", breadcrumbData: { name: "charts", subName: "sparkline" } },
  { name: "modal", breadcrumbData: { name: "Ui Kits", subName: "modal" } },
  { name: "chart-widget", breadcrumbData: { name: "Widgets", subName: "Chart" } },
  { name: "order-history", breadcrumbData: { name: "Ecommerce", subName: "Recent Orders" } },
  { name: "chat", breadcrumbData: { name: "Chat", subName: "Chat App" } },
  { name: "owl-carousel", breadcrumbData: { name: "Bonus Ui", subName: "Owl Carousel" } },
  { name: "chat-video", breadcrumbData: { name: "Chat", subName: "Chat Video" } },
  { name: "pagebuild", breadcrumbData: { name: "Builders", subName: "Page Builder" } },
  { name: "checkout", breadcrumbData: { name: "Ecommerce", subName: "Checkout" } },
  { name: "pagination", breadcrumbData: { name: "Bonus Ui", subName: "Pagination" } },
  { name: "ckeditor", breadcrumbData: { name: "Editors", subName: "Ck Editor" } },
  { name: "clipboard", breadcrumbData: { name: "Form Widgets", subName: "Clipboard" } },
  { name: "payment-details", breadcrumbData: { name: "Ecommerce", subName: "Payment Details" } },
  { name: "popover", breadcrumbData: { name: "Ui Kits", subName: "popover" } },
  { name: "pricing", breadcrumbData: { name: "Ecommerce", subName: "Pricing" } },
  { name: "product", breadcrumbData: { name: "Ecommerce", subName: "Product" } },
  { name: "compact-dark", breadcrumbData: { name: "Layout", subName: "Compact Dark" } },
  { name: "product-page", breadcrumbData: { name: "Ecommerce", subName: "Product Page" } },
  { name: "compact", breadcrumbData: { name: "Layout", subName: "Compact" } },
  { name: "progress-bar", breadcrumbData: { name: "Ui Kits", subName: "Progress" } },
  { name: "contacts", breadcrumbData: { name: "Apps", subName: "Contacts" } },
  { name: "projectcreate", breadcrumbData: { name: "Apps", subName: "Project Create" } },
  { name: "creative-card", breadcrumbData: { name: "Bonus Ui", subName: "Creative Card" } },
  { name: "projectdetails", breadcrumbData: { name: "Project", subName: "Project Details" } },
  { name: "dashboard-02", breadcrumbData: { name: "Dashboard", subName: "Ecommerce" } },
  { name: "dashboard-03", breadcrumbData: { name: "Dashboard", subName: "Online Course" } },
  { name: "dashboard-04", breadcrumbData: { name: "Dashboard", subName: "Crypto" } },
  { name: "dashboard-05", breadcrumbData: { name: "Dashboard", subName: "Social" } },
  { name: "projects", breadcrumbData: { name: "Apps", subName: "Project List" } },
  { name: "datatable-advance", breadcrumbData: { name: "Data Tables", subName: "Advanced DataTables" } },
  { name: "radio-checkbox-control", breadcrumbData: { name: "Form Controls", subName: "Checkbox & Radio" } },
  { name: "datatable-AJAX", breadcrumbData: { name: "Data Tables", subName: "Ajax DataTables" } },
  { name: "raised-button", breadcrumbData: { name: "Buttons", subName: "Raised Buttons" } },
  { name: "datatable-API", breadcrumbData: { name: "Data Tables", subName: "API DataTables" } },
  { name: "range-slider", breadcrumbData: { name: "Bonus Ui", subName: "Range Slider" } },
  { name: "datatable-basic-init", breadcrumbData: { name: "Table", subName: "Data Table Basic Init" } },
  { name: "rating", breadcrumbData: { name: "Bonus Ui", subName: "rating" } },
  { name: "datatable-data-source", breadcrumbData: { name: "Data Tables", subName: "DATA Source DataTables" } },
  { name: "datatable-ext-autofill", breadcrumbData: { name: "Extension Data Tables", subName: "Autofill Datatables" } },
  { name: "ribbons", breadcrumbData: { name: "Bonus Ui", subName: "Ribbons" } },
  { name: "datatable-ext-basic-button", breadcrumbData: { name: "Extension Data Tables", subName: "Basic button" } },
  { name: "sample-page", breadcrumbData: { name: "Pages", subName: "Sample Page" } },
  { name: "datatable-ext-col-reorder", breadcrumbData: { name: "Extension Data Tables", subName: "Columns Reorder" } },
  { name: "scrollable", breadcrumbData: { name: "Bonus Ui", subName: "Scrollable" } },
  { name: "datatable-ext-fixed-header", breadcrumbData: { name: "Extension Data Tables", subName: "Fixed Header" } },
  { name: "scroll-reval", breadcrumbData: { name: "Animation", subName: "scroll reveal" } },
  { name: "datatable-ext-html-5-data-export", breadcrumbData: { name: "Extension Data Tables", subName: "HTML 5 Data Export" } },
  { name: "search", breadcrumbData: { name: "Search Pages", subName: "Search Website" } },
  { name: "datatable-ext-key-table", breadcrumbData: { name: "Extension Data Tables", subName: "Key Table" } },
  { name: "select2", breadcrumbData: { name: "Form Widgets", subName: "Select2" } },
  { name: "datatable-ext-responsive", breadcrumbData: { name: "Extension Data Tables", subName: "Responsive Datatables" } },
  { name: "semi-dark", breadcrumbData: { name: "Layouts", subName: "Semi Dark" } },
  { name: "datatable-ext-row-reorder", breadcrumbData: { name: "Extension Data Tables", subName: "Rows Reorder" } },
  { name: "datatable-ext-scroller", breadcrumbData: { name: "Extension Data Tables", subName: "Scroller" } },
  { name: "datatable-plugin", breadcrumbData: { name: "Data Tables", subName: "Plugin DataTable" } },
  { name: "datatable-server-side", breadcrumbData: { name: "Data Tables", subName: "Datatables Server Side" } },
  { name: "datatable-styling", breadcrumbData: { name: "Data Tables", subName: "Styling DataTables" } },
  { name: "simple-MDE", breadcrumbData: { name: "Editors", subName: "MDE Editor" } },
  { name: "datepicker", breadcrumbData: { name: "Form Widgets", subName: "Date Picker" } },
  { name: "social-app", breadcrumbData: { name: "Apps", subName: "Social Apps" } },
  { name: "daterangepicker", breadcrumbData: { name: "Form Widgets", subName: "Date Range Picker" } },
  { name: "datetimepicker", breadcrumbData: { name: "Form Widgets", subName: "Date Time Picker" } },
  { name: "steps", breadcrumbData: { name: "Bonus Ui", subName: "Steps" } },
  { name: "default-form", breadcrumbData: { name: "Form Layout", subName: "Default Forms" } },
  { name: "sticky", breadcrumbData: { name: "Bonus Ui", subName: "Sticky" } },
  { name: "dragable-card", breadcrumbData: { name: "Bonus Ui", subName: "Draggable Card" } },
  { name: "summernote", breadcrumbData: { name: "Editors", subName: "Summer Note" } },
  { name: "dropdown", breadcrumbData: { name: "Ui Kits", subName: "dropdown" } },
  { name: "support-ticket", breadcrumbData: { name: "Apps", subName: "Support Ticket" } },
  { name: "dropzone", breadcrumbData: { name: "Bonus Ui", subName: "dropzone" } },
  { name: "sweet-alert2", breadcrumbData: { name: "Bonus Ui", subName: "Sweet Alert" } },
  { name: "echarts", breadcrumbData: { name: "charts", subName: "Echarts" } },
  { name: "switch", breadcrumbData: { name: "Form Widgets", subName: "Switch" } },
  { name: "tabbed-card", breadcrumbData: { name: "Bonus Ui", subName: "Tabbed Card" } },
  { name: "edit-profile", breadcrumbData: { name: "Bonus Ui", subName: "Edit Profile" } },
  { name: "tab-bootstrap", breadcrumbData: { name: "Ui Kits", subName: "Bootstrap Tabs" } },
  { name: "email-application", breadcrumbData: { name: "Email", subName: "Email Application" } },
  { name: "table-components", breadcrumbData: { name: "Table", subName: "Table Components" } },
  { name: "email-compose", breadcrumbData: { name: "Email", subName: "Email Compose" } },
  { name: "tab-material", breadcrumbData: { name: "Tabs", subName: "Line Tabs" } },
  { name: "tag-pills", breadcrumbData: { name: "Ui Kills", subName: "Tag & Pills" } },
  { name: "task", breadcrumbData: { name: "Apps", subName: "Tasks" } },
  { name: "time-picker", breadcrumbData: { name: "Form", subName: "Time Picker" } },
  { name: "faq", breadcrumbData: { name: "FAQ", subName: "FAQ" } },
  { name: "to-do", breadcrumbData: { name: "Todo", subName: "Todo with database" } },
  { name: "feather-icon", breadcrumbData: { name: "Icons", subName: "Feather Icons" } },
  { name: "tooltip", breadcrumbData: { name: "Ui Kits", subName: "tooltip" } },
  { name: "file-manager", breadcrumbData: { name: "Apps", subName: "File Manager" } },
  { name: "touchspin", breadcrumbData: { name: "Ui Kits", subName: "Spinners" } },
  { name: "flag-icon", breadcrumbData: { name: "Icons", subName: "Flag Icons" } },
  { name: "tour", breadcrumbData: { name: "Bonus Ui", subName: "tour" } },
  { name: "font-awesome", breadcrumbData: { name: "Icons", subName: "Font Awesome Icon" } },
  { name: "tree", breadcrumbData: { name: "Bonus Ui", subName: "Tree View" } },
  { name: "typeahead", breadcrumbData: { name: "Form Widgets", subName: "Typeahead" } },

  { name: "typography", breadcrumbData: { name: "Ui Kits", subName: "Typography" } },
  { name: "footer-light", breadcrumbData: { name: "Page Layout", subName: "footer light" } },
  { name: "user-cards", breadcrumbData: { name: "Users", subName: "User Cards" } },
  { name: "form-builder-1", breadcrumbData: { name: "Builders", subName: "Form Builder 1" } },
  { name: "user-profile", breadcrumbData: { name: "Users", subName: "User Profile" } },
  { name: "form-builder-2", breadcrumbData: { name: "Builders", subName: "Form Builder 2" } },
  { name: "vector-map", breadcrumbData: { name: "Maps", subName: "Vector Maps" } },
  { name: "form-validation", breadcrumbData: { name: "Form Controls", subName: "Validation Forms" } },
  { name: "vertical", breadcrumbData: { name: "Layout", subName: "Vertical" } },
  { name: "form-wizard", breadcrumbData: { name: "Form Layout", subName: "Form Wizard" } },
  { name: "whether-icon", breadcrumbData: { name: "Icons", subName: "Whether Icon" } },
  { name: "form-wizard-three", breadcrumbData: { name: "Form Layout", subName: "Form Wizard With Icon" } },
  { name: "wow", breadcrumbData: { name: "Animation", subName: "Wow Animation" } },
  { name: "form-wizard-two", breadcrumbData: { name: "Form Layout", subName: "Step Form Wizard" } },
  { name: "themify-icon", breadcrumbData: { name: "Icons", subName: "Themify Icon" } },
  { name: "tilt", breadcrumbData: { name: "Animation", subName: "Tilt Animation" } },
  { name: "timeline-v-1", breadcrumbData: { name: "Bonus Ui", subName: "Timeline 1" } },
  { name: "timeline-v-2", breadcrumbData: { name: "Bonus Ui", subName: "Timeline 2" } },
  { name: "gallery-masonry", breadcrumbData: { name: "Gallery", subName: "Masonry Gallery" } },
];

var withOutLayoutPageData = [
  { name: "box-layout", breadcrumbData: { name: "Page Layout", subName: "Box Layout" } },
  { name: "layout-rtl", breadcrumbData: { name: "Page Layout", subName: "RTL" } },
  { name: "layout-dark", breadcrumbData: { name: "Page Layout", subName: "Dark Layout" } },
  { name: "hide-on-scroll", breadcrumbData: { name: "Page Layout", subName: "Hide Menu On Scroll" } },
  { name: "footer-dark", breadcrumbData: { name: "Page Layout", subName: "footer dark" } },
  { name: "footer-fixed", breadcrumbData: { name: "Page Layout", subName: "footer fix" } },
];
/* GET home page. */

router.get("/", function (req, res, next) {
  console.log("[landing] GET / — server will fetch sections (see terminal, not browser DevTools)");
  fetchLandingBundle()
    .then(function (data) {
      res.render("landing-page", Object.assign({ layout: false }, data));
    })
    .catch(next);
});

router.get("/dashboardNew", optionalVarnarcSession, function (req, res, next) {
  fetchLandingBundle()
    .then(function (data) {
      res.render("dashboardNew", Object.assign({ layout: false }, data));
    })
    .catch(next);
});

/** Legacy path: prepaid meter renamed to piped gas */
router.get("/services/BillPayments/prepaid_meter", function (req, res) {
  res.redirect(301, "/services/BillPayments/piped_gas");
});

/** Subscription moved from Bill Payments to Recharge */
router.get("/services/BillPayments/subscription", function (req, res) {
  res.redirect(301, "/services/Recharge/subscription");
});

/**
 * Static EJS files under views/pages/services/… Leaf templates + section indexes from npm run generate:service-pages.
 * Section index listings use static hub pages + hubNavEntries from menuSectionsTree (renderServicePage).
 */
router.get(/^\/services\/(.+)$/, function (req, res, next) {
  var raw = req.params[0];
  var tail;
  try {
    tail = decodeURIComponent(String(raw || ""));
  } catch (e) {
    return next(createError(404));
  }
  if (!tail || tail.indexOf("..") !== -1) {
    return next(createError(404));
  }
  var rel = tail.replace(/\/+$/, "").replace(/^\/+/, "");
  var isSectionIndexPage = /^[^/]+\/index$/i.test(rel);
  if (!isSectionIndexPage) {
    return requireVarnarcSession(req, res, function onAuthorized() {
      return renderServicePage(rel, req, res, next);
    });
  }
  return renderServicePage(rel, req, res, next);
});

function renderServicePage(rel, req, res, next) {
  var viewRel = path.join("pages", "services", rel).split(path.sep).join("/");
  var abs = path.join(viewsRoot, viewRel + ".ejs");
  var normalized = path.normalize(abs);
  var baseNorm = path.normalize(servicesViewsRoot + path.sep);
  if (normalized.length < baseNorm.length || normalized.substring(0, baseNorm.length) !== baseNorm) {
    return next(createError(404));
  }
  if (!fs.existsSync(normalized)) {
    return next(createError(404));
  }
  fetchLandingBundle()
    .then(function (data) {
      var extras = {};
      var indexMatch = /^([^/]+)\/index$/i.exec(rel);
      if (indexMatch) {
        var hubData = buildHubNavForIndexPage({
          sectionFolder: indexMatch[1],
          landingMenuTabs: data.landingMenuTabs,
          menuSectionsTree: data.menuSectionsTree,
          serviceLeafUrlByItemId: data.serviceLeafUrlByItemId,
          activeHubNavId: req.query.service,
        });
        extras.serviceSectionFolder = indexMatch[1];
        extras.serviceSectionMenu = hubData.serviceSectionMenu;
        extras.hubNavEntries = hubData.hubNavEntries;
        extras.navEntries = hubData.hubNavEntries;
        extras.activeHubNavId = hubData.activeHubNavId;
        extras.activePanelSlug = hubData.activePanelSlug;
        extras.secTitle =
          hubData.serviceSectionMenu && hubData.serviceSectionMenu.name
            ? hubData.serviceSectionMenu.name
            : indexMatch[1].replace(/([A-Z])/g, " $1").trim() || "Services";
        Object.assign(
          extras,
          buildHubTemplateLocals(Object.assign({}, data, extras)),
        );
      }
      res.render(viewRel, Object.assign({ layout: false }, data, extras));
    })
    .catch(next);
}

router.get("/pages/privacy-policy", function (req, res) {
  res.render("pages/privacy-policy", {
    layout: false,
    pageTitle: "Privacy Policy",
    pageDescription:
      "Privacy Policy for Varnarc Private Limited — how we collect, use, store, and protect personal data.",
  });
});

router.get("/pages/term-conditions", function (req, res) {
  res.render("pages/term-conditions", {
    layout: false,
    pageTitle: "Terms & Conditions",
    pageDescription: "Terms and conditions for using Varnarc Private Limited services.",
  });
});

router.get("/pages/refund-policy", function (req, res) {
  res.render("pages/refund-policy", {
    layout: false,
    pageTitle: "Refund & Cancellation Policy",
    pageDescription: "Refund and cancellation policy for Varnarc Private Limited transactions.",
  });
});

for (let i = 0; i < withOutLayoutPageData.length; i++) {
  router.get(`/${withOutLayoutPageData[i].name}`, function (req, res) {
    res.render(`${withOutLayoutPageData[i].name}`, { layout: false });
  });
}

for (let i = 0; i < PageData.length; i++) {
  const { name, subName } = PageData[i].breadcrumbData;
  router.get(`/${PageData[i].name}`, function (req, res) {
    res.render(`${PageData[i].name}`, { breadcrumbName: subName, breadcrumbPath: name });
  });
}

module.exports = router;

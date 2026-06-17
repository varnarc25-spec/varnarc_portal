(function () {
  var STORAGE_KEY = 'varnarc_company_info_v1';

  function safeParse(json) {
    try { return JSON.parse(json); } catch (_) { return null; }
  }

  function toText(v) {
    return v == null ? '' : String(v);
  }

  function applyCompanyInfo(data) {
    if (!data || typeof data !== 'object') return;

    var companyName = toText(data.company_name || data.name || data.brand_name).trim();
    var email = toText(data.email).trim();
    var phone = toText(data.phone).trim();
    var address = toText(data.address).trim();
    var footerContent = toText(data.footer_content).trim();
    var cin = toText(data.cin).trim();
    var logo = toText(data.logo).trim();
    var icon = toText(data.icon).trim();
    var loginEnable = String(data.login_enable).toLowerCase() === 'true' || data.login_enable === true;
    var socialLinks = Array.isArray(data.social_links) ? data.social_links : [];
    var footerLinks = Array.isArray(data.footer_links) ? data.footer_links : [];

    if (email) {
      document.querySelectorAll('[data-company-email-link]').forEach(function (el) {
        el.textContent = email;
        el.setAttribute('href', 'mailto:' + email);
      });
    }
    if (phone) {
      document.querySelectorAll('[data-company-phone-text]').forEach(function (el) { el.textContent = phone; });
      document.querySelectorAll('[data-company-phone-link]').forEach(function (el) {
        el.textContent = phone;
        el.setAttribute('href', 'tel:' + phone.replace(/\s+/g, ''));
      });
    }
    if (address) {
      var addr = document.querySelector('[data-company-address]');
      if (addr) addr.textContent = address;
    }
    if (footerContent) {
      var footerContentEl = document.querySelector('[data-company-footer-content]');
      if (footerContentEl) footerContentEl.textContent = footerContent;
    }
    if (cin) {
      var cinEl = document.querySelector('[data-company-cin]');
      if (cinEl) cinEl.textContent = 'CIN: ' + cin;
    }
    if (companyName) {
      document.querySelectorAll('[data-company-name]').forEach(function (el) {
        el.textContent = companyName;
      });
    }
    if (logo) {
      document.querySelectorAll('[data-company-logo]').forEach(function (img) {
        img.setAttribute('src', logo);
      });
    }
    if (icon) {
      document.querySelectorAll('[data-company-icon]').forEach(function (img) {
        img.setAttribute('src', icon);
      });
      document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(function (link) {
        link.setAttribute('href', icon);
      });
    }

    var loginNav = document.querySelector('[data-company-login-nav]');
    if (loginNav) loginNav.style.display = loginEnable ? '' : 'none';

    var socialWrap = document.querySelector('[data-company-social-links]');
    if (socialWrap && socialLinks.length) {
      socialWrap.innerHTML = '';
      socialLinks.forEach(function (item) {
        var a = document.createElement('a');
        a.href = toText(item.url || '#');
        a.target = '_blank';
        a.rel = 'noopener';
        var iconClass = toText(item.icon || '').trim();
        if (iconClass) {
          var i = document.createElement('i');
          i.className = iconClass;
          a.appendChild(i);
        } else {
          a.textContent = toText(item.label || 'Link');
        }
        socialWrap.appendChild(a);
      });
    }

    var footerLinksWrap = document.querySelector('[data-company-footer-links]');
    if (footerLinksWrap && footerLinks.length) {
      var credits = footerLinksWrap.querySelector('.credits');
      footerLinksWrap.querySelectorAll('a').forEach(function (a) {
        if (!a.closest('.credits')) a.remove();
      });
      footerLinks.forEach(function (item) {
        var a = document.createElement('a');
        a.href = toText(item.url || '#');
        a.textContent = toText(item.label || 'Link');
        footerLinksWrap.insertBefore(a, credits || null);
      });
    }
  }

  function fetchAndCacheCompanyInfo() {
    fetch('/api/company-info', { method: 'GET', credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (!json || !json.success || !json.data) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        applyCompanyInfo(json.data);
      })
      .catch(function () {});
  }

  var cached = safeParse(localStorage.getItem(STORAGE_KEY));
  if (cached && typeof cached === 'object' && Object.keys(cached).length) {
    applyCompanyInfo(cached);
  }
  // Always re-fetch on page load (including hard refresh) and refresh localStorage.
  fetchAndCacheCompanyInfo();
})();

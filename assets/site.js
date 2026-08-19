(function () {
  var scrollStorageKey = 'temveroScrollTarget';
  var allowedTargets = ['tools', 'industries', 'guides', 'about', 'featured-tool'];

  function isHomePage() {
    return window.location.pathname === '/' || /\/index\.html$/.test(window.location.pathname);
  }

  function cleanHomeUrl() {
    if (!isHomePage()) return;
    var cleanPath = window.location.pathname.replace(/index\.html$/, '');
    if (window.location.hash || cleanPath !== window.location.pathname) {
      window.history.replaceState(null, '', cleanPath + window.location.search);
    }
  }

  function scrollToSection(target, behavior) {
    var section = document.getElementById(target);
    if (section) {
      section.scrollIntoView({ behavior: behavior || 'smooth', block: 'start' });
    }
  }

  function closeMobileMenu() {
    var menu = document.querySelector('.nav-links');
    var button = document.querySelector('.mobile-menu');
    if (menu) menu.classList.remove('open');
    if (button) button.setAttribute('aria-expanded', 'false');
  }

  document.querySelectorAll('.mobile-menu').forEach(function (button) {
    button.addEventListener('click', function () {
      var menu = document.querySelector('.nav-links');
      var open = menu.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
  });

  document.querySelectorAll('[data-scroll-target]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var target = link.getAttribute('data-scroll-target');
      if (!allowedTargets.includes(target)) return;

      event.preventDefault();
      closeMobileMenu();

      if (isHomePage()) {
        cleanHomeUrl();
        scrollToSection(target, 'smooth');
        return;
      }

      try {
        window.sessionStorage.setItem(scrollStorageKey, target);
      } catch (error) {
        // The root link still provides a safe fallback if storage is unavailable.
      }
      window.location.assign('/');
    });
  });

  if (isHomePage()) {
    var legacyTarget = window.location.hash.replace(/^#/, '');
    var storedTarget = null;
    try {
      storedTarget = window.sessionStorage.getItem(scrollStorageKey);
      window.sessionStorage.removeItem(scrollStorageKey);
    } catch (error) {
      storedTarget = null;
    }

    cleanHomeUrl();

    var initialTarget = allowedTargets.includes(storedTarget)
      ? storedTarget
      : allowedTargets.includes(legacyTarget)
        ? legacyTarget
        : null;

    if (initialTarget) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          scrollToSection(initialTarget, 'smooth');
        });
      });
    }
  }
})();

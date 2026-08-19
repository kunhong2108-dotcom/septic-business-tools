(function () {
  var scrollStorageKey = 'temveroScrollTarget';

  function scrollToHomeSection(targetId) {
    var target = document.getElementById(targetId);
    if (!target) return false;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
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
      var targetId = link.getAttribute('data-scroll-target');
      if (!targetId) return;

      if (scrollToHomeSection(targetId)) {
        event.preventDefault();
        closeMobileMenu();
        return;
      }

      try {
        window.sessionStorage.setItem(scrollStorageKey, targetId);
      } catch (error) {
        // The native root link remains a safe fallback if storage is unavailable.
      }
    });
  });

  var storedTarget = null;
  try {
    storedTarget = window.sessionStorage.getItem(scrollStorageKey);
    window.sessionStorage.removeItem(scrollStorageKey);
  } catch (error) {
    storedTarget = null;
  }

  if (storedTarget) {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        scrollToHomeSection(storedTarget);
      });
    });
  }
})();

/* Collapse the bullet list of every Experience / Projects entry into a
 * hover-expandable box. Done here rather than in the markup so that with JS
 * disabled the wrapper never appears and all the detail stays visible.
 * Runs immediately (this file sits at the end of <body>) so anim.js measures
 * scroll positions against the already-collapsed layout. */
(function collapseEntryDetail() {
  document.querySelectorAll('#experience .ledger-entry, #projects .ledger-entry').forEach((entry) => {
    // Lift the tool tags and project links up beside the location line,
    // under the date. Entries without a location line still get the row —
    // the right-hand group just sits alone.
    const meta = entry.querySelector('.meta');
    const tags = entry.querySelector('.tool-tags');
    const links = entry.querySelector('.project-links');
    if (tags || links) {
      const row = entry.querySelector('.ledger-row');
      const sub = document.createElement('div');
      const right = document.createElement('div');
      sub.className = 'entry-sub';
      right.className = 'entry-sub-right';
      entry.insertBefore(sub, meta || (row ? row.nextSibling : tags || links));
      if (meta) sub.appendChild(meta);
      if (links) right.appendChild(links);
      if (tags) right.appendChild(tags);
      sub.appendChild(right);
    }

    const list = entry.querySelector('ul:not(.tool-tags)');
    if (!list) return;
    const box = document.createElement('div');
    box.className = 'entry-detail';
    list.parentNode.insertBefore(box, list);
    box.appendChild(list);
    entry.tabIndex = 0; // keyboard users can reach the detail too
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('site-nav');
  const toggle = document.getElementById('nav-toggle');
  const themeToggle = document.getElementById('theme-toggle');
  const navLinks = nav.querySelectorAll('a[href^="#"]');

  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  toggle.addEventListener('click', () => {
    nav.classList.toggle('nav-open');
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      nav.classList.remove('nav-open');
    });
  });

  document.querySelectorAll('.btn[href^="#"], .scroll-cue[href^="#"]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      const target = document.querySelector(btn.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // #contact is the scroll spacer outside main, not a section — observe it too
  const sections = document.querySelectorAll('main section[id], #contact');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = nav.querySelector(`a[href="#${entry.target.id}"]`);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    },
    { threshold: 0.4 }
  );
  sections.forEach((section) => observer.observe(section));
});

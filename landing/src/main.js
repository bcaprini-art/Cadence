// Cadence Landing Page — Main JS

// ─── Scroll Reveal (Intersection Observer) ───────────────────────────────────
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Don't unobserve — keep visible once shown
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  }
);

document.querySelectorAll('.fade-in').forEach((el) => {
  observer.observe(el);
});

// ─── Heatmap Generator ───────────────────────────────────────────────────────
function buildHeatmap() {
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;

  const timeSlots = ['8–10am', '10–12pm', '12–2pm', '2–4pm', '3–5pm', '5–7pm', '7–9pm'];

  // Heat data: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  // 0=conflict, 1=low, 2=med, 3=good, 4=great, 'best'=optimal
  const heatData = [
    [0, 1, 0, 1, 2, 3, 3],       // 8–10am
    [1, 0, 2, 0, 2, 3, 4],       // 10–12pm
    [0, 1, 1, 1, 1, 4, 4],       // 12–2pm
    [2, 3, 4, 3, 3, 'best', 3],  // 2–4pm
    [3, 2, 'best', 3, 3, 4, 2],  // 3–5pm
    [4, 3, 4, 4, 2, 3, 1],       // 5–7pm
    [3, 2, 3, 2, 1, 1, 0],       // 7–9pm
  ];

  const labels = {
    0: '', 1: '', 2: '', 3: '', 4: '', best: '✓'
  };

  timeSlots.forEach((slot, rowIdx) => {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-8 gap-1 items-center';

    // Time label
    const timeLabel = document.createElement('div');
    timeLabel.className = 'text-white/30 text-xs text-right pr-1 whitespace-nowrap';
    timeLabel.textContent = slot;
    row.appendChild(timeLabel);

    // Day cells
    heatData[rowIdx].forEach((heat) => {
      const cell = document.createElement('div');
      cell.className = `heatmap-cell heat-${heat}`;
      cell.textContent = labels[heat] || '';

      if (heat === 'best') {
        cell.title = 'Best time — 22/24 athletes available';
        cell.classList.add('text-navy-900');
      } else if (heat === 4) {
        cell.title = '20–22 athletes available';
      } else if (heat === 3) {
        cell.title = '16–20 athletes available';
      } else if (heat === 2) {
        cell.title = '10–16 athletes available';
      } else if (heat === 1) {
        cell.title = '5–10 athletes available';
      } else {
        cell.title = 'Most athletes have class conflicts';
      }

      row.appendChild(cell);
    });

    grid.appendChild(row);
  });
}

buildHeatmap();

// ─── Early Access Form ────────────────────────────────────────────────────────
const form = document.getElementById('early-access-form');
const formContainer = document.getElementById('form-container');
const successMessage = document.getElementById('success-message');
const emailInput = document.getElementById('email-input');

// Check if already signed up
const savedEmail = localStorage.getItem('cadence_early_access_email');
if (savedEmail) {
  showSuccess(savedEmail);
}

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = emailInput?.value?.trim();

  if (!email) return;

  // Save to localStorage
  localStorage.setItem('cadence_early_access_email', email);
  localStorage.setItem('cadence_early_access_date', new Date().toISOString());

  showSuccess(email);
});

function showSuccess(email) {
  if (!formContainer || !successMessage) return;
  formContainer.classList.add('hidden');
  successMessage.classList.remove('hidden');

  // Update success message with email
  const emailDisplay = successMessage.querySelector('.email-display');
  if (emailDisplay) {
    emailDisplay.textContent = email;
  }
}

// ─── Smooth scroll for nav links ─────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      const navHeight = 64; // nav height in px
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
  });
});

// ─── Nav active state on scroll ──────────────────────────────────────────────
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    nav?.classList.add('scrolled');
  } else {
    nav?.classList.remove('scrolled');
  }
}, { passive: true });

// ─── Hero fade-in on load ─────────────────────────────────────────────────────
window.addEventListener('load', () => {
  // Force hero elements visible immediately
  document.querySelectorAll('.fade-in').forEach((el, idx) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setTimeout(() => {
        el.classList.add('visible');
      }, idx * 80);
    }
  });
});

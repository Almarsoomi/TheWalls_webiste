(function() {
  const slider = document.getElementById('baSlider');
  const after = document.getElementById('baAfter');
  if (!slider || !after) return;

  let dragging = false;

  function setBA(pct) {
    const p = Math.max(0, Math.min(100, pct));
    after.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
    document.getElementById('baDivider').style.left = p + '%';
    document.getElementById('baHandle').style.left = p + '%';
  }

  setBA(50);
  slider.addEventListener('mousedown', () => dragging = true);
  slider.addEventListener('touchstart', () => dragging = true, { passive: true });
  window.addEventListener('mouseup', () => dragging = false);
  window.addEventListener('touchend', () => dragging = false);
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const r = slider.getBoundingClientRect();
    setBA((e.clientX - r.left) / r.width * 100);
  });
  window.addEventListener('touchmove', e => {
    if (!dragging) return;
    const r = slider.getBoundingClientRect();
    setBA((e.touches[0].clientX - r.left) / r.width * 100);
  }, { passive: true });
})();

// Accordion behavior for menu groups
document.querySelectorAll('.menu-group-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
  });
});

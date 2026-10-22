const lenis = new Lenis({
    duration: 1,
    smoothWheel: true
  });

  // Lenis animation loop
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);


  // Navbar links
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      const target = document.querySelector(
        link.getAttribute('href')
      );

      lenis.scrollTo(target, {
        duration: 1.2,
        offset: -20
      });
    });
  });
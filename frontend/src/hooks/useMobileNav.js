import { useCallback, useEffect, useState } from 'react';

export function useMobileNav() {
  const [navOpen, setNavOpen] = useState(false);

  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const toggleNav = useCallback(() => setNavOpen((v) => !v), []);

  useEffect(() => {
    if (!navOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeNav();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [navOpen, closeNav]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024) closeNav();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [closeNav]);

  return { navOpen, openNav, closeNav, toggleNav, setNavOpen };
}

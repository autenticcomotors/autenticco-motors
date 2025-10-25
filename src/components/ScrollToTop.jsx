// src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Sempre que o pathname mudar, forçar scrollTop.
    // Usamos behavior 'auto' para não criar animação que possa confundir o usuário.
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      // Também garantir para iOS / alguns browsers:
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (e) {
      // fallback simples
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return null;
}


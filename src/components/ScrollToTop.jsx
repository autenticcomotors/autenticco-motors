// src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const location = useLocation();

  // Desliga o comportamento padrão de restauração de scroll do browser
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'manual';
      } catch (e) {
        // ignore
      }
    }
    return () => {
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'auto';
        }
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    // Função que efetua o scroll. Se tiver hash, tenta rolar para o elemento.
    const doScroll = () => {
      try {
        if (location.hash) {
          // se houver hash, tenta rolar para ele (ex.: /pagina#secao)
          const id = location.hash.replace('#', '');
          const el = document.getElementById(id) || document.querySelector(location.hash);
          if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'auto', block: 'start' });
            return;
          }
        }
        // caso normal: topo da página
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      } catch (e) {
        try { window.scrollTo(0, 0); } catch (_) {}
      }
    };

    // Executar após micro-tarefa para garantir que o browser não re-aplique o restore depois.
    const t = setTimeout(doScroll, 0);
    return () => clearTimeout(t);
  // Dependemos de pathname e hash para acionar
  }, [location.pathname, location.hash]);

  return null;
}


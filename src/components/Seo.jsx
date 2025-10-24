// src/components/Seo.jsx
import React, { useEffect } from "react";

/**
 * Componente SEO básico para SPA (sem dependências).
 * Uso: <Seo title="..." description="..." image="..." url="..." />
 */

function upsertMeta(attrName, attrValue, content) {
  try {
    const selector = `meta[${attrName}="${attrValue}"]`;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content || "");
  } catch (e) {
    // não quebrar a página se algo falhar
    // console.warn("SEO meta failed", e);
  }
}

export default function Seo({ title, description, image, url }) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    // description
    if (description) upsertMeta("name", "description", description);

    // Open Graph
    if (title) upsertMeta("property", "og:title", title);
    if (description) upsertMeta("property", "og:description", description);
    if (image) upsertMeta("property", "og:image", image);
    if (url) upsertMeta("property", "og:url", url);

    // Twitter card
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    if (title) upsertMeta("name", "twitter:title", title);
    if (description) upsertMeta("name", "twitter:description", description);
    if (image) upsertMeta("name", "twitter:image", image);

    // canonical
    try {
      let link = document.head.querySelector("link[rel='canonical']");
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", url || window.location.href);
    } catch (e) {}

    // cleanup opcional: restaurar title ao desmontar
    return () => {
      document.title = previousTitle;
      // deixamos as metas como estão (não removemos para evitar efeitos colaterais)
    };
  }, [title, description, image, url]);

  return null;
}


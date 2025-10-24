// src/components/JsonLdVehicle.jsx
import React, { useEffect } from "react";

/**
 * JsonLdVehicle
 * Uso: <JsonLdVehicle vehicle={car} image={seoImage} url={seoUrl} />
 * Gera <script type="application/ld+json"> com os dados do veículo.
 */

export default function JsonLdVehicle({ vehicle = {}, image, url }) {
  useEffect(() => {
    try {
      const data = {
        "@context": "https://schema.org",
        "@type": "Vehicle",
        "name": `${vehicle.brand || ""} ${vehicle.model || ""}`.trim(),
        "brand": vehicle.brand || undefined,
        "model": vehicle.model || undefined,
        "vehicleModelDate": vehicle.year ? String(vehicle.year) : undefined,
        "fuelType": vehicle.fuel || undefined,
        "color": vehicle.color || undefined,
        "mileageFromOdometer": vehicle.mileage
          ? {
              "@type": "QuantitativeValue",
              "value": Number(String(vehicle.mileage).replace(/\D/g, '')) || undefined,
              "unitCode": "KMT"
            }
          : undefined,
        "url": url || (typeof window !== "undefined" ? window.location.href : undefined),
        "image": image || vehicle.main_photo_url || (vehicle.photo_urls && vehicle.photo_urls[0]) || undefined,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "BRL",
          "price": vehicle.price ? Number(vehicle.price) : undefined,
          "availability": "https://schema.org/InStock"
        }
      };

      // Remove chaves undefined para JSON limpo
      const clean = JSON.parse(JSON.stringify(data));

      const id = "jsonld-vehicle";
      const existing = document.getElementById(id);
      if (existing) existing.remove();

      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      script.text = JSON.stringify(clean);
      document.head.appendChild(script);
    } catch (e) {
      // não quebra o site se algo falhar
      // console.warn("JsonLdVehicle error", e);
    }
  }, [vehicle, image, url]);

  return null;
}


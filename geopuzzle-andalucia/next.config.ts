import type { NextConfig } from "next";

// basePath se configura via variable de entorno en CI (GitHub Actions).
// Ejemplo: si el repo se llama "geopuzzle-web", pon NEXT_PUBLIC_BASE_PATH=/geopuzzle-web
// Si usas dominio propio (CNAME), déjalo vacío.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (process.env.NODE_ENV === 'production' ? "/geopuzzle" : "");

const nextConfig: NextConfig = {
  output: "export",           // Genera HTML estático en /out — necesario para GitHub Pages
  images: {
    unoptimized: true,        // GitHub Pages no tiene servidor de imágenes dinámico
  },
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,        // Genera index.html en cada ruta para compatibilidad con Pages
};

export default nextConfig;

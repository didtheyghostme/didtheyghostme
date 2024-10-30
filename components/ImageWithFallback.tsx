"use client";

import { useState } from "react";
import { ImageProps, Image } from "@nextui-org/react";

const EMPTY_PLACEHOLDER_URL = "https://placehold.co/48?text=?";

const LOGO_DEV_URL = "https://img.logo.dev/";
const LOGO_DEV_TOKEN = "?token=pk_DxrQtA58T7qDKnpL24nlww";

function cleanCompanyName(name: string): string {
  // Remove special characters, spaces, and convert to lowercase
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Remove any character that's not a letter or number
    .trim();
}

function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url);

    return hostname.replace(/^www\./, "");
  } catch (error) {
    return "";
  }
}

function getLogoDevFullUrl(url: string | null) {
  if (!url) return ""; // string | null as src can be string | null

  return `${LOGO_DEV_URL}${url}${LOGO_DEV_TOKEN}`;
}

export default function ImageWithFallback({
  src,
  fallbackSrc = EMPTY_PLACEHOLDER_URL,
  companyName,
  ...props
}: {
  src: string | null;
  fallbackSrc?: string;
  companyName?: string;
} & Omit<ImageProps, "src">) {
  const [imgSrc, setImgSrc] = useState(getLogoDevFullUrl(src) || fallbackSrc);
  const [fallbackStage, setFallbackStage] = useState(0); // 0: initial, 1: domain tried, 2: company tried

  const handleImageError = () => {
    // First try: Extract domain from failed URL
    if (fallbackStage === 0 && src) {
      const domain = extractDomain(src);
      const newSrc = getLogoDevFullUrl(domain);

      if (domain && imgSrc !== newSrc) {
        setImgSrc(newSrc);
        setFallbackStage(1);

        return;
      }
    }

    // Second try: Use company name
    if (fallbackStage <= 1 && companyName) {
      const cleanName = cleanCompanyName(companyName);
      const newSrc = getLogoDevFullUrl(cleanName);

      if (imgSrc !== newSrc) {
        setImgSrc(newSrc);
        setFallbackStage(2);

        return;
      }
    }

    // Final fallback: Use placeholder
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  return <Image {...props} alt="logo" src={imgSrc} onError={handleImageError} />;
}

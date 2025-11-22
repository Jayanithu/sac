import { SITE_CONFIG } from '../../constants';

export default function StructuredData() {
  const baseUrl = SITE_CONFIG.url;

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": SITE_CONFIG.name,
    "description": SITE_CONFIG.description,
    "url": baseUrl,
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Person",
      "name": SITE_CONFIG.author.name,
      "url": SITE_CONFIG.author.github,
      "sameAs": [
        SITE_CONFIG.author.github,
        SITE_CONFIG.author.linkedin,
        SITE_CONFIG.author.twitter
      ]
    },
    "featureList": [
      "Draw signatures",
      "Animated signature preview",
      "Export to SVG",
      "Export to MP4",
      "Export to Lottie JSON",
      "Real-time preview",
      "Customizable colors and stroke width"
    ]
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": SITE_CONFIG.author.name,
    "url": SITE_CONFIG.author.github,
    "sameAs": [
      SITE_CONFIG.author.github,
      SITE_CONFIG.author.linkedin,
      SITE_CONFIG.author.twitter
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}


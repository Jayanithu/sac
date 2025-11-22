export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sac.jayanithu.dev';

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "sac - Signature Animation Creator",
    "description": "Create stunning animated signatures with ease. Draw your signature, preview the animated reveal, and export in multiple formats including SVG, MP4, and Lottie JSON.",
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
      "name": "Jayanithu",
      "url": "https://github.com/Jayanithu",
      "sameAs": [
        "https://github.com/Jayanithu",
        "https://www.linkedin.com/in/jayanithu-perera-ba7a46264/",
        "https://x.com/Jayaniithu"
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
    "name": "Jayanithu",
    "url": "https://github.com/Jayanithu",
    "sameAs": [
      "https://github.com/Jayanithu",
      "https://www.linkedin.com/in/jayanithu-perera-ba7a46264/",
      "https://x.com/Jayaniithu"
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


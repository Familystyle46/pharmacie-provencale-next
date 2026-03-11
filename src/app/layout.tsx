import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { LayoutClient } from "@/components/layout/LayoutClient"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pharmacie-provencale.com"

export const metadata: Metadata = {
  title: {
    template: "%s | Pharmacie Provençale",
    default: "Pharmacie Provençale — Compléments alimentaires naturels à Morières-lès-Avignon",
  },
  description:
    "Pharmacie Provençale à Morières-lès-Avignon : compléments alimentaires naturels, parapharmacie et conseils santé. Livraison offerte dès 49 €.",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    siteName: "Pharmacie Provençale",
    locale: "fr_FR",
    type: "website",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    site: "@PharmProvencale",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Pharmacy", "LocalBusiness"],
  name: "Pharmacie Provençale",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  image: `${BASE_URL}/logo.png`,
  description:
    "Pharmacie à Morières-lès-Avignon spécialisée en compléments alimentaires naturels et parapharmacie.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Route de Morières",
    addressLocality: "Morières-lès-Avignon",
    postalCode: "84310",
    addressCountry: "FR",
  },
  telephone: "+33442000000",
  email: "contact@pharmacie-provencale.com",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "19:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "13:00",
    },
  ],
  sameAs: [],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-S1LE3F1TNH"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-S1LE3F1TNH');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-background text-foreground font-sans antialiased">
        <Providers>
          <LayoutClient>{children}</LayoutClient>
        </Providers>
      </body>
    </html>
  )
}

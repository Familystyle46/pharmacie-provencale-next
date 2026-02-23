import type { Metadata } from "next"
import { Mail, Phone, MapPin } from "lucide-react"
import { ContactForm } from "./ContactForm"

export const metadata: Metadata = {
  title: "Contactez-nous",
  description:
    "Une question sur nos compléments alimentaires ? Contactez l'équipe Pharmacie Provençale par email ou téléphone. Nous vous répondons sous 24h.",
  robots: { index: true, follow: true },
}

export default function ContactPage() {
  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Contactez-nous
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Une question ? N&apos;hésitez pas à nous contacter, notre équipe vous répondra dans les plus brefs délais.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-sm text-muted-foreground">
                    contact@pharmacie-provencale.com
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Téléphone</h3>
                  <p className="text-sm text-muted-foreground">04 42 00 00 00</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Adresse</h3>
                  <p className="text-sm text-muted-foreground">
                    15 Cours Mirabeau<br />
                    13100 Aix-en-Provence, France
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-8 md:col-span-2">
            <h2 className="mb-6 text-2xl font-bold">Envoyez-nous un message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </main>
  )
}

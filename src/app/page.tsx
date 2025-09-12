
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, BarChart, DollarSign, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BarChart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Inventaire Pro</span>
          </Link>
          <Link href="/login">
            <Button>Se Connecter</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 bg-primary/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary">
                La gestion de stock, enfin simple.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Arrêtez de perdre du temps avec les cahiers et les calculatrices. Inventaire Pro automatise vos inventaires, détecte les manquants et vous donne le contrôle total sur votre bar ou restaurant.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto">Commencer l'Essai Gratuit</Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
                <Image 
                    src="https://picsum.photos/seed/inventory/600/400"
                    alt="Tableau de bord de l'application Inventaire Pro"
                    width={600}
                    height={400}
                    className="rounded-xl shadow-2xl"
                    data-ai-hint="dashboard analytics"
                />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-24 lg:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Pourquoi choisir Inventaire Pro ?</h2>
              <p className="max-w-2xl mx-auto text-muted-foreground">
                Conçu par un développeur qui connaît les réalités du terrain, pour les gérants qui veulent avancer.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-primary" />}
                title="Inventaire Rapide"
                description="Saisissez votre stock en quelques minutes. Le système calcule automatiquement la valeur totale."
              />
              <FeatureCard
                icon={<DollarSign className="h-8 w-8 text-primary" />}
                title="Détection des Manquants"
                description="Le système compare les ventes théoriques et l'argent encaissé pour identifier les surplus ou les manquants."
              />
              <FeatureCard
                icon={<BarChart className="h-8 w-8 text-primary" />}
                title="Historique Complet"
                description="Accédez à tous vos anciens inventaires en un clic pour suivre vos performances sur le long terme."
              />
              <FeatureCard
                icon={<CheckCircle className="h-8 w-8 text-primary" />}
                title="Simple et Fiable"
                description="Pas de fonctionnalités compliquées. Juste un outil efficace qui fonctionne, pensé pour vous."
              />
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-primary/5 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Inventaire Pro. Tous droits réservés.</p>
           <p className="text-sm mt-1">Conçu avec ❤️ par Melchior Codex.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="flex justify-center items-center pb-4">
        <div className="bg-primary/10 p-4 rounded-full">
            {icon}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

    
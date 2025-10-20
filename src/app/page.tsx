
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, BarChart, DollarSign, Zap, FilePlus, PackageSearch, Calculator, Archive, LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <BarChart className="h-8 w-8 text-primary" />
            <span className="text-xl md:text-2xl font-bold">Inventaire Pro</span>
          </Link>
          <Link href="/login" className="shrink-0">
            <Button>
              <LogIn className="md:mr-2" />
              <span className="hidden md:inline">Se Connecter / Essai Gratuit</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 bg-primary/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary">
                La gestion de stock, enfin simple et intelligente.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Arrêtez de perdre du temps et de l'argent avec les cahiers. Inventaire Pro automatise vos inventaires, détecte les manquants et vous donne le contrôle total sur votre bar ou restaurant.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto">Commencer l'Essai Gratuit de 30 jours</Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
                <Image 
                    src="https://picsum.photos/seed/business%20owner%20tablet/600/500"
                    alt="Personne travaillant sur un ordinateur portable dans un bar-restaurant chaleureux"
                    width={600}
                    height={500}
                    className="rounded-xl shadow-2xl"
                    data-ai-hint="business owner tablet"
                />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-24 lg:py-28 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Le pouvoir de la simplicité pour votre business</h2>
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
                description="Pas de fonctionnalités compliquées. Juste un outil efficace qui fonctionne, pensé pour vos réalités."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="w-full py-20 md:py-24 lg:py-28 bg-primary/5">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold">Comment ça marche ?</h2>
                    <p className="max-w-2xl mx-auto text-muted-foreground">
                        En 4 étapes simples, reprenez le contrôle de votre gestion.
                    </p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <StepCard
                        icon={<FilePlus />}
                        step="Étape 1"
                        title="Enregistrez vos arrivages"
                        description="Ajoutez facilement toutes vos nouvelles livraisons de boissons."
                    />
                    <StepCard
                        icon={<PackageSearch />}
                        step="Étape 2"
                        title="Faites le point du stock"
                        description="Saisissez les quantités restantes de chaque produit dans votre stock physique."
                    />
                    <StepCard
                        icon={<Calculator />}
                        step="Étape 3"
                        title="Finalisez le calcul"
                        description="Entrez l'argent encaissé, les dépenses et le nom du gérant pour obtenir le bilan."
                    />
                    <StepCard
                        icon={<Archive />}
                        step="Étape 4"
                        title="Archivez et analysez"
                        description="Enregistrez l'inventaire dans l'historique pour suivre vos performances."
                    />
                </div>
            </div>
        </section>

        {/* Testimonial Section */}
        <section id="testimonial" className="w-full py-20 md:py-24 lg:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center">
                    <p className="text-xl md:text-2xl font-medium text-foreground">
                        "Depuis que j'utilise Inventaire Pro, j'ai réduit mes pertes de 25% et je passe deux fois moins de temps sur les inventaires. J'ai enfin une vision claire de mon business. Fini le casse-tête !"
                    </p>
                    <div className="mt-8">
                        <p className="font-bold text-lg">Jean-Eudes A.</p>
                        <p className="text-muted-foreground">Gérant du bar "Le Terminus", Cotonou</p>
                    </div>
                </div>
            </div>
        </section>
        
        {/* Pricing Section */}
        <section id="pricing" className="w-full py-20 md:py-24 lg:py-28 bg-primary/5">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Un tarif simple et transparent</h2>
                    <p className="max-w-2xl mx-auto text-muted-foreground">
                       Testez gratuitement pendant 30 jours, puis continuez avec un abonnement mensuel accessible pour garantir les mises à jour et le support.
                    </p>
                </div>
                <div className="flex justify-center">
                    <Card className="max-w-md w-full shadow-lg">
                        <CardHeader className="items-center text-center">
                            <CardTitle className="text-2xl">Abonnement Mensuel</CardTitle>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold">5000</span>
                                <span className="text-xl text-muted-foreground">FCFA / mois</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <ul className="mt-6 text-left space-y-3">
                                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500" /> Gestion illimitée des boissons</li>
                                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500" /> Historique complet des inventaires</li>
                                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500" /> Support technique prioritaire par WhatsApp & Email</li>
                                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500" /> Mises à jour et nouvelles fonctionnalités incluses</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <a href="https://wa.me/22961170017" target="_blank" rel="noopener noreferrer" className="w-full">
                                <Button className="w-full" size="lg">Souscrire via WhatsApp</Button>
                            </a>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-20 md:py-24 lg:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Questions Fréquentes</h2>
                </div>
                <div className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                            <AccordionTrigger>L'application est-elle difficile à utiliser ?</AccordionTrigger>
                            <AccordionContent>
                                Non, pas du tout. Inventaire Pro a été conçu pour être extrêmement simple et intuitif. Si vous savez utiliser un smartphone ou un ordinateur, vous saurez utiliser notre application en quelques minutes.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Comment fonctionne la période d'essai ?</AccordionTrigger>
                            <AccordionContent>
                                Dès votre inscription, vous bénéficiez de 30 jours d'essai gratuit avec un accès complet à toutes les fonctionnalités. Aucune carte de crédit n'est requise.
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-3">
                            <AccordionTrigger>Que se passe-t-il après la période d'essai ?</AccordionTrigger>
                            <AccordionContent>
                                Après les 30 jours, votre accès sera limité. Pour continuer à utiliser l'application, vous devrez souscrire à notre abonnement mensuel en nous contactant directement.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>Quel type de support offrez-vous ?</AccordionTrigger>
                            <AccordionContent>
                                Nous offrons un support technique prioritaire à tous nos abonnés, principalement via WhatsApp et Email. Votre succès est notre priorité, et nous sommes là pour vous aider à chaque étape.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </section>
        
        {/* Final CTA */}
        <section className="w-full py-20 md:py-32 bg-primary text-primary-foreground">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">Prêt à transformer la gestion de votre bar ?</h2>
                <p className="max-w-xl mx-auto text-lg text-primary-foreground/80">
                    Rejoignez les gérants qui ont choisi la tranquillité d'esprit. Commencez votre essai gratuit dès aujourd'hui.
                </p>
                <Link href="/login">
                  <Button size="lg" variant="secondary" className="text-lg">Je commence mon essai gratuit</Button>
                </Link>
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
    <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow bg-card">
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

function StepCard({ icon, step, title, description }: { icon: React.ReactNode, step: string, title: string, description: string }) {
    return (
        <div className="text-center space-y-4">
            <div className="relative inline-block">
                <div className="bg-secondary p-5 rounded-full">
                    <div className="bg-primary/10 p-4 rounded-full text-primary">
                        {React.cloneElement(icon as React.ReactElement, { className: "h-8 w-8" })}
                    </div>
                </div>
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">{step.split(' ')[1]}</span>
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}

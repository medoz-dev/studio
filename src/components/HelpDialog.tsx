
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "./ui/button";

export default function HelpDialog({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aide et Informations - Inventaire Pro</DialogTitle>
          <DialogDescription>
            Bienvenue sur Inventaire Pro ! L'application est conçue pour vous faire gagner du temps et de l'argent en simplifiant la gestion de votre stock.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-1 pr-4">
            <Accordion type="single" collapsible className="w-full" defaultValue="guide">
                <AccordionItem value="guide">
                    <AccordionTrigger className="font-semibold">Comment fonctionne l'application ? (Guide rapide)</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        <p>1. <strong>Administration :</strong> Commencez par vérifier la liste de vos boissons dans l'onglet <strong>Administration</strong>. Assurez-vous que les prix et les unités par casier/carton sont corrects.</p>
                        <p>2. <strong>Arrivage :</strong> Enregistrez toutes vos nouvelles livraisons dans l'onglet <strong>Arrivage</strong>.</p>
                        <p>3. <strong>Stock Restant :</strong> Faites le point de votre stock physique et entrez les quantités restantes dans l'onglet <strong>Stock Restant</strong>.</p>
                        <p>4. <strong>Calculs Généraux :</strong> Allez dans l'onglet <strong>Calculs</strong> pour finaliser l'inventaire. Entrez le nom du gérant, la somme encaissée, les dépenses, et l'espèce disponible. Cliquez sur "Calculer" pour voir le résultat final (manquant ou surplus).</p>
                        <p>5. <strong>Enregistrer :</strong> Une fois le calcul terminé, cliquez sur <strong>"Enregistrer les Résultats"</strong> pour archiver l'inventaire et réinitialiser les données pour le prochain cycle. Vous retrouverez cet enregistrement dans l'onglet <strong>Historique</strong>.</p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="special-calc">
                    <AccordionTrigger className="font-semibold">Qu'est-ce que le calcul spécial "type Béninoise" ?</AccordionTrigger>
                    <AccordionContent>
                        Pour certaines boissons comme "La Béninoise Petite", le calcul de la valeur du stock n'est pas basé sur le prix de vente, mais sur une méthode de valorisation spécifique.
                        <br/><br/>
                        Le calcul est le suivant : <strong>(Nombre total de bouteilles / 3) * 1000 FCFA</strong>, arrondi aux 50 FCFA supérieurs.
                        <br/><br/>
                        Ce calcul est automatiquement appliqué pour les boissons concernées. Vous n'avez rien à faire, juste à entrer la quantité.
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="subscription">
                    <AccordionTrigger className="font-semibold">Comment fonctionne l'abonnement ?</AccordionTrigger>
                    <AccordionContent>
                        Vous bénéficiez d'un <strong>essai gratuit complet de 5 jours</strong> à partir de votre date d'inscription.
                        <br/><br/>
                        Une fois cette période terminée, un abonnement est nécessaire pour continuer à utiliser l'application. L'abonnement vous garantit l'accès à toutes les fonctionnalités, au support technique et aux futures mises à jour.
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="support">
                    <AccordionTrigger className="font-semibold">Support & Contact</AccordionTrigger>
                    <AccordionContent className="space-y-1">
                        <p>Un problème ? Une question ? Besoin de renouveler votre abonnement ?</p>
                        <p>Votre succès est notre priorité. Contactez directement le concepteur de l'application :</p>
                        <ul className="list-disc pl-5 pt-2">
                            <li><strong>Nom :</strong> Melchior Codex</li>
                            <li><strong>Téléphone / WhatsApp :</strong> +229 61 17 00 17</li>
                            <li><strong>Email :</strong> melchiorganglo@gmail.com</li>
                        </ul>
                        <p className="pt-2">N'hésitez pas à nous contacter pour toute suggestion d'amélioration. Votre avis est précieux !</p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
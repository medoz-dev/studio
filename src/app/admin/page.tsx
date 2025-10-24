

import React from "react";
import AdminClient from "./AdminClient";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users } from "lucide-react";

export default function AdminPage() {
  // Le chargement des données est maintenant géré côté client dans AdminClient
  // pour éviter les problèmes de session côté serveur et les erreurs NEXT_NOT_FOUND.
  return (
    <>
      <AdminClient />
      <div className="container mx-auto px-4 md:px-8 mt-[-2rem] mb-8">
        <Link href="/admin/managers">
          <Button variant="outline">
            <Users className="mr-2" /> Gérer les Gérants
          </Button>
        </Link>
      </div>
    </>
  );
}


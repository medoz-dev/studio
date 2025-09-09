
import React from "react";
import AdminClient from "./AdminClient";

export default function AdminPage() {
  // Le chargement des données est maintenant géré côté client dans AdminClient
  // pour éviter les problèmes de session côté serveur et les erreurs NEXT_NOT_FOUND.
  return <AdminClient />;
}

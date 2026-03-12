"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface Client {
  id: string;
  name: string;
  name_en: string | null;
  industry: string;
  status: string;
  logo_url: string | null;
  monthly_budget: number;
}

interface ClientContextType {
  clients: Client[];
  selectedClientId: string | null;
  selectedClient: Client | null;
  setSelectedClientId: (id: string | null) => void;
  loading: boolean;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType>({
  clients: [],
  selectedClientId: null,
  selectedClient: null,
  setSelectedClientId: () => {},
  loading: true,
  refreshClients: async () => {},
});

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const refreshClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data.clients || []);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  useEffect(() => {
    const match = pathname.match(/\/clients\/([^/]+)/);
    if (match) {
      setSelectedClientId(match[1]);
    }
  }, [pathname]);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null;

  return (
    <ClientContext.Provider
      value={{
        clients,
        selectedClientId,
        selectedClient,
        setSelectedClientId,
        loading,
        refreshClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export const useClient = () => useContext(ClientContext);

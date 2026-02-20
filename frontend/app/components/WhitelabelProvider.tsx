import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentTenant } from "../../lib/api";

interface WhitelabelConfig {
  companyId: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
}

const DEFAULT_CONFIG: WhitelabelConfig = {
  companyId: "default",
  name: "LogiNexus",
  logoUrl: "LogiNexus",
  primaryColor: "bg-emerald-600",
};

const WhitelabelContext = createContext<WhitelabelConfig>(DEFAULT_CONFIG);

export const useWhitelabel = () => useContext(WhitelabelContext);

export const WhitelabelProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Fetch tenant info from backend (which uses Host header/middleware)
  const { data: tenant } = useQuery({
      queryKey: ['currentTenant'],
      queryFn: fetchCurrentTenant,
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const config: WhitelabelConfig = tenant ? {
      companyId: tenant.id,
      name: tenant.name,
      logoUrl: tenant.logo_url || tenant.name,
      primaryColor: tenant.primary_color || "bg-blue-600"
  } : DEFAULT_CONFIG;

  // Optional: Show loading state or just flicker default?
  // For better UX, maybe just render children with default if loading
  // or a spinner if strict. Given "Whitelabel", usually we want it fast.
  // We'll proceed with rendering.

  return (
    <WhitelabelContext.Provider value={config}>
      {children}
    </WhitelabelContext.Provider>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Business {
  id: number;
  name: string;
}

interface BusinessContextType {
  selectedBusiness: number | null;
  setSelectedBusiness: (id: number | null) => void;
  businesses: Business[];
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType>({
  selectedBusiness: null,
  setSelectedBusiness: () => {},
  businesses: [],
  refreshBusiness: async () => {},
});

export const useBusinessContext = () => useContext(BusinessContext);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null);
  const isSuperAdmin = (currentUser as any)?.is_superuser === true;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchBusinesses = async () => {
    const token = localStorage.getItem('access');
    if (isSuperAdmin) {
      const res = await fetch(`${apiUrl}/api/auth/businesses/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list: Business[] = Array.isArray(data) ? data : [];
      setBusinesses(list);
      if (list.length > 0 && !selectedBusiness) setSelectedBusiness(list[0].id);
    } else {
      const businessId = (currentUser as any)?.business;
      if (!businessId) return;
      setSelectedBusiness(businessId);
      const res = await fetch(`${apiUrl}/api/auth/businesses/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.id && data?.name) setBusinesses([{ id: data.id, name: data.name }]);
    }
  };

  const refreshBusiness = async () => {
    try { await fetchBusinesses(); } catch { /* silencioso */ }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchBusinesses().catch(() => {});
  }, [currentUser]);

  return (
    <BusinessContext.Provider value={{ selectedBusiness, setSelectedBusiness, businesses, refreshBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
};
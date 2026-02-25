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
}

const BusinessContext = createContext<BusinessContextType>({
  selectedBusiness: null,
  setSelectedBusiness: () => {},
  businesses: [],
});

export const useBusinessContext = () => useContext(BusinessContext);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null);
  const isSuperAdmin = (currentUser as any)?.is_superuser === true;

  useEffect(() => {
    if (!currentUser) return;

    if (isSuperAdmin) {
      const token = localStorage.getItem('access');
      fetch('/api/auth/businesses/', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : [];
          setBusinesses(list);
          // Por defecto el primer negocio
          if (list.length > 0 && !selectedBusiness) {
            setSelectedBusiness(list[0].id);
          }
        })
        .catch(err => console.error('Error cargando negocios:', err));
    } else {
      // Admin normal — usar su propio negocio
      const businessId = (currentUser as any)?.business;
      if (businessId) setSelectedBusiness(businessId);
    }
  }, [currentUser]);

  return (
    <BusinessContext.Provider value={{ selectedBusiness, setSelectedBusiness, businesses }}>
      {children}
    </BusinessContext.Provider>
  );
};
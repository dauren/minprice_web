import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { City } from '@/types/api';

interface CityContextType {
  selectedCityId: number; // city ID
  setSelectedCityId: (cityId: number) => void;
  cityData: City | null;
  setCityData: (city: City | null) => void;
  cityDetected: boolean;
  setCityDetected: (detected: boolean) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: ReactNode }) {
  // Default city is Almaty (ID: 1)
  const [selectedCityId, setSelectedCityIdState] = useState<number>(() => {
    const saved = localStorage.getItem('minprice_city_id');
    return saved ? parseInt(saved) : 1;
  });

  const [cityData, setCityData] = useState<City | null>(null);

  const [cityDetected, setCityDetectedState] = useState<boolean>(() => {
    return localStorage.getItem('minprice_city_detected') === 'true';
  });

  const setSelectedCityId = (cityId: number) => {
    setSelectedCityIdState(cityId);
    localStorage.setItem('minprice_city_id', cityId.toString());
  };

  const setCityDetected = (detected: boolean) => {
    setCityDetectedState(detected);
    localStorage.setItem('minprice_city_detected', detected.toString());
  };

  useEffect(() => {
    // Set default city data if not set
    if (!cityData && selectedCityId === 1) {
      setCityData({ id: 1, name: 'Алматы', slug: 'almaty' });
    }
  }, [selectedCityId, cityData]);

  return (
    <CityContext.Provider value={{ selectedCityId, setSelectedCityId, cityData, setCityData, cityDetected, setCityDetected }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}

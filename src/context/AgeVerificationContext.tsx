import { createContext, useContext, useState, ReactNode } from 'react';
import { getAdultConfirmed, setAdultConfirmed } from '@/lib/ageVerification';

interface AgeVerificationContextType {
  isAdultConfirmed: boolean;
  confirmAdult: () => void;
}

const AgeVerificationContext = createContext<AgeVerificationContextType | undefined>(undefined);

export function AgeVerificationProvider({ children }: { children: ReactNode }) {
  const [isAdultConfirmed, setIsAdultConfirmed] = useState<boolean>(() => getAdultConfirmed());

  const confirmAdult = () => {
    setAdultConfirmed();
    setIsAdultConfirmed(true);
  };

  return (
    <AgeVerificationContext.Provider value={{ isAdultConfirmed, confirmAdult }}>
      {children}
    </AgeVerificationContext.Provider>
  );
}

export function useAgeVerification() {
  const context = useContext(AgeVerificationContext);
  if (context === undefined) {
    throw new Error('useAgeVerification must be used within an AgeVerificationProvider');
  }
  return context;
}

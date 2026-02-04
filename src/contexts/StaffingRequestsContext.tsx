import { createContext, useContext, ReactNode } from 'react';
import { useStaffingRequests } from '../hooks/useStaffingRequests';

// Infer the return type of the hook
type StaffingRequestsHookType = ReturnType<typeof useStaffingRequests>;

// Create the context with a default undefined value
const StaffingRequestsContext = createContext<StaffingRequestsHookType | undefined>(undefined);

// Define the provider component
export const StaffingRequestsProvider = ({ children }: { children: ReactNode }) => {
  const staffingRequests = useStaffingRequests();

  return (
    <StaffingRequestsContext.Provider value={staffingRequests}>
      {children}
    </StaffingRequestsContext.Provider>
  );
};

// Custom hook to use the context
export const useStaffingRequestsContext = () => {
  const context = useContext(StaffingRequestsContext);
  if (context === undefined) {
    throw new Error('useStaffingRequestsContext must be used within a StaffingRequestsProvider');
  }
  return context;
};

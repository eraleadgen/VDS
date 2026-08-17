import { Navigate } from 'react-router-dom';
import { useBusinessConfig } from '@/lib/BusinessConfigContext';

export default function Pricing() {
  const config = useBusinessConfig();
  if (config?.business_id === 'era_systems') {
    return <Navigate to="/#pricing" replace />;
  }
  return <Navigate to="/book" replace />;
}
import { usePlanFeatures } from '@/lib/usePlanFeatures';
import PageNotFound from '@/lib/PageNotFound';

// Wraps a route element or component section. If the tenant's plan_tier doesn't
// include the feature, renders PageNotFound instead of children.
export default function FeatureGate({ feature, children }) {
  const { hasFeature } = usePlanFeatures();
  if (!hasFeature(feature)) {
    return <PageNotFound />;
  }
  return children;
}
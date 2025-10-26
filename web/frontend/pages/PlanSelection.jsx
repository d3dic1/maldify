import React, { useState, useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import {
  LegacyCard,
  Text,
  Button,
  VerticalStack,
  HorizontalStack,
  Banner,
  Spinner,
  Badge,
  Divider,
} from '@shopify/polaris';

export default function PlanSelection() {
  const app = useAppBridge();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch subscription plans from backend
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/billing/plans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }

      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load subscription plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      setIsProcessing(true);
      setError(null);
      setSelectedPlan(plan);

      console.log('Initiating billing setup for plan:', {
        name: plan.name,
        price: plan.price_monthly,
        limit: plan.limit,
        features: plan.features
      });

      // Make POST request to billing setup endpoint
      const response = await fetch('/api/billing/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: plan.name.toLowerCase().replace(/\s+/g, '_'), // Convert plan name to plan_id
          plan_name: plan.name,
          plan_price: plan.price_monthly,
          plan_features: plan.features,
          plan_limit: plan.limit
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to setup billing');
      }

      const data = await response.json();
      
      // Get confirmation URL from response
      const confirmationUrl = data.confirmationUrl;
      if (!confirmationUrl) {
        throw new Error('No confirmation URL received from server');
      }
      
      console.log('Redirecting to billing confirmation:', confirmationUrl);
      
      // Use Shopify App Bridge Redirect action to safely redirect within iframe
      if (app) {
        try {
          // Use the modern App Bridge Redirect API with proper object syntax
          const redirect = Redirect.create(app);
          redirect.dispatch(Redirect.Action.REMOTE, { url: confirmationUrl });
          console.log('App Bridge redirect dispatched successfully to:', confirmationUrl);
        } catch (redirectError) {
          console.error('App Bridge redirect failed:', redirectError);
          // Fallback to window.location if App Bridge redirect fails
          console.warn('Falling back to window.location due to App Bridge error');
          window.location.href = confirmationUrl;
        }
      } else {
        // Fallback to window.location if App Bridge is not available
        console.warn('App Bridge not available, using window.location fallback');
        window.location.href = confirmationUrl;
      }
      
    } catch (err) {
      console.error('Error setting up billing:', err);
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const getLimitText = (limit) => {
    if (limit === 0) {
      return 'Unlimited';
    }
    return `Up to ${limit} per month`;
  };

  const getPlanBadge = (plan) => {
    if (plan.price_monthly === 0) {
      return <Badge status="info">Free</Badge>;
    } else if (plan.price_monthly <= 5) {
      return <Badge status="success">Popular</Badge>;
    } else {
      return <Badge status="attention">Premium</Badge>;
    }
  };

  if (isLoading) {
    return (
      <LegacyCard>
        <LegacyCard.Section>
          <VerticalStack align="center" gap="400">
            <Spinner size="large" />
            <Text variant="bodyMd" tone="subdued">
              Loading subscription plans...
            </Text>
          </VerticalStack>
        </LegacyCard.Section>
      </LegacyCard>
    );
  }

  if (error) {
    return (
      <LegacyCard>
        <LegacyCard.Section>
          <Banner status="critical">
            <Text variant="bodyMd">{error}</Text>
          </Banner>
        </LegacyCard.Section>
      </LegacyCard>
    );
  }

  return (
    <VerticalStack gap="600">
      <VerticalStack gap="200" align="center">
        <Text variant="headingLg" as="h1">
          Choose Your Maldify Plan
        </Text>
        <Text variant="bodyMd" tone="subdued">
          Select the perfect plan for your store's needs
        </Text>
      </VerticalStack>

      <HorizontalStack gap="400" align="stretch">
        {plans.map((plan, index) => (
          <LegacyCard key={index} sectioned>
            <VerticalStack gap="400">
              {/* Plan Header */}
              <VerticalStack gap="200">
                <HorizontalStack align="space-between">
                  <Text variant="headingMd" as="h2">
                    {plan.name}
                  </Text>
                  {getPlanBadge(plan)}
                </HorizontalStack>
                
                <VerticalStack gap="100">
                  <Text variant="headingLg" as="h3">
                    ${plan.price_monthly}
                    <Text variant="bodyMd" tone="subdued" as="span">
                      /month
                    </Text>
                  </Text>
                  <Text variant="bodyMd" tone="subdued">
                    {getLimitText(plan.limit)} upsells
                  </Text>
                </VerticalStack>
              </VerticalStack>

              <Divider />

              {/* Features List */}
              <VerticalStack gap="200">
                <Text variant="bodyMd" fontWeight="semibold">
                  Features:
                </Text>
                <VerticalStack gap="100">
                  {plan.features.map((feature, featureIndex) => (
                    <HorizontalStack key={featureIndex} gap="200">
                      <Text variant="bodyMd" as="span">
                        ✓
                      </Text>
                      <Text variant="bodyMd" tone="subdued">
                        {feature}
                      </Text>
                    </HorizontalStack>
                  ))}
                </VerticalStack>
              </VerticalStack>

              <Divider />

              {/* Subscribe Button */}
              <VerticalStack gap="200">
                <Button
                  variant={plan.price_monthly === 0 ? "secondary" : "primary"}
                  size="large"
                  fullWidth
                  onClick={() => handleSubscribe(plan)}
                  loading={isProcessing && selectedPlan?.name === plan.name}
                  disabled={isProcessing}
                >
                  {isProcessing && selectedPlan?.name === plan.name 
                    ? 'Processing...' 
                    : plan.price_monthly === 0 
                      ? 'Get Started Free' 
                      : `Subscribe to ${plan.name}`
                  }
                </Button>
                
                {plan.price_monthly > 0 && (
                  <Text variant="bodySm" tone="subdued" align="center">
                    Cancel anytime. No setup fees.
                  </Text>
                )}
              </VerticalStack>
            </VerticalStack>
          </LegacyCard>
        ))}
      </HorizontalStack>

      {/* Additional Info */}
      <LegacyCard sectioned>
        <VerticalStack gap="300" align="center">
          <Text variant="headingMd" as="h3">
            Why Choose Maldify?
          </Text>
          <HorizontalStack gap="600" align="center">
            <VerticalStack gap="100" align="center">
              <Text variant="bodyMd" fontWeight="semibold">
                🚀 AI-Powered
              </Text>
              <Text variant="bodySm" tone="subdued" align="center">
                Smart recommendations that boost sales
              </Text>
            </VerticalStack>
            <VerticalStack gap="100" align="center">
              <Text variant="bodyMd" fontWeight="semibold">
                📈 Proven Results
              </Text>
              <Text variant="bodySm" tone="subdued" align="center">
                Increase average order value by 25%
              </Text>
            </VerticalStack>
            <VerticalStack gap="100" align="center">
              <Text variant="bodyMd" fontWeight="semibold">
                🛡️ Secure & Reliable
              </Text>
              <Text variant="bodySm" tone="subdued" align="center">
                Enterprise-grade security
              </Text>
            </VerticalStack>
          </HorizontalStack>
        </VerticalStack>
      </LegacyCard>
    </VerticalStack>
  );
}

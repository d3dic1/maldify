import React, { useState, useEffect } from 'react';
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
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

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

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    console.log('Selected plan for subscription:', {
      name: plan.name,
      price: plan.price_monthly,
      limit: plan.limit,
      features: plan.features
    });
    
    // TODO: Implement actual billing flow in next step
    alert(`Selected plan: ${plan.name} - $${plan.price_monthly}/month`);
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
                >
                  {plan.price_monthly === 0 ? 'Get Started Free' : `Subscribe to ${plan.name}`}
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

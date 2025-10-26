import React, { useState, useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import {
  LegacyCard,
  Text,
  Button,
  VerticalStack,
  Banner,
  Spinner,
  Badge,
  Divider,
} from '@shopify/polaris';

export default function BillingCard() {
  const app = useAppBridge();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check subscription status on component mount
  useEffect(() => {
    checkSubscriptionStatus();
    
    // Check for billing success/error from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('billing') === 'success') {
      setSuccess(true);
      // Remove the param from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('billing') === 'error') {
      setError('Failed to activate subscription. Please try again.');
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/billing/check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check subscription status');
      }

      const data = await response.json();
      setSubscriptionStatus(data);
    } catch (err) {
      console.error('Error checking subscription status:', err);
      setError('Failed to check subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscription = async () => {
    try {
      setIsSettingUp(true);
      setError(null);

      const response = await fetch('/api/billing/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        Redirect.create(app).dispatch(Redirect.Action.REMOTE, confirmationUrl);
      } else {
        // Fallback to window.location if App Bridge is not available
        console.warn('App Bridge not available, using window.location fallback');
        window.location.href = confirmationUrl;
      }
      
    } catch (err) {
      console.error('Error setting up billing:', err);
      setError(err.message);
      setIsSettingUp(false);
    }
  };

  const handlePause = async () => {
    try {
      setIsPausing(true);
      setError(null);

      const subscriptionId = subscriptionStatus?.subscription_id;
      if (!subscriptionId) {
        throw new Error('No active subscription found to pause');
      }

      console.log('Pausing subscription:', subscriptionId);

      const response = await fetch('/api/billing/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscriptionId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to pause subscription');
      }

      const data = await response.json();
      console.log('Subscription paused successfully:', data);

      // Update local state to reflect paused status
      setSubscriptionStatus(prev => ({
        ...prev,
        status: 'frozen',
        plan_name: data.subscription?.name || prev.plan_name
      }));

      setSuccess('Subscription paused successfully. You can reactivate it anytime.');
      
    } catch (err) {
      console.error('Error pausing subscription:', err);
      setError(err.message);
    } finally {
      setIsPausing(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsCanceling(true);
      setError(null);

      const subscriptionId = subscriptionStatus?.subscription_id;
      if (!subscriptionId) {
        throw new Error('No active subscription found to cancel');
      }

      console.log('Canceling subscription:', subscriptionId);

      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscriptionId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      const data = await response.json();
      console.log('Subscription canceled successfully:', data);

      // Update local state to reflect canceled status
      setSubscriptionStatus(prev => ({
        ...prev,
        status: 'cancelled',
        has_subscription: false,
        plan_name: data.subscription?.name || prev.plan_name
      }));

      setSuccess('Subscription canceled successfully. You can subscribe again anytime.');
      
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err.message);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleDismissError = () => {
    setError(null);
  };

  const handleDismissSuccess = () => {
    setSuccess(false);
    // Refresh subscription status after successful billing
    checkSubscriptionStatus();
  };

  if (isLoading) {
    return (
      <LegacyCard>
        <LegacyCard.Section>
          <VerticalStack align="center">
            <Spinner size="small" />
            <Text variant="bodyMd">Checking subscription status...</Text>
          </VerticalStack>
        </LegacyCard.Section>
      </LegacyCard>
    );
  }

  const hasActiveSubscription = subscriptionStatus?.has_subscription;
  const planName = subscriptionStatus?.plan_name;
  const planPrice = subscriptionStatus?.plan_price;
  const subscriptionStatusText = subscriptionStatus?.status || 'inactive';

  return (
    <LegacyCard>
      <LegacyCard.Section>
        <VerticalStack gap="400">
          <VerticalStack gap="200">
            <Text variant="headingMd" as="h2">
              Maldify Pro Subscription
            </Text>
            {hasActiveSubscription && (
              <Badge 
                status={
                  subscriptionStatusText === 'active' ? 'success' : 
                  subscriptionStatusText === 'frozen' ? 'warning' : 
                  subscriptionStatusText === 'cancelled' ? 'critical' : 'info'
                }
              >
                {subscriptionStatusText === 'active' ? 'Active Plan' :
                 subscriptionStatusText === 'frozen' ? 'Paused Plan' :
                 subscriptionStatusText === 'cancelled' ? 'Cancelled Plan' : 'Plan'}
              </Badge>
            )}
          </VerticalStack>
          
          <Text variant="bodyMd" tone="subdued">
            Unlock advanced AI features and unlimited post-purchase upsells with Maldify Pro.
          </Text>

          {error && (
            <Banner status="critical" onDismiss={handleDismissError}>
              {error}
            </Banner>
          )}

          {success && (
            <Banner status="success" onDismiss={handleDismissSuccess}>
              Subscription activated successfully! Welcome to Maldify Pro.
            </Banner>
          )}
        </VerticalStack>
      </LegacyCard.Section>

      <Divider />

      <LegacyCard.Section>
        {hasActiveSubscription ? (
          <VerticalStack gap="400">
            <VerticalStack gap="200">
              <Text variant="bodyMd">
                <strong>Current Plan:</strong> {planName}
              </Text>
              <Text variant="bodyMd" tone="subdued">
                <strong>Price:</strong> ${planPrice}/month
              </Text>
              <Text variant="bodyMd" tone="subdued">
                <strong>Status:</strong> {
                  subscriptionStatusText === 'active' ? 'Active' :
                  subscriptionStatusText === 'frozen' ? 'Paused' :
                  subscriptionStatusText === 'cancelled' ? 'Cancelled' : 'Unknown'
                }
              </Text>
            </VerticalStack>
            
            <Banner status="success">
              <Text variant="bodyMd">
                🎉 You have access to all Maldify Pro features including advanced AI recommendations, 
                unlimited upsells, and priority support.
              </Text>
            </Banner>

            {/* Pause and Cancel Buttons */}
            <VerticalStack gap="200">
              {subscriptionStatusText === 'active' && (
                <Button
                  variant="secondary"
                  size="medium"
                  onClick={handlePause}
                  loading={isPausing}
                  disabled={isPausing || isCanceling}
                >
                  {isPausing ? 'Pausing...' : 'Pause Subscription'}
                </Button>
              )}
              
              {subscriptionStatusText === 'frozen' && (
                <VerticalStack gap="200">
                  <Button
                    variant="primary"
                    size="medium"
                    onClick={() => {
                      // TODO: Implement resume functionality
                      alert('Resume functionality will be implemented in the next step');
                    }}
                  >
                    Resume Subscription
                  </Button>
                  <Button
                    variant="secondary"
                    size="medium"
                    onClick={handleCancel}
                    loading={isCanceling}
                    disabled={isPausing || isCanceling}
                  >
                    {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
                  </Button>
                </VerticalStack>
              )}
              
              {subscriptionStatusText === 'cancelled' && (
                <Button
                  variant="primary"
                  size="medium"
                  onClick={handleSubscription}
                  loading={isSettingUp}
                  disabled={isSettingUp}
                >
                  Resubscribe to Maldify Pro
                </Button>
              )}
            </VerticalStack>
          </VerticalStack>
        ) : (
          <VerticalStack gap="400">
            <VerticalStack gap="200">
              <Text variant="bodyMd">
                <strong>Maldify Pro Features:</strong>
              </Text>
              <ul style={{ marginLeft: '20px', color: '#6B7280' }}>
                <li>Advanced AI-powered product recommendations</li>
                <li>Unlimited post-purchase upsells</li>
                <li>Custom discount strategies</li>
                <li>Analytics and performance insights</li>
                <li>Priority customer support</li>
              </ul>
            </VerticalStack>

            <VerticalStack gap="200">
              <Text variant="bodyMd">
                <strong>Pricing:</strong> $29.99/month
              </Text>
              <Text variant="bodyMd" tone="subdued">
                Cancel anytime. No setup fees.
              </Text>
            </VerticalStack>

            <VerticalStack align="end">
              <Button
                variant="primary"
                size="large"
                onClick={handleSubscription}
                loading={isSettingUp}
                disabled={isSettingUp}
              >
                Subscribe to Maldify Pro
              </Button>
            </VerticalStack>
          </VerticalStack>
        )}
      </LegacyCard.Section>

      {!hasActiveSubscription && (
        <LegacyCard.Section>
          <Banner status="info">
            <Text variant="bodyMd">
              <strong>Free Trial:</strong> Start with our free plan and upgrade anytime. 
              Your current setup will continue working with basic features.
            </Text>
          </Banner>
        </LegacyCard.Section>
      )}
    </LegacyCard>
  );
}
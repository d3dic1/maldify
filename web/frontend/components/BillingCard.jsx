import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Text,
  Banner,
  Stack,
  Spinner,
  Badge,
  Divider,
} from '@shopify/polaris';
import { useAppBridge } from '../providers/AppBridgeProvider';
import { Redirect } from '@shopify/app-bridge/actions';

export default function BillingCard() {
  const app = useAppBridge();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
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

  const handleSubscribe = async () => {
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
      if (app && app.dispatch) {
        const redirect = Redirect.create(app);
        redirect.dispatch(Redirect.Action.REMOTE, confirmationUrl);
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
      <Card>
        <Card.Section>
          <Stack alignment="center">
            <Spinner size="small" />
            <Text variant="bodyMd">Checking subscription status...</Text>
          </Stack>
        </Card.Section>
      </Card>
    );
  }

  const hasActiveSubscription = subscriptionStatus?.has_subscription;
  const planName = subscriptionStatus?.plan_name;
  const planPrice = subscriptionStatus?.plan_price;

  return (
    <Card>
      <Card.Section>
        <Stack vertical spacing="loose">
          <Stack>
            <Text variant="headingMd" as="h2">
              Maldify Pro Subscription
            </Text>
            {hasActiveSubscription && (
              <Badge status="success">Active Plan</Badge>
            )}
          </Stack>
          
          <Text variant="bodyMd" color="subdued">
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
        </Stack>
      </Card.Section>

      <Divider />

      <Card.Section>
        {hasActiveSubscription ? (
          <Stack vertical spacing="loose">
            <Stack vertical spacing="tight">
              <Text variant="bodyMd">
                <strong>Current Plan:</strong> {planName}
              </Text>
              <Text variant="bodyMd" color="subdued">
                <strong>Price:</strong> ${planPrice}/month
              </Text>
              <Text variant="bodyMd" color="subdued">
                <strong>Status:</strong> Active
              </Text>
            </Stack>
            
            <Banner status="success">
              <Text variant="bodyMd">
                🎉 You have access to all Maldify Pro features including advanced AI recommendations, 
                unlimited upsells, and priority support.
              </Text>
            </Banner>
          </Stack>
        ) : (
          <Stack vertical spacing="loose">
            <Stack vertical spacing="tight">
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
            </Stack>

            <Stack vertical spacing="tight">
              <Text variant="bodyMd">
                <strong>Pricing:</strong> $29.99/month
              </Text>
              <Text variant="bodyMd" color="subdued">
                Cancel anytime. No setup fees.
              </Text>
            </Stack>

            <Stack distribution="trailing">
              <Button
                primary
                size="large"
                onClick={handleSubscribe}
                loading={isSettingUp}
                disabled={isSettingUp}
              >
                Subscribe to Maldify Pro
              </Button>
            </Stack>
          </Stack>
        )}
      </Card.Section>

      {!hasActiveSubscription && (
        <Card.Section>
          <Banner status="info">
            <Text variant="bodyMd">
              <strong>Free Trial:</strong> Start with our free plan and upgrade anytime. 
              Your current setup will continue working with basic features.
            </Text>
          </Banner>
        </Card.Section>
      )}
    </Card>
  );
}

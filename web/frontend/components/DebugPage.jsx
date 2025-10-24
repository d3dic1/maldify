import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Text,
  Banner,
  Stack,
  Spinner,
  Divider,
} from '@shopify/polaris';

// Simplified version of BillingCard for debugging
function DebugBillingCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setIsLoading(true);
        console.log('Debug: Attempting to check billing status...');
        
        const response = await fetch('/api/billing/check-status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('Debug: Billing status response:', response);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Debug: Billing status data:', data);
        setSubscriptionStatus(data);
      } catch (err) {
        console.error('Debug: Error checking billing status:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <Card.Section>
          <Stack alignment="center">
            <Spinner size="small" />
            <Text variant="bodyMd">Debug: Checking billing status...</Text>
          </Stack>
        </Card.Section>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Section>
          <Banner status="critical" title="Debug: Billing API Error">
            <p>Error: {error}</p>
            <p>This is likely the cause of your blank page issue.</p>
          </Banner>
        </Card.Section>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Section>
        <Banner status="success" title="Debug: Billing API Working">
          <p>Billing status check successful!</p>
          <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px' }}>
            {JSON.stringify(subscriptionStatus, null, 2)}
          </pre>
        </Banner>
      </Card.Section>
    </Card>
  );
}

// Debug version of SettingsCard
function DebugSettingsCard() {
  return (
    <Card>
      <Card.Section>
        <Banner status="info" title="Debug: Settings Card">
          <p>Settings card is rendering correctly.</p>
        </Banner>
      </Card.Section>
    </Card>
  );
}

export default function DebugPage() {
  const [showBilling, setShowBilling] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <Stack vertical spacing="loose">
        <Banner status="info" title="Debug Mode Active">
          <p>This is a debug version to isolate the component causing the blank page.</p>
        </Banner>

        <Stack>
          <Button onClick={() => setShowBilling(!showBilling)}>
            {showBilling ? 'Hide' : 'Test'} Billing Card
          </Button>
          <Button onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? 'Hide' : 'Test'} Settings Card
          </Button>
        </Stack>

        {showBilling && (
          <>
            <Divider />
            <DebugBillingCard />
          </>
        )}

        {showSettings && (
          <>
            <Divider />
            <DebugSettingsCard />
          </>
        )}

        <Banner status="warning" title="Debug Instructions">
          <p>1. Test each component individually by clicking the buttons above</p>
          <p>2. Check browser console for any errors</p>
          <p>3. If Billing Card fails, that's likely your issue</p>
          <p>4. Once identified, replace this debug page with your original components</p>
        </Banner>
      </Stack>
    </div>
  );
}

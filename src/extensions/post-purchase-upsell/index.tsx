import React, { useEffect, useState } from 'react';

// Mock UI components for development
const BlockStack = ({ children, spacing }) => <div style={{ display: 'flex', flexDirection: 'column', gap: spacing || '8px' }}>{children}</div>;
const Button = ({ children, onPress, loading, disabled, kind }) => (
  <button 
    onClick={onPress} 
    disabled={disabled || loading}
    style={{ 
      padding: '12px 24px', 
      backgroundColor: kind === 'primary' ? '#0070f3' : '#f0f0f0',
      color: kind === 'primary' ? 'white' : 'black',
      border: 'none',
      borderRadius: '4px',
      cursor: disabled || loading ? 'not-allowed' : 'pointer'
    }}
  >
    {loading ? 'Loading...' : children}
  </button>
);
const Text = ({ children, size, emphasis }) => (
  <div style={{ 
    fontSize: size === 'large' ? '18px' : '14px',
    fontWeight: emphasis === 'bold' ? 'bold' : 'normal'
  }}>
    {children}
  </div>
);

// Mock hooks for development
const usePostPurchase = () => ({
  updateMetafield: async ({ namespace, key, value }) => {
    console.log('Mock updateMetafield:', { namespace, key, value });
    return Promise.resolve();
  }
});

const useMetafield = ({ namespace, key }) => {
  // Mock metafield - return proper structure for development
  return {
    namespace,
    key,
    value: null, // No existing metafield in development
    id: `mock-${namespace}-${key}`
  };
};

const useApplyMetafieldsChange = () => {
  // Return a function that can be called
  return (metafieldData) => {
    console.log('Mock applyMetafieldsChange:', metafieldData);
    return Promise.resolve();
  };
};

export default function PostPurchaseUpsell() {
  const postPurchase = usePostPurchase();
  const applyMetafieldsChange = useApplyMetafieldsChange();
  const [isUpsellClaimed, setIsUpsellClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if the initial purchase metafield exists to prevent duplicate upsells
  const initialPurchaseMetafield = useMetafield({
    namespace: 'maldify',
    key: 'initial_purchase',
  });

  // Check if upsell has already been claimed
  const claimedMetafield = useMetafield({
    namespace: 'maldify',
    key: 'claimed',
  });

  useEffect(() => {
    // If initial purchase metafield exists or upsell already claimed, don't show
    if (initialPurchaseMetafield || claimedMetafield?.value === 'true') {
      setIsUpsellClaimed(true);
    }
  }, [initialPurchaseMetafield, claimedMetafield]);

  const handleAcceptOffer = async () => {
    setIsLoading(true);
    
    try {
      // Set temporary ownership verification key
      await postPurchase.updateMetafield({
        namespace: 'maldify',
        key: 'claimed',
        value: 'true',
      });

      // Apply the metafield change
      await applyMetafieldsChange({
        type: 'updateMetafield',
        namespace: 'maldify',
        key: 'claimed',
        value: 'true',
      });

      setIsUpsellClaimed(true);
      
      // Here you would typically redirect to the upsell product page
      // or trigger additional post-purchase flow logic
      console.log('Upsell offer accepted!');
      
    } catch (error) {
      console.error('Error accepting upsell offer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if upsell has already been claimed or initial purchase metafield exists
  if (isUpsellClaimed) {
    return null;
  }

  return (
    <BlockStack spacing="base">
      <Text size="large" emphasis="bold">
        Maldify Exclusive: Upgrade Your Order Now!
      </Text>
      
      <Button
        kind="primary"
        onPress={handleAcceptOffer}
        loading={isLoading}
        disabled={isLoading}
      >
        Claim My Upgrade
      </Button>
    </BlockStack>
  );
}

import React, { useEffect, useState } from 'react';
import {
  BlockStack,
  Button,
  Text,
  usePostPurchase,
  useMetafield,
  useApplyMetafieldsChange,
} from '@shopify/ui-extensions-react/checkout';

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
      applyMetafieldsChange({
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

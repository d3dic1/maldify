import React, { useState, useEffect } from 'react';
import {
  useExtensionApi,
  useCartLines,
  useCartCost,
  useSettings,
  useApplyCartLinesChange,
  useTranslate,
  Banner,
  BlockStack,
  Button,
  Text,
  Card,
  InlineStack,
  Spinner,
  Divider,
} from '@shopify/ui-extensions-react/checkout';

export default function CheckoutUpsell() {
  const { query } = useExtensionApi();
  const cartLines = useCartLines();
  const cartCost = useCartCost();
  const applyCartLinesChange = useApplyCartLinesChange();
  const translate = useTranslate();
  const settings = useSettings();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissedOffers, setDismissedOffers] = useState(new Set());
  const [addedProducts, setAddedProducts] = useState(new Set());

  // Get product IDs from cart
  const productIds = cartLines.map(line => line.merchandise.product.id);

  // Fetch AI recommendations
  const fetchRecommendations = async () => {
    if (productIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_ids: productIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.recommendations) {
        setRecommendations(data.recommendations);
        console.log('AI Recommendations received:', data.recommendations);
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recommendations when cart changes
  useEffect(() => {
    if (productIds.length > 0) {
      fetchRecommendations();
    }
  }, [productIds.join(',')]);

  // Add recommended product to cart
  const addToCart = async (recommendation) => {
    try {
      setLoading(true);
      
      // Create cart line for the recommended product
      const cartLine = {
        merchandiseId: `gid://shopify/ProductVariant/${recommendation.product_id}`,
        quantity: 1,
      };

      await applyCartLinesChange({
        type: 'addCartLine',
        cartLine: cartLine,
      });

      // Mark as added and dismissed
      setAddedProducts(prev => new Set([...prev, recommendation.product_id]));
      setDismissedOffers(prev => new Set([...prev, recommendation.product_id]));
      
      console.log(`Added product ${recommendation.product_id} to cart`);
    } catch (err) {
      console.error('Error adding product to cart:', err);
      setError('Failed to add product to cart');
    } finally {
      setLoading(false);
    }
  };

  // Dismiss offer
  const dismissOffer = (productId) => {
    setDismissedOffers(prev => new Set([...prev, productId]));
  };

  // Filter out dismissed and already added recommendations
  const activeRecommendations = recommendations.filter(
    rec => !dismissedOffers.has(rec.product_id) && !addedProducts.has(rec.product_id)
  );

  // Don't show anything if no active recommendations
  if (activeRecommendations.length === 0 && !loading && !error) {
    return null;
  }

  return (
    <BlockStack spacing="base">
      {loading && (
        <Card>
          <InlineStack spacing="base" alignment="center">
            <Spinner size="small" />
            <Text>Generišemo preporuke za vas...</Text>
          </InlineStack>
        </Card>
      )}

      {error && (
        <Banner status="critical">
          <Text>Greška pri učitavanju preporuka: {error}</Text>
        </Banner>
      )}

      {activeRecommendations.map((recommendation, index) => (
        <Card key={`${recommendation.product_id}-${index}`}>
          <BlockStack spacing="tight">
            <InlineStack spacing="base" alignment="spaceBetween">
              <BlockStack spacing="extraTight">
                <Text size="medium" emphasis="strong">
                  {settings.title || 'Preporučujemo vam'}
                </Text>
                <Text size="small" appearance="subdued">
                  Pouzdanost: {Math.round(recommendation.confidence * 100)}%
                </Text>
              </BlockStack>
              <Button
                kind="plain"
                onPress={() => dismissOffer(recommendation.product_id)}
              >
                ✕
              </Button>
            </InlineStack>

            <Divider />

            <Text size="small">
              {recommendation.message}
            </Text>

            <InlineStack spacing="base" alignment="spaceBetween">
              <Text size="small" appearance="subdued">
                Kategorija: {recommendation.category}
              </Text>
              <InlineStack spacing="tight">
                <Button
                  kind="secondary"
                  onPress={() => dismissOffer(recommendation.product_id)}
                >
                  Ne hvala
                </Button>
                <Button
                  kind="primary"
                  onPress={() => addToCart(recommendation)}
                  loading={loading}
                >
                  {settings.button_text || 'Dodaj u korpu'}
                </Button>
              </InlineStack>
            </InlineStack>
          </BlockStack>
        </Card>
      ))}

      {addedProducts.size > 0 && (
        <Banner status="success">
          <Text>
            Uspješno ste dodali {addedProducts.size} preporučenih proizvoda u korpu!
          </Text>
        </Banner>
      )}
    </BlockStack>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Card,
  FormLayout,
  Select,
  Button,
  Text,
  Banner,
  Stack,
  Divider,
  Badge,
  Checkbox,
  TextField,
} from '@shopify/polaris';

// Mock product data - in production, this would come from your API
const mockProducts = [
  { value: '111222333', label: 'Premium Wireless Headphones - $99.99', price: 99.99 },
  { value: '444555666', label: 'Phone Case - $49.99', price: 49.99 },
  { value: '777888999', label: 'Screen Protector - $19.99', price: 19.99 },
  { value: '101112131', label: 'Charging Cable - $29.99', price: 29.99 },
  { value: '141516171', label: 'Bluetooth Speaker - $79.99', price: 79.99 },
  { value: '181920212', label: 'Laptop Stand - $59.99', price: 59.99 },
];

export default function SettingsCard() {
  const [premiumProductId, setPremiumProductId] = useState('');
  const [complementaryProductId, setComplementaryProductId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // New Pro Plan settings
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [maxDiscountPercent, setMaxDiscountPercent] = useState('15');
  const [productType, setProductType] = useState('');

  // Load saved settings on component mount
  useEffect(() => {
    // In production, this would fetch from your API
    // For now, we'll use localStorage as a mock
    const savedPremium = localStorage.getItem('maldify_premium_product_id');
    const savedComplementary = localStorage.getItem('maldify_complementary_product_id');
    const savedAIEnabled = localStorage.getItem('maldify_ai_enabled');
    const savedMaxDiscount = localStorage.getItem('maldify_max_discount');
    const savedProductType = localStorage.getItem('maldify_product_type');
    
    if (savedPremium) setPremiumProductId(savedPremium);
    if (savedComplementary) setComplementaryProductId(savedComplementary);
    if (savedAIEnabled) setIsAiEnabled(savedAIEnabled === 'true');
    if (savedMaxDiscount) setMaxDiscountPercent(savedMaxDiscount);
    if (savedProductType) setProductType(savedProductType);
  }, []);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would make an API call to save settings
      // For now, we'll use localStorage as a mock
      localStorage.setItem('maldify_premium_product_id', premiumProductId);
      localStorage.setItem('maldify_complementary_product_id', complementaryProductId);
      localStorage.setItem('maldify_ai_enabled', isAiEnabled.toString());
      localStorage.setItem('maldify_max_discount', maxDiscountPercent);
      localStorage.setItem('maldify_product_type', productType);
      
      setShowSuccess(true);
      
      // Hide success banner after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedProduct = (productId) => {
    return mockProducts.find(product => product.value === productId);
  };

  const isFormValid = premiumProductId && complementaryProductId && premiumProductId !== complementaryProductId;

  return (
    <Card>
      <Card.Section>
        <Stack vertical spacing="loose">
          <Stack>
            <Text variant="headingMd" as="h2">
              Maldify Product Mapping Settings
            </Text>
            <Badge status="info">AI Configuration</Badge>
          </Stack>
          
          <Text variant="bodyMd" color="subdued">
            Configure which products Maldify will recommend for post-purchase upsells based on cart analysis.
          </Text>

          {showSuccess && (
            <Banner status="success" onDismiss={() => setShowSuccess(false)}>
              Settings saved successfully! Your AI recommendations are now updated.
            </Banner>
          )}
        </Stack>
      </Card.Section>

      <Divider />

      <Card.Section>
        <FormLayout>
          <FormLayout.Group>
            <Select
              label="Premium Accessory Product"
              helpText="Product offered at 50% discount when cart contains more than 2 items"
              options={[
                { value: '', label: 'Select a product...' },
                ...mockProducts.map(product => ({
                  value: product.value,
                  label: product.label
                }))
              ]}
              value={premiumProductId}
              onChange={setPremiumProductId}
              error={premiumProductId && complementaryProductId && premiumProductId === complementaryProductId 
                ? 'Premium and Complementary products must be different' 
                : undefined}
            />
            
            {premiumProductId && (
              <Stack spacing="tight">
                <Text variant="bodyMd" color="subdued">
                  Selected: {getSelectedProduct(premiumProductId)?.label}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  Offer Price: ${(getSelectedProduct(premiumProductId)?.price * 0.5).toFixed(2)} (50% off)
                </Text>
              </Stack>
            )}
          </FormLayout.Group>

          <FormLayout.Group>
            <Select
              label="Recommended Complementary Item"
              helpText="Product offered at full price when cart contains 2 or fewer items"
              options={[
                { value: '', label: 'Select a product...' },
                ...mockProducts.map(product => ({
                  value: product.value,
                  label: product.label
                }))
              ]}
              value={complementaryProductId}
              onChange={setComplementaryProductId}
              error={premiumProductId && complementaryProductId && premiumProductId === complementaryProductId 
                ? 'Premium and Complementary products must be different' 
                : undefined}
            />
            
            {complementaryProductId && (
              <Stack spacing="tight">
                <Text variant="bodyMd" color="subdued">
                  Selected: {getSelectedProduct(complementaryProductId)?.label}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  Offer Price: ${getSelectedProduct(complementaryProductId)?.price.toFixed(2)} (Full price)
                </Text>
              </Stack>
            )}
          </FormLayout.Group>

          <Divider />

          <FormLayout.Group>
            <Text variant="headingMd" as="h3">
              Maldify Pro Features
            </Text>
            <Text variant="bodyMd" color="subdued">
              Advanced AI-powered configuration options for Pro subscribers
            </Text>
          </FormLayout.Group>

          <FormLayout.Group>
            <Checkbox
              label="Enable AI Contextual Suggestion"
              helpText="Use AI to analyze customer behavior and suggest personalized upsells"
              checked={isAiEnabled}
              onChange={setIsAiEnabled}
            />
          </FormLayout.Group>

          {isAiEnabled && (
            <>
              <FormLayout.Group>
                <TextField
                  label="Maximum Discount (%) for AI Offer"
                  type="number"
                  value={maxDiscountPercent}
                  onChange={setMaxDiscountPercent}
                  helpText="Maximum discount percentage that AI can apply to upsell offers"
                  min="0"
                  max="100"
                  suffix="%"
                />
              </FormLayout.Group>

              <FormLayout.Group>
                <Select
                  label="Product Type for AI Upsells"
                  helpText="Type of product that AI should prioritize for contextual suggestions"
                  options={[
                    { value: '', label: 'Select product type...' },
                    { value: 'high_margin', label: 'High Margin Item' },
                    { value: 'subscription_box', label: 'Subscription Box' },
                    { value: 'low_value_accessory', label: 'Low Value Accessory' }
                  ]}
                  value={productType}
                  onChange={setProductType}
                />
              </FormLayout.Group>
            </>
          )}

          <Divider />

          <Stack distribution="trailing">
            <Button
              primary
              onClick={handleSaveSettings}
              loading={isLoading}
              disabled={!isFormValid}
            >
              Save Product Mapping
            </Button>
          </Stack>
        </FormLayout>
      </Card.Section>

      <Card.Section>
        <Banner status="info">
          <Text variant="bodyMd">
            <strong>How it works:</strong> Maldify analyzes customer cart contents and automatically 
            recommends the appropriate product based on your configured mapping. Premium accessories 
            are offered with 50% discount to high-value customers, while complementary items are 
            suggested at full price to standard customers.
          </Text>
        </Banner>
      </Card.Section>

      <Card.Section>
        <Banner status="success">
          <Text variant="bodyMd">
            <strong>Pro Features:</strong> AI Contextual Suggestion uses machine learning to analyze 
            customer behavior patterns and suggest personalized upsells. Configure maximum discount 
            limits and product type preferences to optimize your revenue while maintaining healthy margins.
          </Text>
        </Banner>
      </Card.Section>
    </Card>
  );
}
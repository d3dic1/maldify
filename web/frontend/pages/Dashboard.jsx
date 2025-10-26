import React, { useState, useEffect } from 'react';
import {
  LegacyCard,
  Card,
  Text,
  VerticalStack,
  HorizontalStack,
  Spinner,
  Banner,
  Badge,
  Divider,
} from '@shopify/polaris';

export default function Dashboard() {
  const [roiData, setRoiData] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChurnLoading, setIsChurnLoading] = useState(true);
  const [error, setError] = useState(null);
  const [churnError, setChurnError] = useState(null);

  // Fetch analytics data
  useEffect(() => {
    fetchROIData();
    fetchChurnData();
  }, []);

  const fetchROIData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/roi', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ROI analytics');
      }

      const data = await response.json();
      setRoiData(data);
    } catch (err) {
      console.error('Error fetching ROI data:', err);
      setError('Failed to load ROI analytics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChurnData = async () => {
    try {
      setIsChurnLoading(true);
      setChurnError(null);

      const response = await fetch('/api/analytics/churn_risk', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch churn risk analytics');
      }

      const data = await response.json();
      setChurnData(data);
    } catch (err) {
      console.error('Error fetching churn data:', err);
      setChurnError('Failed to load churn risk analytics. Please try again.');
    } finally {
      setIsChurnLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getRiskBadge = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH':
        return <Badge status="critical">HIGH RISK</Badge>;
      case 'MEDIUM':
        return <Badge status="warning">MEDIUM RISK</Badge>;
      case 'LOW':
        return <Badge status="success">LOW RISK</Badge>;
      default:
        return <Badge>UNKNOWN</Badge>;
    }
  };

  const getROIColor = (roi) => {
    return roi >= 0 ? 'success' : 'critical';
  };

  const getROIBadge = (roi) => {
    return roi >= 0 ? 'success' : 'critical';
  };

  if (isLoading) {
    return (
      <LegacyCard>
        <LegacyCard.Section>
          <VerticalStack align="center" gap="400">
            <Spinner size="large" />
            <Text variant="bodyMd" tone="subdued">
              Loading ROI analytics...
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
      {/* Header */}
      <VerticalStack gap="200">
        <Text variant="headingLg" as="h1">
          Maldify Dashboard
        </Text>
        <Text variant="bodyMd" tone="subdued">
          Track your app's performance and return on investment
        </Text>
      </VerticalStack>

      {/* ROI Report Card */}
      <LegacyCard>
        <LegacyCard.Section>
          <VerticalStack gap="400">
            <VerticalStack gap="200">
              <Text variant="headingMd" as="h2">
                ROI Report (Last 30 Days)
              </Text>
              <Badge status="info">
                {roiData?.period_days} days period
              </Badge>
            </VerticalStack>

            <Divider />

            {/* Key Metrics */}
            <VerticalStack gap="400">
              {/* Total Revenue */}
              <HorizontalStack align="space-between">
                <VerticalStack gap="100">
                  <Text variant="bodyMd" tone="subdued">
                    Total Revenue
                  </Text>
                  <Text variant="headingLg" as="h3">
                    {formatCurrency(roiData?.revenue || 0)}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    From {roiData?.order_count || 0} orders
                  </Text>
                </VerticalStack>
                <Badge status="success">
                  Revenue
                </Badge>
              </HorizontalStack>

              {/* Subscription Cost */}
              <HorizontalStack align="space-between">
                <VerticalStack gap="100">
                  <Text variant="bodyMd" tone="subdued">
                    Subscription Cost
                  </Text>
                  <Text variant="headingLg" as="h3">
                    {formatCurrency(roiData?.cost || 0)}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Monthly Pro Plan
                  </Text>
                </VerticalStack>
                <Badge status="warning">
                  Cost
                </Badge>
              </HorizontalStack>

              {/* Net ROI */}
              <HorizontalStack align="space-between">
                <VerticalStack gap="100">
                  <Text variant="bodyMd" tone="subdued">
                    Net ROI
                  </Text>
                  <Text 
                    variant="headingLg" 
                    as="h3"
                    tone={getROIColor(roiData?.roi || 0)}
                  >
                    {formatCurrency(roiData?.roi || 0)}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    {roiData?.roi_percentage ? `${roiData.roi_percentage.toFixed(1)}% return` : '0% return'}
                  </Text>
                </VerticalStack>
                <Badge status={getROIBadge(roiData?.roi || 0)}>
                  {roiData?.roi >= 0 ? 'Profit' : 'Loss'}
                </Badge>
              </HorizontalStack>
            </VerticalStack>

            <Divider />

            {/* Additional Metrics */}
            <VerticalStack gap="300">
              <Text variant="bodyMd" fontWeight="semibold">
                Additional Insights
              </Text>
              
              <HorizontalStack gap="400" align="space-between">
                <VerticalStack gap="100">
                  <Text variant="bodySm" tone="subdued">
                    Average Order Value
                  </Text>
                  <Text variant="bodyMd" fontWeight="semibold">
                    {formatCurrency(roiData?.average_order_value || 0)}
                  </Text>
                </VerticalStack>
                
                <VerticalStack gap="100">
                  <Text variant="bodySm" tone="subdued">
                    ROI Percentage
                  </Text>
                  <Text 
                    variant="bodyMd" 
                    fontWeight="semibold"
                    tone={getROIColor(roiData?.roi || 0)}
                  >
                    {roiData?.roi_percentage ? `${roiData.roi_percentage.toFixed(1)}%` : '0%'}
                  </Text>
                </VerticalStack>
              </HorizontalStack>
            </VerticalStack>

            {/* Summary Message */}
            {roiData?.roi !== undefined && (
              <Banner 
                status={roiData.roi >= 0 ? 'success' : 'critical'}
              >
                <Text variant="bodyMd">
                  {roiData.roi >= 0 
                    ? `🎉 Great! Your Maldify subscription is generating $${roiData.roi.toFixed(2)} in profit over the last 30 days.`
                    : `⚠️ Your current ROI is negative. Consider optimizing your upsell strategies or reviewing your subscription plan.`
                  }
                </Text>
              </Banner>
            )}
          </VerticalStack>
        </LegacyCard.Section>
      </LegacyCard>

      {/* AI Churn/Return Risk Report */}
      <LegacyCard>
        <LegacyCard.Section>
          <VerticalStack gap="400">
            <HorizontalStack align="space-between">
              <Text variant="headingMd" as="h2">
                AI Churn/Return Risk Report
              </Text>
              {churnData && (
                <Badge status="info">
                  {churnData.analysis_period.days} days
                </Badge>
              )}
            </HorizontalStack>

            {isChurnLoading ? (
              <HorizontalStack gap="300" align="center">
                <Spinner size="small" />
                <Text>Analyzing product return patterns...</Text>
              </HorizontalStack>
            ) : churnError ? (
              <Banner status="critical">
                <Text>{churnError}</Text>
              </Banner>
            ) : churnData ? (
              <VerticalStack gap="400">
                {/* Summary Stats */}
                <VerticalStack gap="300">
                  <Text variant="bodyMd" fontWeight="semibold">
                    Risk Overview
                  </Text>
                  
                  <HorizontalStack gap="400" align="space-between">
                    <VerticalStack gap="100">
                      <Text variant="bodySm" tone="subdued">
                        Products Analyzed
                      </Text>
                      <Text variant="bodyMd" fontWeight="semibold">
                        {churnData.summary.total_products_analyzed}
                      </Text>
                    </VerticalStack>
                    
                    <VerticalStack gap="100">
                      <Text variant="bodySm" tone="subdued">
                        High Risk Products
                      </Text>
                      <Text variant="bodyMd" fontWeight="semibold" tone="critical">
                        {churnData.summary.high_risk_products}
                      </Text>
                    </VerticalStack>
                    
                    <VerticalStack gap="100">
                      <Text variant="bodySm" tone="subdued">
                        Overall Return Rate
                      </Text>
                      <Text variant="bodyMd" fontWeight="semibold">
                        {churnData.summary.overall_return_rate}%
                      </Text>
                    </VerticalStack>
                  </HorizontalStack>
                </VerticalStack>

                <Divider />

                {/* Top Risky Products */}
                <VerticalStack gap="300">
                  <Text variant="bodyMd" fontWeight="semibold">
                    Top 5 Risky Products
                  </Text>
                  
                  {churnData.top_risky_products.length > 0 ? (
                    <VerticalStack gap="200">
                      {churnData.top_risky_products.map((product, index) => (
                        <Card key={product.product_id}>
                          <VerticalStack gap="200">
                            <HorizontalStack align="space-between">
                              <VerticalStack gap="100">
                                <Text variant="bodyMd" fontWeight="semibold">
                                  {product.product_title}
                                </Text>
                                <Text variant="bodySm" tone="subdued">
                                  ID: {product.product_id}
                                </Text>
                              </VerticalStack>
                              {getRiskBadge(product.risk_level)}
                            </HorizontalStack>
                            
                            <HorizontalStack gap="400" align="space-between">
                              <VerticalStack gap="100">
                                <Text variant="bodySm" tone="subdued">
                                  Return Rate
                                </Text>
                                <Text variant="bodyMd" fontWeight="semibold" tone="critical">
                                  {product.return_rate}%
                                </Text>
                              </VerticalStack>
                              
                              <VerticalStack gap="100">
                                <Text variant="bodySm" tone="subdued">
                                  Risk Score
                                </Text>
                                <Text variant="bodyMd" fontWeight="semibold">
                                  {product.risk_score}
                                </Text>
                              </VerticalStack>
                              
                              <VerticalStack gap="100">
                                <Text variant="bodySm" tone="subdued">
                                  Total Sales
                                </Text>
                                <Text variant="bodyMd" fontWeight="semibold">
                                  {product.total_sales}
                                </Text>
                              </VerticalStack>
                              
                              <VerticalStack gap="100">
                                <Text variant="bodySm" tone="subdued">
                                  Total Refunds
                                </Text>
                                <Text variant="bodyMd" fontWeight="semibold" tone="critical">
                                  {product.total_refunds}
                                </Text>
                              </VerticalStack>
                            </HorizontalStack>
                          </VerticalStack>
                        </Card>
                      ))}
                    </VerticalStack>
                  ) : (
                    <Banner status="success">
                      <Text>No risky products found! All products have low return rates.</Text>
                    </Banner>
                  )}
                </VerticalStack>

                {/* Analysis Period */}
                <Text variant="bodySm" tone="subdued">
                  Analysis period: {churnData.analysis_period.start_date} to {churnData.analysis_period.end_date}
                </Text>
              </VerticalStack>
            ) : null}
          </VerticalStack>
        </LegacyCard.Section>
      </LegacyCard>

      {/* Quick Actions */}
      <LegacyCard>
        <LegacyCard.Section>
          <VerticalStack gap="300">
            <Text variant="headingMd" as="h3">
              Quick Actions
            </Text>
            <Text variant="bodyMd" tone="subdued">
              Manage your subscription and view detailed analytics
            </Text>
            <HorizontalStack gap="300">
              <Text variant="bodyMd">
                • View detailed order analytics
              </Text>
              <Text variant="bodyMd">
                • Manage subscription settings
              </Text>
              <Text variant="bodyMd">
                • Optimize upsell strategies
              </Text>
            </HorizontalStack>
          </VerticalStack>
        </LegacyCard.Section>
      </LegacyCard>
    </VerticalStack>
  );
}

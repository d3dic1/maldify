import React from 'react';
import { render, Banner } from '@shopify/ui-extensions-react/checkout';
import CheckoutUpsell from './CheckoutUpsell';

// Register the extension
render('Checkout::Dynamic::Render', () => <CheckoutUpsell />);

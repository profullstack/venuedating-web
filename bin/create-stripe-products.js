#!/usr/bin/env node

/**
 * Stripe Product Management Script
 * 
 * This script manages Stripe products and prices for the PDF service.
 * It ensures that the necessary products and prices exist in Stripe.
 * 
 * Usage:
 *   node bin/create-stripe-products.js
 * 
 * Environment variables:
 *   STRIPE_SECRET_KEY - Stripe API secret key
 */

import Stripe from 'stripe';
import dotenv from 'dotenv-flow';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..') });

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Product configuration
const PRODUCTS = [
  {
    name: 'PDF Service Subscription',
    description: 'Subscription for PDF conversion service',
    prices: [
      {
        nickname: 'Monthly Subscription',
        unit_amount: 500, // $5.00
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          plan: 'monthly'
        }
      },
      {
        nickname: 'Yearly Subscription',
        unit_amount: 3000, // $30.00
        currency: 'usd',
        recurring: {
          interval: 'year'
        },
        metadata: {
          plan: 'yearly'
        }
      }
    ]
  }
];

/**
 * Create or update a product in Stripe
 * @param {Object} productConfig - Product configuration
 * @returns {Promise<Object>} - Created or updated product
 */
async function createOrUpdateProduct(productConfig) {
  console.log(`Processing product: ${productConfig.name}`);
  
  // Check if product already exists
  const existingProducts = await stripe.products.list({
    active: true,
    limit: 100
  });
  
  const existingProduct = existingProducts.data.find(p => p.name === productConfig.name);
  
  let product;
  
  if (existingProduct) {
    console.log(`Product "${productConfig.name}" already exists with ID: ${existingProduct.id}`);
    product = existingProduct;
    
    // Update product if needed
    if (existingProduct.description !== productConfig.description) {
      console.log(`Updating product "${productConfig.name}"`);
      product = await stripe.products.update(existingProduct.id, {
        description: productConfig.description
      });
    }
  } else {
    // Create new product
    console.log(`Creating new product "${productConfig.name}"`);
    product = await stripe.products.create({
      name: productConfig.name,
      description: productConfig.description,
      active: true
    });
  }
  
  // Process prices
  for (const priceConfig of productConfig.prices) {
    await createOrUpdatePrice(product.id, priceConfig);
  }
  
  return product;
}

/**
 * Create or update a price in Stripe
 * @param {string} productId - Stripe product ID
 * @param {Object} priceConfig - Price configuration
 * @returns {Promise<Object>} - Created or updated price
 */
async function createOrUpdatePrice(productId, priceConfig) {
  console.log(`Processing price: ${priceConfig.nickname}`);
  
  // Check if price already exists
  const existingPrices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100
  });
  
  const existingPrice = existingPrices.data.find(p => 
    p.nickname === priceConfig.nickname && 
    p.unit_amount === priceConfig.unit_amount &&
    p.currency === priceConfig.currency &&
    p.recurring?.interval === priceConfig.recurring?.interval
  );
  
  if (existingPrice) {
    console.log(`Price "${priceConfig.nickname}" already exists with ID: ${existingPrice.id}`);
    
    // Update metadata if needed
    if (JSON.stringify(existingPrice.metadata) !== JSON.stringify(priceConfig.metadata)) {
      console.log(`Updating metadata for price "${priceConfig.nickname}"`);
      return await stripe.prices.update(existingPrice.id, {
        metadata: priceConfig.metadata
      });
    }
    
    return existingPrice;
  } else {
    // Create new price
    console.log(`Creating new price "${priceConfig.nickname}"`);
    return await stripe.prices.create({
      product: productId,
      nickname: priceConfig.nickname,
      unit_amount: priceConfig.unit_amount,
      currency: priceConfig.currency,
      recurring: priceConfig.recurring,
      metadata: priceConfig.metadata
    });
  }
}

/**
 * Main function to process all products
 */
async function main() {
  try {
    console.log('Starting Stripe product management...');
    
    // Check if Stripe API key is set
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    
    // Process all products
    for (const productConfig of PRODUCTS) {
      await createOrUpdateProduct(productConfig);
    }
    
    console.log('Stripe product management completed successfully');
  } catch (error) {
    console.error('Error in Stripe product management:', error);
    process.exit(1);
  }
}

// Run the main function
main();

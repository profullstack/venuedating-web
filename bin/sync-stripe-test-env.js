#!/usr/bin/env node

/**
 * Stripe Test Environment Setup Script
 * 
 * This script creates products and prices in your Stripe test environment and
 * updates the .env file with the new price IDs.
 * 
 * Usage:
 *   node bin/sync-stripe-test-env.js
 */

import Stripe from 'stripe';
import dotenv from 'dotenv-flow';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..') });

// Configuration
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

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function main() {
  console.log('Starting Stripe test environment setup...');
  
  // Create/update products and prices
  let monthlyPriceId = null;
  let yearlyPriceId = null;
  
  for (const productConfig of PRODUCTS) {
    // Check if product exists
    let product;
    const existingProducts = await stripe.products.list({
      active: true,
    });
    
    const existingProduct = existingProducts.data.find(p => p.name === productConfig.name);
    
    if (existingProduct) {
      console.log(`Product '${productConfig.name}' already exists with ID: ${existingProduct.id}`);
      product = existingProduct;
    } else {
      console.log(`Creating product: ${productConfig.name}`);
      product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        active: true,
      });
      console.log(`Created product with ID: ${product.id}`);
    }
    
    // Process prices for this product
    for (const priceConfig of productConfig.prices) {
      // Check for existing prices with the same nickname
      const existingPrices = await stripe.prices.list({
        active: true,
        product: product.id,
      });
      
      const existingPrice = existingPrices.data.find(p => p.nickname === priceConfig.nickname);
      
      if (existingPrice) {
        console.log(`Price '${priceConfig.nickname}' already exists with ID: ${existingPrice.id}`);
        
        // Store the price IDs
        if (priceConfig.metadata.plan === 'monthly') {
          monthlyPriceId = existingPrice.id;
        } else if (priceConfig.metadata.plan === 'yearly') {
          yearlyPriceId = existingPrice.id;
        }
      } else {
        console.log(`Creating price: ${priceConfig.nickname}`);
        const newPrice = await stripe.prices.create({
          product: product.id,
          nickname: priceConfig.nickname,
          unit_amount: priceConfig.unit_amount,
          currency: priceConfig.currency,
          recurring: priceConfig.recurring,
          metadata: priceConfig.metadata,
        });
        
        console.log(`Created price with ID: ${newPrice.id}`);
        
        // Store the price IDs
        if (priceConfig.metadata.plan === 'monthly') {
          monthlyPriceId = newPrice.id;
        } else if (priceConfig.metadata.plan === 'yearly') {
          yearlyPriceId = newPrice.id;
        }
      }
    }
  }
  
  // Update .env file with the new price IDs if they exist
  if (monthlyPriceId || yearlyPriceId) {
    console.log('Updating .env file with new price IDs...');
    
    const envFilePath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envFilePath, 'utf8');
    
    if (monthlyPriceId) {
      // Check if STRIPE_MONTHLY_PRICE_ID already exists in .env
      if (envContent.includes('STRIPE_MONTHLY_PRICE_ID=')) {
        // Replace existing value
        envContent = envContent.replace(
          /STRIPE_MONTHLY_PRICE_ID=.*/g,
          `STRIPE_MONTHLY_PRICE_ID=${monthlyPriceId}`
        );
      } else {
        // Add new variable
        envContent += `\nSTRIPE_MONTHLY_PRICE_ID=${monthlyPriceId}`;
      }
      console.log(`Set STRIPE_MONTHLY_PRICE_ID=${monthlyPriceId}`);
    }
    
    if (yearlyPriceId) {
      // Check if STRIPE_YEARLY_PRICE_ID already exists in .env
      if (envContent.includes('STRIPE_YEARLY_PRICE_ID=')) {
        // Replace existing value
        envContent = envContent.replace(
          /STRIPE_YEARLY_PRICE_ID=.*/g,
          `STRIPE_YEARLY_PRICE_ID=${yearlyPriceId}`
        );
      } else {
        // Add new variable
        envContent += `\nSTRIPE_YEARLY_PRICE_ID=${yearlyPriceId}`;
      }
      console.log(`Set STRIPE_YEARLY_PRICE_ID=${yearlyPriceId}`);
    }
    
    // Write updated content back to .env file
    fs.writeFileSync(envFilePath, envContent);
    
    console.log('.env file updated successfully!');
  }
  
  console.log('Stripe test environment setup complete!');
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

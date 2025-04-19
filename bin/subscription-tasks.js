#!/usr/bin/env node

import dotenvFlow from 'dotenv-flow';
import { paymentService } from '../src/services/payment-service.js';

// Load environment variables
dotenvFlow.config();

/**
 * Run subscription maintenance tasks
 */
async function runSubscriptionTasks() {
  try {
    console.log('Starting subscription maintenance tasks...');
    
    // Send payment reminders for expiring subscriptions
    console.log('Sending payment reminders...');
    const remindersSent = await paymentService.sendPaymentReminders();
    console.log(`Sent ${remindersSent} payment reminders.`);
    
    // Expire subscriptions that have passed their expiration date
    console.log('Expiring outdated subscriptions...');
    const subscriptionsExpired = await paymentService.expireSubscriptions();
    console.log(`Expired ${subscriptionsExpired} subscriptions.`);
    
    console.log('Subscription maintenance tasks completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error running subscription tasks:', error);
    process.exit(1);
  }
}

// Run the tasks
runSubscriptionTasks();
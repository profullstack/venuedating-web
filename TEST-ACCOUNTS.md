# Test Accounts for Chat Testing

This document contains the test accounts created for testing the chat functionality with phone authentication and OTP bypass.

## Test Users with Matches & Conversations

### 🔥 **Alex Johnson** (Recommended for testing)
- **Phone**: `+15551234567`
- **OTP Code**: `123456` (bypass enabled)
- **Profile**: Photographer who loves craft beer and exploring bars
- **Matches**: Sarah Chen
- **Conversations**: 8 messages with Sarah about photography, wine, and planning meetups
- **Status**: Active conversation, planning to meet at Vineyard Wine Bar

### 🍷 **Sarah Chen** (Most Active - Best for Testing)
- **Phone**: `+15551234568` 
- **OTP Code**: `123456` (bypass enabled)
- **Profile**: Wine enthusiast and foodie
- **Matches**: Alex Johnson, Mike Rodriguez
- **Conversations**: 
  - 8 messages with Alex (photography discussion, wine date planning)
  - 3 messages with Mike (wine recommendations)
- **Status**: Most active user with 2 conversations and recent activity

### 🏈 **Mike Rodriguez**
- **Phone**: `+15551234569`
- **OTP Code**: `123456` (bypass enabled)
- **Profile**: Sports fan and craft cocktail lover
- **Matches**: Sarah Chen
- **Conversations**: 3 messages with Sarah about wine preferences
- **Status**: Recent conversation about Vineyard Wine Bar

## How to Login

### Step 1: Run the Database Seeds
First, make sure you've run both migration files:

```bash
# Run the OTP bypass migration
supabase db push

# Run the chat seed script
psql -h your-supabase-host -U postgres -d postgres -f scripts/seed-chats.sql
```

### Step 2: Login Process
1. Go to your phone login page (`/phone-login`)
2. Enter one of the test phone numbers above
3. When prompted for OTP, enter: `123456`
4. The system will bypass SMS and log you in directly

### Step 3: Testing Chat Features
- **Sarah Chen** has the most activity - best for testing chat UI
- **Alex Johnson** has ongoing conversation planning - good for testing message flow
- **Mike Rodriguez** has shorter conversation - good for testing basic chat

## OTP Bypass Implementation

### Database Flag
- Added `bypass_otp` column to `profiles` table
- All test accounts have `bypass_otp = true`
- Migration: `20250808190800_add_otp_bypass_flag.sql`

### Code Integration
The bypass works through your existing development mode in `twilio-verify.js`:
- Code `123456` is already accepted in dev mode
- Test accounts are flagged in database for identification
- Utility functions available in `/src/utils/otp-bypass.js`

### Utility Functions Available
```javascript
import { shouldBypassOTP, isTestPhoneNumber, getBypassOTPCode } from './src/utils/otp-bypass.js';

// Check if phone should bypass OTP
const bypass = await shouldBypassOTP('+15551234567'); // true

// Check if it's a test number
const isTest = isTestPhoneNumber('+15551234567'); // true

// Get bypass code
const code = getBypassOTPCode(); // '123456'
```

## Chat Data Overview

### Conversations Created
1. **Alex ↔ Sarah**: 8 messages over 5 days (wine date planning)
2. **Sarah ↔ Mike**: 3 messages over 3 days (wine recommendations)

### Message Timeline
- **5 days ago**: Initial matches and first messages
- **3-4 days ago**: Conversation development
- **1-2 days ago**: Recent activity and planning
- **2 hours ago**: Latest message from Sarah

### Realistic Features
- ✅ Read/unread status tracking
- ✅ Conversation metadata (last message, timestamps)
- ✅ Unread message counts
- ✅ Natural conversation flow
- ✅ Emoji usage and realistic content
- ✅ Time-based message progression

## Troubleshooting

### If OTP Bypass Doesn't Work
1. Check if `bypass_otp` migration was applied
2. Verify test accounts have `bypass_otp = true` in profiles table
3. Ensure you're using exactly `123456` as the OTP code
4. Check that your app is in development mode

### If Users Don't Exist
1. Run the seed script: `scripts/seed-chats.sql`
2. Check Supabase auth.users table for the phone numbers
3. Verify profiles table has corresponding entries

### If Conversations Don't Show
1. Check matches table has entries for the users
2. Verify conversations table has the conversation records
3. Check messages table for message history
4. Ensure RLS policies allow user access

## Production Notes

⚠️ **Important**: The OTP bypass is intended for development/testing only. In production:
- Remove or disable the `bypass_otp` flag
- Remove test phone numbers
- Ensure proper SMS OTP verification is working
- Consider using Supabase test mode or staging environment

## Next Steps

1. Test login with Sarah Chen (`+15551234568`) - most active account
2. Navigate to chat/messages section
3. Verify conversations and messages display correctly
4. Test sending new messages
5. Verify real-time updates and read status
6. Test match functionality and new conversation creation

# Claude AI CV Parsing Debug Guide

## 🛠️ What's Been Implemented

### 1. **Enhanced Edge Function** (`supabase/functions/ai-chat/index.ts`)
- ✅ Added CV parsing context support (`context: 'cv_parsing'`)
- ✅ Comprehensive logging with emojis for easy debugging
- ✅ Detailed error handling and response validation
- ✅ Proper Claude API integration with timeout handling
- ✅ CORS and authentication checks

### 2. **Real Claude CV Parser** (`src/lib/real-claude-cv-parser.ts`)
- ✅ Actual Claude API integration via Edge Function
- ✅ Progress tracking with real-time updates
- ✅ Comprehensive error handling with specific error messages
- ✅ Fallback data extraction for non-JSON responses
- ✅ 30-second timeout protection
- ✅ Detailed console logging for debugging

### 3. **Enhanced JobProfileManager** (`src/components/JobProfileManager.tsx`)
- ✅ Updated to use REAL Claude AI parser
- ✅ Better error messages with user-friendly feedback
- ✅ Improved confidence calculation
- ✅ Claude AI branding throughout the UI
- ✅ Graceful fallback to manual form entry

### 4. **Debug Tools**
- ✅ `ClaudeAPITester.tsx` - Visual testing component
- ✅ `claude-api-test.ts` - Programmatic API tests
- ✅ `claude-cv-parser-test.ts` - Parser integration tests

## 🧪 Testing the Integration

### Option 1: Visual Debug Component

1. **Add the tester to your app** (temporarily for debugging):
```tsx
// In src/App.tsx or any component, add:
import ClaudeAPITester from './components/ClaudeAPITester';

// Then render it:
<ClaudeAPITester />
```

2. **Run the tests**:
   - Click "Test Connection" to verify basic Claude API access
   - Click "Test CV Parsing" to test the full workflow
   - Check detailed results and debug information

### Option 2: Browser Console Testing

1. **Open browser console** in your running app
2. **Run manual tests**:
```javascript
// Test basic connection
testClaudeAPIConnection().then(console.log);

// Test CV parsing
testClaudeCVParsing().then(console.log);
```

### Option 3: Integration Testing

1. **Navigate to Job Finder** in your app
2. **Go to Profile Manager**
3. **Upload a CV file** (PDF, DOC, or TXT)
4. **Watch console logs** for detailed debugging information
5. **Check error messages** for specific failure points

## 🔧 Troubleshooting Common Issues

### Issue 1: "No response from Claude AI"
**Cause**: Edge Function not deployed or ANTHROPIC_API_KEY missing
**Solution**:
1. Deploy the Edge Function: `supabase functions deploy ai-chat`
2. Set the API key: `supabase secrets set ANTHROPIC_API_KEY=your-key`

### Issue 2: "Edge Function error"
**Cause**: Authentication or CORS issues
**Solution**:
1. Check if user is authenticated in the app
2. Verify Supabase client configuration
3. Check Edge Function logs: `supabase functions logs ai-chat`

### Issue 3: "Request timed out"
**Cause**: Claude API slow response or network issues
**Solution**:
1. Check internet connection
2. Verify Claude API status
3. Increase timeout if needed

### Issue 4: "JSON parsing failed"
**Cause**: Claude returned non-JSON response
**Solution**:
1. Check if Claude API prompt is clear
2. The parser now has fallback extraction for non-JSON responses
3. Check console logs for actual Claude response

## 📋 Deployment Checklist

### 1. Deploy Edge Function
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy ai-chat
```

### 2. Set Environment Variables
```bash
# Set in Supabase Edge Function
supabase secrets set ANTHROPIC_API_KEY=your-anthropic-key
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
```

### 3. Verify Local Environment
```bash
# Check .env.local has correct values
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🔍 Debug Information Locations

### Browser Console Logs
Look for these log patterns:
- 🤖 `RealClaudeCVParser:` - Client-side CV parsing
- 🤖 `CV Parsing request received` - Edge Function received request
- 📡 `Sending request to Claude API` - API call initiated
- ✅ `Claude AI CV parsing completed` - Success
- ❌ `Claude API error` - API issues

### Supabase Edge Function Logs
```bash
# View real-time logs
supabase functions logs ai-chat --follow

# View recent logs
supabase functions logs ai-chat
```

### Key Log Messages to Look For
- `✅ API key found` - Confirms ANTHROPIC_API_KEY is set
- `📡 Sending request to Claude API` - Request initiated
- `📥 Received response from Claude API` - Response received
- `❌ Claude API error for CV parsing` - API issues
- `🎉 Claude AI CV parsing completed` - Success

## 🎯 Expected Success Flow

1. **File Upload**: User uploads CV file
2. **Text Extraction**: File content extracted (real or sample)
3. **API Call**: Request sent to ai-chat Edge Function
4. **Claude Processing**: Claude API analyzes CV text
5. **Response Parsing**: JSON extracted and validated
6. **UI Update**: Form populated with extracted data
7. **Success Message**: Confidence score displayed

## 🚨 Current Status

- ✅ **Code Implementation**: Complete with debugging
- ✅ **Error Handling**: Comprehensive fallbacks
- ✅ **Logging**: Detailed debug information
- ✅ **TypeScript**: All types properly defined
- ⏳ **Edge Function Deployment**: Needs to be deployed to Supabase
- ⏳ **API Key Configuration**: Needs to be set in Supabase secrets
- ⏳ **End-to-End Testing**: Ready for testing once deployed

## 📞 Next Steps

1. **Deploy the Edge Function** using the deployment script
2. **Configure API keys** in Supabase dashboard
3. **Run the debug tests** to verify integration
4. **Test with real CV files** in the Job Profile Manager
5. **Monitor logs** for any remaining issues

The integration is now ready for testing with comprehensive debugging capabilities!
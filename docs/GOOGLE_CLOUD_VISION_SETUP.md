# Google Cloud Vision API Integration Guide for Borderly

This guide will walk you through the process of setting up and integrating Google Cloud Vision API for passport OCR in the Borderly application.

## Prerequisites

- Google Cloud Platform account
- Borderly application codebase
- Node.js and npm installed
- Basic understanding of React and TypeScript

## Step 1: Set Up Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make note of your Project ID

## Step 2: Enable the Vision API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Cloud Vision API"
3. Click on "Cloud Vision API" in the results
4. Click "Enable" to activate the API for your project

## Step 3: Create API Credentials

1. In the Google Cloud Console, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" and select "API Key"
3. Your new API key will be displayed. Copy this key as you'll need it later
4. (Optional but recommended) Restrict the API key to only the Vision API for security

## Step 4: Configure Environment Variables

Add the following environment variables to your Borderly application:

1. Create or update the `.env` file in the root of your project:

```
REACT_APP_GOOGLE_CLOUD_VISION_ENABLED=true
REACT_APP_GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with the API key you created in Step 3.

## Step 5: Set Up Supabase Tables

Create the necessary tables in your Supabase database to store OCR results:

1. Create an `ocr_logs` table:

```sql
CREATE TABLE ocr_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  ocr_text TEXT,
  ocr_source VARCHAR(50),
  document_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

2. Ensure your `user_documents` table has the necessary fields:

```sql
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  document_type VARCHAR(50),
  document_data JSONB,
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, document_type)
);
```

## Step 6: Test the Integration

1. Start your Borderly application
2. Navigate to the passport scan feature
3. Upload a passport image
4. Check the console logs to verify that Google Cloud Vision API is being used
5. Verify that the extracted data is accurate

## Troubleshooting

If you encounter issues with the Google Cloud Vision API integration:

1. **API Key Issues**: Ensure your API key is correctly set in the environment variables
2. **Billing Issues**: Make sure billing is enabled for your Google Cloud project
3. **CORS Issues**: If you encounter CORS errors, you may need to set up a proxy server
4. **Quota Limits**: Be aware of the API usage quotas and limits

## Security Considerations

- Never expose your API key in client-side code without proper restrictions
- Consider implementing a backend proxy to handle API requests securely
- Implement proper error handling to prevent sensitive information leakage
- Ensure compliance with data protection regulations when storing passport data

## Additional Resources

- [Google Cloud Vision API Documentation](https://cloud.google.com/vision/docs)
- [Google Cloud Vision API Pricing](https://cloud.google.com/vision/pricing)
- [Supabase Documentation](https://supabase.io/docs)

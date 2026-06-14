# Setting Up Apple OAuth with Supabase

This guide provides step-by-step instructions for setting up Apple Sign-In for your Borderly application using Supabase Authentication.

## Prerequisites

1. An Apple Developer account (requires annual subscription - $99/year)
2. A Supabase project
3. Access to your domain's DNS settings (for configuring verification)

## Step 1: Create an App ID in the Apple Developer Portal

1. Sign in to the [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to "Certificates, IDs & Profiles"
3. Select "Identifiers" from the sidebar
4. Click the "+" button to add a new identifier
5. Select "App IDs" and click "Continue"
6. Fill in the following information:
   - Description: "Borderly"
   - Bundle ID: Use a reverse-domain style identifier (e.g., `com.yourdomain.borderly`)
7. Under "Capabilities", enable "Sign In with Apple"
8. Click "Continue" and then "Register"

## Step 2: Create a Services ID

1. Return to "Identifiers" in the sidebar
2. Click the "+" button to add a new identifier
3. Select "Services IDs" and click "Continue"
4. Fill in the following information:
   - Description: "Borderly Web Auth"
   - Identifier: Create a unique identifier (e.g., `com.yourdomain.borderly.auth`)
5. Click "Continue" and then "Register"
6. Click on the newly created Services ID
7. Enable "Sign In with Apple" and click "Configure"
8. Add your domain and subdomains
9. Set the return URL to: `https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback`
10. Click "Next", then "Done", and "Continue", then "Save"

## Step 3: Set Up Web Domain Verification

1. Navigate to "More" and select "Configure" under "Domain and Websites"
2. Click the "+" button to add a new domain
3. Enter your website's domain
4. Download the verification file
5. Upload the verification file to your web server at the specified location
6. Click "Verify" to confirm domain ownership

## Step 4: Create a Private Key

1. Navigate to "Keys" in the sidebar
2. Click the "+" button to add a new key
3. Enter a name for your key (e.g., "Borderly Apple Auth Key")
4. Enable "Sign In with Apple" and click "Configure"
5. Select your App ID and click "Save"
6. Click "Continue" and then "Register"
7. Download the key file (.p8) - **Keep this file secure as you can only download it once**
8. Note the Key ID shown on the screen

## Step 5: Configure Supabase Authentication

1. Sign in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project and navigate to "Authentication" → "Providers"
3. Find "Apple" in the list of providers and click on it
4. Toggle the switch to enable Apple sign-in
5. Fill in the following information:
   - Service ID: The Services ID you created earlier (e.g., `com.yourdomain.borderly.auth`)
   - Team ID: Your Apple Developer Team ID (found in the Developer Portal under "Membership")
   - Key ID: The ID of the key you created
   - Private Key: Copy and paste the contents of the .p8 file you downloaded
6. Set the Redirect URL to match your application's callback URL
7. Click "Save"

## Step 6: Update Your Application

1. Ensure your application has the Apple sign-in button in the appropriate places
2. Verify that the `signInWithApple` function in `auth.ts` is properly implemented
3. Test the sign-in flow in development and production environments

## Troubleshooting

### Common Issues

- **"Invalid client" error**: Verify that your Service ID and domain settings are correct
- **"Invalid redirect URI" error**: Make sure the redirect URL in Supabase exactly matches the one in the Apple Developer Portal
- **"Invalid key" error**: Check that you've correctly copied the private key and key ID
- **Sign-in button not appearing**: Ensure you've enabled Apple authentication in your environment variables

### Testing in Development

When testing in a development environment, you may encounter issues because Apple requires HTTPS. You can:

1. Use a service like ngrok to create a temporary HTTPS tunnel to your local development server
2. Add the ngrok URL to your Apple Services ID configuration
3. Update your Supabase project's redirect URL settings temporarily

## Additional Resources

- [Apple Sign-In Documentation](https://developer.apple.com/sign-in-with-apple/get-started/)
- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)

## Support

If you encounter any issues with Apple Sign-In integration, please check the following:

1. Review the Apple Developer documentation for any updates or changes
2. Check the Supabase documentation for authentication providers
3. Verify all IDs, keys, and URLs are correctly configured 
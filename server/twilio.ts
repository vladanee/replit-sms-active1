// Twilio integration using Replit connection
import twilio from 'twilio';

interface TwilioCredentials {
  accountSid: string;
  authToken?: string;
  apiKey?: string;
  apiKeySecret?: string;
  phoneNumber?: string;
}

async function getCredentials(): Promise<TwilioCredentials> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings?.settings?.account_sid) {
    throw new Error('Twilio not connected');
  }

  const settings = connectionSettings.settings;
  
  // Debug: Log available credential types (masked for security)
  console.log('Twilio credentials available:', {
    hasAccountSid: !!settings.account_sid,
    hasAuthToken: !!settings.auth_token,
    hasApiKey: !!settings.api_key,
    apiKeyPrefix: settings.api_key ? settings.api_key.slice(0, 4) : null,
    hasApiKeySecret: !!settings.api_key_secret,
    hasPhoneNumber: !!settings.phone_number
  });
  
  return {
    accountSid: settings.account_sid,
    authToken: settings.auth_token,
    apiKey: settings.api_key,
    apiKeySecret: settings.api_key_secret,
    phoneNumber: settings.phone_number
  };
}

export async function getTwilioClient() {
  const creds = await getCredentials();
  
  // Use API key authentication (as provided by Replit connector)
  if (creds.apiKey && creds.apiKeySecret) {
    // Twilio API keys should start with "SK" - warn if they don't
    if (!creds.apiKey.startsWith('SK')) {
      console.warn(`Warning: API key does not start with 'SK' (got '${creds.apiKey.slice(0, 4)}...'). This may cause authentication errors. Please check your Twilio connection configuration.`);
    }
    return twilio(creds.apiKey, creds.apiKeySecret, {
      accountSid: creds.accountSid
    });
  }
  
  // Fallback to Account SID + Auth Token authentication
  if (creds.authToken) {
    return twilio(creds.accountSid, creds.authToken);
  }
  
  throw new Error('No valid Twilio credentials found. Your Twilio API key may be misconfigured. Please reconnect your Twilio account with a valid API key (starts with SK) and secret.');
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function isTwilioConfigured(): Promise<boolean> {
  try {
    await getCredentials();
    return true;
  } catch {
    return false;
  }
}

export async function getTwilioStatus() {
  try {
    const creds = await getCredentials();
    const hasApiKey = !!(creds.apiKey && creds.apiKeySecret);
    const hasAuthToken = !!creds.authToken;
    const hasValidApiKey = creds.apiKey?.startsWith('SK');
    
    // Consider configured if we have any credentials (even if they might be invalid)
    const hasCredentials = hasApiKey || hasAuthToken;
    
    return {
      configured: hasCredentials,
      accountSid: creds.accountSid ? `${creds.accountSid.slice(0, 6)}...` : undefined,
      phoneNumber: creds.phoneNumber,
      warning: hasApiKey && !hasValidApiKey 
        ? 'API key format may be incorrect. Valid Twilio API keys start with "SK".'
        : undefined,
    };
  } catch {
    return {
      configured: false,
    };
  }
}

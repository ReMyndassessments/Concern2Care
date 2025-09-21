import { Client } from '@microsoft/microsoft-graph-client';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=outlook',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Outlook not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableOutlookClient() {
  const accessToken = await getAccessToken();

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

export interface OutlookEmailOptions {
  toEmail: string;
  toName: string;
  subject: string;
  content: string;
}

export async function sendOutlookEmail(options: OutlookEmailOptions): Promise<boolean> {
  try {
    console.log('📧 Sending email via Outlook...', {
      to: options.toEmail,
      subject: options.subject
    });

    const client = await getUncachableOutlookClient();

    const message = {
      subject: options.subject,
      body: {
        contentType: 'text',
        content: options.content
      },
      toRecipients: [{
        emailAddress: {
          address: options.toEmail,
          name: options.toName
        }
      }]
    };

    await client.api('/me/sendMail').post({
      message: message
    });

    console.log('✅ Email sent successfully via Outlook');
    return true;
  } catch (error) {
    console.error('❌ Failed to send email via Outlook:', error);
    throw error;
  }
}
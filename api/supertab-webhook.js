export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const bearerToken = req.headers.authorization?.split(' ')[1];
  const validBearer = bearerToken === process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const receivedSecret = req.headers['x-supertab-secret'];
  const receivedBypassSecret = req.headers['x-vercel-protection-bypass'];
  
  const validSecret = receivedSecret === process.env.SUPERTAB_WEBHOOK_SECRET;
  const validBypass = receivedBypassSecret === process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

if (!validBypass && !validSecret) {
  return res.status(403).send('Unauthorized');
}

  // Parse Supertab payload
  const { data } = req.body;
  const { user, offering_id, entitlement_status } = data || {};
  const email = user?.email;
  const unixMillis = entitlement_status?.expires ? new Date(entitlement_status.expires).getTime() : null;

  if (!email || !offering_id) {
    return res.status(400).json({ error: 'Missing email or offering_id' });
  }

  try {
    // 2. Create Unkey API key
    const requestBody = JSON.stringify({
      name: `${email}-${offering_id}`,
      apiId: `${process.env.UNKEY_API_ID}`,
      expires: unixMillis,
      meta: { email, offering_id },
    });
    console.log("Request body:", requestBody);

    const unkeyRes = await fetch('https://api.unkey.dev/v1/keys', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UNKEY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    const unkeyData = await unkeyRes.json();
    const key = unkeyData?.key;

    if (!key) {
      console.error('Unkey error:', unkeyData);
      return res.status(500).json({ error: 'Failed to create API key' });
    }

    // 3. Send email with key (using delivered@resend.dev to test
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Acme <onboarding@resend.dev>',
        to: ['delivered@resend.dev'],
        subject: 'Your Sportsort API Key',
        html: `<p>Hi there! Thanks for your purchase.</p><p>Here is your API key:</p><pre>${key}</pre><p>If you have any questions, just reply to this email.</p>`,
      }),
    });

    if (!emailRes.ok) {
      const emailErr = await emailRes.json();
      console.error('Email send error:', emailErr);
      return res.status(500).json({ error: 'Failed to send API key via email' });
    }

    return res.status(200).json({ success: true, key });
  } catch (error) {
    console.error('Unhandled error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

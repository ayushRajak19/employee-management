# Gmail automation setup

One Google mailbox per organization. Each organization's Super Admin authorizes their own account. Connecting Gmail selects Gmail and pauses active workflows. Disconnecting removes the encrypted refresh credential and pauses workflows without falling back to Brevo.

## Platform owner: one-time setup

1. Open [Google Cloud Console](https://console.cloud.google.com/), select or create your company's project, and enable the **Gmail API**.
2. Open **Google Auth Platform**. Configure Branding with the app name, support email, verified website domain, privacy policy, terms and developer contact details. Explain how Google data is used, stored and deleted in the privacy policy.
3. Set Audience to **External** for vendors outside your Google Workspace domain. In Testing, add the Google accounts that will test the integration. Testing refresh tokens for this scope expire after seven days; Testing is not suitable for unattended production automation.
4. In Data Access, request only `https://www.googleapis.com/auth/gmail.send` and `https://www.googleapis.com/auth/userinfo.email`. No inbox access is requested. Gmail send is a sensitive scope; complete Google's verification process for public production use unless Google confirms an exception applies.
5. Create an OAuth client of type **Web application**. Add these exact authorized redirect URIs if using both deployments:
   - `https://employee.whalexy.com/api/v1/email-automation/google/callback`
   - `https://ems.mobiusbloom.com/api/v1/email-automation/google/callback`
6. Set server-side environment variables in the hosting dashboard, never frontend code or Git:
   - `GOOGLE_CLIENT_ID`: the Web application client ID.
   - `GOOGLE_CLIENT_SECRET`: its client secret.
   - `GOOGLE_REDIRECT_URI`: the callback for **that deployment**, with the same origin as `CLIENT_URL`.
   - `GMAIL_DAILY_LIMIT=100`: organization daily attempt limit including tests; Google may impose additional limits.
7. Restart/redeploy. Do not casually change the existing `INTEGRATION_ENCRYPTION_SECRET` or its JWT fallback: stored provider credentials depend on it.
8. In each organization's Email automation → Settings, click **Connect with Google**. Stay signed into that workspace while returning from Google. Approve sending permission. No Google password is entered into MobiusEMS.
9. Review the verified mailbox, then manually send one test to an address you control. Confirm it in Gmail Sent and the recipient inbox. Connection does not send a test automatically.
10. Review and explicitly activate paused workflows. Excel import, manual contacts, personalization, delays, manual reply suppression and unsubscribe links work with Gmail.

## Safety and limitations

- `SENT` means Gmail accepted the message, **not** guaranteed delivery. Send-only access provides no inbox reading, open tracking, bounce ingestion or automatic reply detection. Mark a contact Replied manually to stop follow-ups.
- Send only consented communications permitted by Google's policies; do not use Gmail to evade another provider's anti-abuse restrictions.
- Refresh credentials are encrypted server-side and excluded from ordinary database projections and API responses. OAuth uses ten-minute, one-use, tenant-and-admin-bound state plus PKCE.
- Expired/revoked grants require reconnection. Disconnection removes the credential locally. Users can also remove the app under Google Account → Security → Third-party connections. Global revocation can affect other organizations using the same Google account/client, so local disconnect does not revoke the whole grant.
- Gmail jobs are not automatically retried after failures or abandoned in-flight jobs: results can be ambiguous. Check Sent mail before retrying to avoid duplicates. Reconnecting does not reset the daily attempt budget.
- Already in-flight messages cannot be recalled. Do not enable production campaigns before OAuth setup and an explicit end-to-end delivery test succeed.

## References and verification

- [Google server-side OAuth](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Gmail sending](https://developers.google.com/workspace/gmail/api/guides/sending)
- [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Sensitive-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)

Automated tests mock Google endpoints; they do not prove a real Google Cloud client is approved or a mailbox can deliver. Real consent and sending must be verified after configuring credentials.

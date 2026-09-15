import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { emailAutomationApi, type AutomationConfiguration } from "./emailAutomationApi";

export const GmailSettings = ({ configuration, onChanged }: { configuration?: AutomationConfiguration; onChanged: () => Promise<void> }) => {
  const [error, setError] = useState("");
  const result = new URLSearchParams(window.location.search).get("google");
  const connected = configuration?.provider === "GMAIL";
  const connect = useMutation({ mutationFn: emailAutomationApi.connectGoogle, onSuccess: ({ url }) => { window.location.assign(url); }, onError: (e: Error) => setError(e.message) });
  const disconnect = useMutation({ mutationFn: emailAutomationApi.disconnectGoogle, onSuccess: onChanged, onError: (e: Error) => setError(e.message) });
  const check = useMutation({ mutationFn: emailAutomationApi.checkConnection, onSuccess: onChanged, onError: (e: Error) => setError(e.message) });
  return <section className="rounded-2xl border bg-white p-6 shadow-soft lg:col-span-2">
    <h2 className="font-semibold">Connect Gmail / Google Workspace</h2>
    <p className="mt-2 text-sm text-slate-600">Send from your organization's own Google mailbox. Google handles sign-in; we never ask for your password. This connection is private to this organization.</p>
    {result && <p role="status" className="mt-3 text-sm">{result === "connected" ? "Gmail connected. Review and activate your paused workflows when ready." : "Google connection was not completed. Start again, approve email sending, and stay signed into this workspace."}</p>}
    {!configuration?.googleAvailable && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Google setup required: the platform administrator must configure the Google OAuth client ID, client secret and callback URL. Vendors do not need to create API keys.</p>}
    {connected && <p className="mt-3 text-sm font-medium">Connected mailbox: {configuration.senderEmail}</p>}
    <p className="mt-3 text-xs leading-5 text-slate-500">Send-only access. No inbox reading, automatic reply detection, open tracking or delivery confirmation. Mark replies manually in Contacts to stop follow-ups. Only send to consented recipients. Connecting or disconnecting pauses active workflows; messages already in flight cannot be recalled.</p>
    {connected && <p className="mt-2 text-xs text-slate-500">Application limit: {configuration.dailyLimit} messages per day for this organization. Google may impose additional limits. Disconnection removes stored access locally; you can also revoke the app in your Google Account.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-2">
      <Button disabled={!configuration?.googleAvailable || connect.isPending || disconnect.isPending} onClick={() => { setError(""); if (window.confirm("Connect this organization's Google mailbox? Active workflows will be paused for review.")) connect.mutate(); }}>{connect.isPending ? "Opening Google…" : connected ? "Reconnect / change Gmail" : "Connect with Google"}</Button>
      {connected && <><Button variant="secondary" disabled={check.isPending} onClick={() => { setError(""); check.mutate(); }}>Check Gmail access</Button><Button variant="secondary" disabled={disconnect.isPending} onClick={() => { if (window.confirm("Disconnect Gmail and pause this organization's active workflows?")) disconnect.mutate(); }}>Disconnect Gmail</Button></>}
    </div>
  </section>;
};

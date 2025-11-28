import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send, CheckCircle, XCircle, Clock, Copy, Check, Phone, MessageSquare, Wifi, WifiOff, Eye, EyeOff, Key, Hash } from "lucide-react";
import type { SmsMessage, SmsResponse, ConfigStatus, SendSmsRequest } from "@shared/schema";
import { sendSmsSchema } from "@shared/schema";

function StatusIndicator() {
  const { data: status, isLoading } = useQuery<ConfigStatus>({
    queryKey: ["/api/config/status"],
  });

  if (isLoading) {
    return (
      <Badge variant="secondary" className="gap-1.5" data-testid="badge-status-loading">
        <Clock className="h-3 w-3" />
        Checking...
      </Badge>
    );
  }

  if (status?.configured) {
    return (
      <Badge variant="default" className="gap-1.5 bg-emerald-600 hover:bg-emerald-600" data-testid="badge-status-connected">
        <Wifi className="h-3 w-3" />
        Connected
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15" data-testid="badge-status-not-configured">
      <WifiOff className="h-3 w-3" />
      Configuration Required
    </Badge>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleCopy}
      className="h-8 w-8"
      data-testid={`button-copy-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function MaskedValue({ value, label }: { value: string | undefined; label: string }) {
  const [revealed, setRevealed] = useState(false);

  if (!value) {
    return (
      <span className="text-muted-foreground italic text-sm">Not configured</span>
    );
  }

  const maskedValue = revealed ? value : value.replace(/./g, "*").slice(0, 12) + "...";

  return (
    <div className="flex items-center gap-2">
      <code className="font-mono text-sm bg-muted/50 px-2 py-1 rounded flex-1 truncate">
        {maskedValue}
      </code>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setRevealed(!revealed)}
        className="h-8 w-8 shrink-0"
        data-testid={`button-reveal-${label.toLowerCase().replace(/\s/g, "-")}`}
      >
        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      <CopyButton text={value} label={label} />
    </div>
  );
}

function CredentialsPanel() {
  const { data: status, isLoading } = useQuery<ConfigStatus>({
    queryKey: ["/api/config/status"],
  });

  return (
    <Card data-testid="card-credentials">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          Credentials
        </CardTitle>
        <CardDescription>Your Twilio configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 w-20 bg-muted rounded mb-2" />
                <div className="h-8 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                Account SID
              </label>
              <MaskedValue value={status?.accountSid} label="Account SID" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                API Key
              </label>
              <MaskedValue value={status?.configured ? "SK••••••••" : undefined} label="API Key" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone Number
              </label>
              <MaskedValue value={status?.phoneNumber} label="Phone Number" />
            </div>

            {!status?.configured && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Set the following environment variables to enable SMS:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 font-mono">
                  <li>TWILIO_ACCOUNT_SID</li>
                  <li>TWILIO_API_KEY</li>
                  <li>TWILIO_API_SECRET</li>
                  <li>TWILIO_PHONE</li>
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ApiTestingCard() {
  const { toast } = useToast();

  const form = useForm<SendSmsRequest>({
    resolver: zodResolver(sendSmsSchema),
    defaultValues: {
      to: "",
      body: "",
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: SendSmsRequest) => {
      const response = await apiRequest("POST", "/api/send-sms", data);
      return await response.json() as SmsResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "SMS Sent Successfully",
          description: `Message SID: ${data.sid}`,
        });
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      } else {
        toast({
          title: "Failed to Send SMS",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send SMS",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SendSmsRequest) => {
    sendMutation.mutate(data);
  };

  const charCount = form.watch("body")?.length || 0;
  const charLimit = 160;

  return (
    <Card data-testid="card-api-testing">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send Test SMS
          </CardTitle>
          <CardDescription className="mt-1">
            Test the API by sending an SMS message
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone Number <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      className="font-mono"
                      data-testid="input-phone-number"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include country code (e.g., +1 for US)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Message Body <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your SMS message..."
                      className="min-h-[100px] resize-none"
                      data-testid="input-message-body"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs">
                    <FormDescription className="mt-0">
                      Standard SMS is {charLimit} characters
                    </FormDescription>
                    <span className={charCount > charLimit ? "text-amber-500" : "text-muted-foreground"}>
                      {charCount}/{charLimit}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={sendMutation.isPending}
              data-testid="button-send-sms"
            >
              {sendMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send SMS
                </>
              )}
            </Button>
          </form>
        </Form>

        {sendMutation.data && (
          <div
            className={`mt-4 p-4 rounded-md border ${
              sendMutation.data.success
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-destructive/10 border-destructive/20"
            }`}
            data-testid="div-response"
          >
            <div className="flex items-center gap-2 mb-2">
              {sendMutation.data.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="font-medium">
                {sendMutation.data.success ? "Success" : "Failed"}
              </span>
            </div>
            {sendMutation.data.sid && (
              <p className="text-sm font-mono text-muted-foreground break-all">
                SID: {sendMutation.data.sid}
              </p>
            )}
            {sendMutation.data.error && (
              <p className="text-sm text-destructive">{sendMutation.data.error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentationCard() {
  const curlExample = `curl -X POST https://your-repl.replit.app/api/send-sms \\
  -H "Content-Type: application/json" \\
  -d '{"to": "+1234567890", "body": "Hello!"}'`;

  return (
    <Card data-testid="card-documentation">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Quick Reference</CardTitle>
        <CardDescription>API endpoint documentation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Endpoint</h4>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="font-mono">POST</Badge>
            <code className="text-sm font-mono text-muted-foreground">/api/send-sms</code>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Request Body</h4>
          <div className="bg-muted/50 rounded-md p-3 font-mono text-sm overflow-x-auto">
            <pre className="text-muted-foreground">{`{
  "to": "+1234567890",
  "body": "Your message"
}`}</pre>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Response</h4>
          <div className="bg-muted/50 rounded-md p-3 font-mono text-sm overflow-x-auto">
            <pre className="text-muted-foreground">{`{
  "success": true,
  "sid": "SM..."
}`}</pre>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-medium">cURL Example</h4>
            <CopyButton text={curlExample} label="cURL" />
          </div>
          <div className="bg-muted/50 rounded-md p-3 font-mono text-xs overflow-x-auto">
            <pre className="text-muted-foreground whitespace-pre-wrap break-all">{curlExample}</pre>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Error Codes</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">400</Badge>
              <span className="text-muted-foreground">Missing or invalid fields</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">401</Badge>
              <span className="text-muted-foreground">Invalid Twilio credentials</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">500</Badge>
              <span className="text-muted-foreground">Server or Twilio API error</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityCard() {
  const { data: messages = [], isLoading } = useQuery<SmsMessage[]>({
    queryKey: ["/api/messages"],
  });

  const maskPhoneNumber = (phone: string) => {
    if (phone.length <= 4) return phone;
    return phone.slice(0, -4).replace(/./g, "*") + phone.slice(-4);
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card data-testid="card-recent-activity">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <CardDescription>Last 10 sent messages</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-2 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-empty-state">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Send your first SMS to see activity here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.slice(0, 10).map((msg) => (
              <div
                key={msg.id}
                className="flex items-center gap-3 p-2 rounded-md hover-elevate"
                data-testid={`row-message-${msg.id}`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    msg.status === "sent"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : msg.status === "failed"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {msg.status === "sent" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : msg.status === "failed" ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm">{maskPhoneNumber(msg.to)}</span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        msg.status === "sent"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : msg.status === "failed"
                          ? "bg-destructive/15 text-destructive"
                          : ""
                      }`}
                    >
                      {msg.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate" title={msg.body}>
                    {msg.body.slice(0, 40)}{msg.body.length > 40 ? "..." : ""}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
              <Send className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Twilio SMS Proxy</h1>
              <p className="text-xs text-muted-foreground">API Gateway</p>
            </div>
          </div>
          <StatusIndicator />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <ApiTestingCard />
            <RecentActivityCard />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <CredentialsPanel />
            <DocumentationCard />
          </div>
        </div>
      </main>

      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Twilio SMS Proxy API</p>
        </div>
      </footer>
    </div>
  );
}

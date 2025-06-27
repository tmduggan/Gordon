import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, RefreshCw, Shield, Bug } from 'lucide-react';

export default function AdminControlsModal({ user, userProfile, onToggleSubscription, onEnsureSubscription }) {
  const status = userProfile?.subscription?.status || 'basic';
  const plan = userProfile?.subscription?.plan || 'undefined';
  const hasSubscriptionField = !!userProfile?.subscription;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-purple-600" />
          User Type Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Current Status:</span>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={onToggleSubscription}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Toggle Subscription Status
            </Button>
            <Button variant="outline" className="w-full" onClick={onEnsureSubscription}>
              <Shield className="h-4 w-4 mr-2" />
              Ensure Subscription Field
            </Button>
          </div>
          <div className="mt-6 border-t pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 font-semibold"><Bug className="h-4 w-4 text-orange-600" /> Debug Information</div>
            <div className="flex justify-between"><span>User ID:</span><span className="font-mono text-xs">{user?.uid}</span></div>
            <div className="flex justify-between"><span>Email:</span><span className="font-mono text-xs">{user?.email}</span></div>
            <div className="flex justify-between"><span>Subscription Status:</span><span className="font-mono text-xs">{status}</span></div>
            <div className="flex justify-between"><span>Subscription Plan:</span><span className="font-mono text-xs">{plan}</span></div>
            <div className="flex justify-between"><span>Has Subscription Field:</span><span className="font-mono text-xs">{hasSubscriptionField ? 'true' : 'false'}</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
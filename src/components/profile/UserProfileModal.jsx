import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, User, Mail, Clock, Hash } from 'lucide-react';

export default function UserProfileModal({ user, userProfile }) {
  const status = userProfile?.subscription?.status || 'basic';
  let label, color, Icon;
  switch (status) {
    case 'admin':
      label = 'Admin';
      color = 'bg-purple-100 text-purple-800 border-purple-200';
      Icon = Crown;
      break;
    case 'premium':
      label = 'Premium';
      color = 'bg-status-success text-status-success border-status-success';
      Icon = Crown;
      break;
    case 'basic':
    default:
      label = 'Basic';
      color = 'bg-gray-100 text-gray-800 border-gray-200';
      Icon = User;
      break;
  }

  const isAdmin = status === 'admin';

  return (
    <div className="space-y-4">
      {/* Subscription Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <span>{label} Subscription</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className={color}>
            {userProfile?.subscription?.plan || 'basic'} plan
          </Badge>
        </CardContent>
      </Card>

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <div className="text-sm">{userProfile?.name || user?.displayName || 'Not set'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <div className="text-sm font-mono">{user?.email || 'Not available'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <label className="text-sm font-medium text-gray-600">Time Zone</label>
                <div className="text-sm">{userProfile?.timeZone || 'Not set'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-gray-500" />
              <div>
                <label className="text-sm font-medium text-gray-600">User ID</label>
                <div className="text-xs font-mono text-gray-500">{user?.uid || 'Not available'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Details Card (only for admin users) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              <span>Admin Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Subscription Status:</span>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">Admin</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Plan:</span>
                <span className="text-sm">{userProfile?.subscription?.plan || 'admin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Features:</span>
                <span className="text-sm">{userProfile?.subscription?.features?.join(', ') || 'all_features'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Expires:</span>
                <span className="text-sm">{userProfile?.subscription?.expiresAt || 'Never'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
import React from 'react';
import { Crown, User } from 'lucide-react';

export default function SubscriptionStatus({ status }) {
  let label, color, Icon;
  switch (status) {
    case 'admin':
      label = 'Admin';
      color = 'bg-purple-100 text-purple-800 border-purple-200';
      Icon = Crown;
      break;
    case 'premium':
      label = 'Premium';
      color = 'bg-green-100 text-green-800 border-green-200';
      Icon = Crown;
      break;
    case 'basic':
    default:
      label = 'Basic';
      color = 'bg-gray-100 text-gray-800 border-gray-200';
      Icon = User;
      break;
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </span>
  );
} 
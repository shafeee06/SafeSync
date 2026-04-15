import React from 'react';
import { useListNotifications, useMarkNotificationRead } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, AlertTriangle, ShieldCheck, Award, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useListNotifications({});
  const markRead = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      }
    }
  });

  const getIcon = (type: string) => {
    switch(type) {
      case 'complaint_verified': return <ShieldCheck className="w-5 h-5 text-primary" />;
      case 'points_awarded': return <Award className="w-5 h-5 text-yellow-500" />;
      case 'black_mark': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'complaint_resolved': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return <MessageSquare className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Notifications</h1>
          <p className="text-muted-foreground mt-1">Updates on your reports and points.</p>
        </div>
      </div>

      <Card className="bg-card border-white/5 shadow-xl min-h-[400px]">
        {isLoading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : data?.notifications.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center text-muted-foreground">
            <Bell className="w-16 h-16 opacity-20 mb-4" />
            <p className="text-lg">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data?.notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-6 flex items-start gap-4 transition-colors ${notif.isRead ? 'opacity-60 hover:opacity-100' : 'bg-primary/5'}`}
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-1">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-base ${notif.isRead ? 'text-white/80 font-medium' : 'text-white font-bold'}`}>{notif.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{notif.message}</p>
                  
                  {!notif.isRead && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => markRead.mutateAsync({ id: notif.id })}
                      className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10 px-3 -ml-3"
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
                {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Activity {
  message: string;
  userName: string;
  country: string;
  formulationName: string;
  timeAgo: string;
}

export default function ActivityNotification() {
  const { toast } = useToast();
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [location] = useLocation();
  
  // Don't show notifications on admin pages
  const isAdminPage = location.startsWith('/admin');
  
  // 5 minutes in milliseconds
  const NOTIFICATION_THROTTLE = 5 * 60 * 1000;

  // Fetch activity every 8 seconds (but only if not on admin page)
  const { data: activity } = useQuery<Activity | null>({
    queryKey: ["/api/activity"],
    refetchInterval: 8000, // Fetch every 8 seconds
    refetchIntervalInBackground: true,
    enabled: !isAdminPage, // Disable fetching on admin pages
  });

  useEffect(() => {
    // Don't show notifications on admin pages
    if (isAdminPage) {
      return;
    }
    
    const now = Date.now();
    
    if (activity && activity.message !== lastActivity) {
      // Only show notification if 5 minutes have passed since last notification
      if (now - lastNotificationTime >= NOTIFICATION_THROTTLE) {
        // Show toast notification at bottom-left with formatted layout
        toast({
          title: "🎉 New Formula Created!",
          description: (
            <div className="space-y-1">
              <div className="font-semibold text-base">{activity.userName}</div>
              <div className="text-sm opacity-90">{activity.country}</div>
              <div className="text-sm font-medium">{activity.formulationName}</div>
              <div className="text-xs opacity-75">{activity.timeAgo}</div>
            </div>
          ),
          duration: 8000, // Show for 8 seconds
          className: "bottom-left-toast",
        });
        
        setLastNotificationTime(now);
      }
      
      setLastActivity(activity.message);
    }
  }, [activity, lastActivity, toast, isAdminPage, lastNotificationTime]);

  // This component doesn't render anything visible
  return null;
}

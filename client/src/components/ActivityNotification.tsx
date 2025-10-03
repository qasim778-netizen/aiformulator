import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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

  // Fetch activity every 8 seconds
  const { data: activity } = useQuery<Activity | null>({
    queryKey: ["/api/activity"],
    refetchInterval: 8000, // Fetch every 8 seconds
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (activity && activity.message !== lastActivity) {
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
      
      setLastActivity(activity.message);
    }
  }, [activity, lastActivity, toast]);

  // This component doesn't render anything visible
  return null;
}

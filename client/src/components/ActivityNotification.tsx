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
      // Show toast notification at bottom-left
      toast({
        title: "🎉 New Formula Created!",
        description: activity.message,
        duration: 5000, // Show for 5 seconds
        className: "bottom-left-toast",
      });
      
      setLastActivity(activity.message);
    }
  }, [activity, lastActivity, toast]);

  // This component doesn't render anything visible
  return null;
}

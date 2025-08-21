import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Eye } from "lucide-react";
import { Concern } from "@shared/schema";
import { Link } from "wouter";

export default function RecentConcerns() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: concerns, isLoading, error } = useQuery<Concern[]>({
    queryKey: ["/api/concerns"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const concernTypeColors = {
    academic: "bg-blue-100 text-blue-800",
    behavior: "bg-amber-100 text-amber-800", 
    "social-emotional": "bg-purple-100 text-purple-800",
    attendance: "bg-red-100 text-red-800",
  };

  const formatTimeAgo = (date: string | Date | null | undefined) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const concernDate = new Date(date);
    const diffInMs = now.getTime() - concernDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return concernDate.toLocaleDateString();
  };

  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-green/10 rounded-lg flex items-center justify-center">
              <History className="h-4 w-4 text-brand-green" />
            </div>
            <span>Recent Concerns</span>
          </div>
          <span className="text-sm text-gray-600">
            {concerns?.length || 0}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-16 bg-gray-300 rounded"></div>
                      <div className="h-5 w-20 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="h-3 w-12 bg-gray-300 rounded"></div>
                  </div>
                  <div className="h-4 w-full bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Unable to load recent concerns</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : !concerns || concerns.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-2">No concerns documented yet</p>
            <p className="text-sm text-gray-500">
              Your recent concerns will appear here after you submit your first concern.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {concerns.slice(0, 5).map((concern) => (
              <div 
                key={concern.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-brand-blue/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {concern.studentFirstName} {concern.studentLastInitial}.
                    </span>
                    <Badge className={concernTypeColors[concern.concernType as keyof typeof concernTypeColors]}>
                      {concern.concernType.charAt(0).toUpperCase() + concern.concernType.slice(1).replace('-', ' ')}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(concern.createdAt)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {truncateDescription(concern.description)}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    View details for strategies
                  </span>
                  <Link href={`/concerns/${concern.id}`}>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="text-xs text-brand-blue hover:text-brand-dark-blue h-8"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            
            {concerns.length > 5 && (
              <Button 
                variant="ghost"
                className="w-full text-sm text-brand-blue hover:text-brand-dark-blue"
              >
                View All Concerns
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

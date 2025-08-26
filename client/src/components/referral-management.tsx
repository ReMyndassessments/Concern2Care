import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Gift, 
  Users, 
  Search, 
  TrendingUp, 
  UserPlus,
  Award,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ReferralStats {
  totalReferrals: number;
  totalBonusesGranted: number;
  topReferrers: TopReferrer[];
}

interface TopReferrer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  referralCount: number;
  myReferralCode: string;
}

interface UserReferral {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  isActive: boolean;
  createdAt: string;
  paymentConfirmedAt: string;
}

export default function ReferralManagement() {
  const { toast } = useToast();
  const [searchUserId, setSearchUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Fetch referral statistics
  const { data: referralStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/referral-stats"],
    retry: false,
  });

  // Fetch user referrals for selected user
  const { data: userReferrals, isLoading: referralsLoading } = useQuery({
    queryKey: ["/api/admin/user", selectedUser, "referrals"],
    enabled: !!selectedUser,
    retry: false,
  });

  const handleSearchUser = () => {
    if (searchUserId.trim()) {
      setSelectedUser(searchUserId.trim());
    }
  };

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `Referral code ${code} copied to clipboard`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = referralStats as ReferralStats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Referral Management</h2>
          <p className="text-gray-600">Track and manage teacher referral program</p>
        </div>
      </div>

      {/* Referral Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Referrals</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalReferrals || 0}</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Successful teacher referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bonus Requests Granted</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalBonusesGranted || 0}</p>
              </div>
              <Gift className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Total AI requests awarded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Referrers</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.topReferrers?.length || 0}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Active referral champions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.topReferrers && stats.topReferrers.length > 0 ? (
            <div className="space-y-4">
              {stats.topReferrers.map((referrer, index) => (
                <div key={referrer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{referrer.firstName} {referrer.lastName}</p>
                      <p className="text-sm text-gray-600">{referrer.email}</p>
                      <p className="text-sm text-gray-500">{referrer.school}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{referrer.referralCount}</p>
                      <p className="text-sm text-gray-600">referrals</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {referrer.myReferralCode}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyReferralCode(referrer.myReferralCode)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No referrals found yet</p>
          )}
        </CardContent>
      </Card>

      {/* User Referral Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search User Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search-user">User ID</Label>
              <Input
                id="search-user"
                placeholder="Enter user ID to view their referrals"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearchUser} disabled={!searchUserId.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {selectedUser && (
            <div>
              <h4 className="font-medium mb-4">Referrals by User: {selectedUser}</h4>
              {referralsLoading ? (
                <div className="animate-pulse">
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : userReferrals && userReferrals.length > 0 ? (
                <div className="space-y-3">
                  {userReferrals.map((referral: UserReferral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{referral.firstName} {referral.lastName}</p>
                        <p className="text-sm text-gray-600">{referral.email}</p>
                        <p className="text-sm text-gray-500">{referral.school}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={referral.isActive ? "default" : "secondary"}>
                          {referral.isActive ? "Active" : "Pending"}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          Registered: {formatDate(referral.createdAt)}
                        </p>
                        {referral.paymentConfirmedAt && (
                          <p className="text-sm text-green-600">
                            Paid: {formatDate(referral.paymentConfirmedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No referrals found for this user</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Download, Heart, FlaskConical, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import GeneratedFormulasTab from "@/components/admin/generated-formulas-tab";

const PAGE_SIZE = 10;

function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function Pagination({
  total,
  page,
  onPage,
}: {
  total: number;
  page: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between pt-4 border-t mt-2">
      <span className="text-sm text-gray-500">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "…")[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPage(p as number)}
                className="h-8 w-8 p-0 text-xs"
              >
                {p}
              </Button>
            )
          )}
        <Button
          variant="outline"
          size="sm"
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewFormulasOpen, setViewFormulasOpen] = useState(false);
  const [userFormulas, setUserFormulas] = useState<any[]>([]);
  const [loadingFormulas, setLoadingFormulas] = useState(false);
  const { toast } = useToast();

  const [usersPage, setUsersPage] = useState(1);
  const [downloadsPage, setDownloadsPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);

  const { data: users, isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user?.isAdmin,
  });

  const { data: downloads, isLoading: loadingDownloads } = useQuery<any[]>({
    queryKey: ['/api/admin/downloads'],
    enabled: !!user?.isAdmin,
  });

  const { data: favorites, isLoading: loadingFavorites } = useQuery<any[]>({
    queryKey: ['/api/admin/favorites'],
    enabled: !!user?.isAdmin,
  });

  const { data: generatedFormulas, isLoading: loadingGeneratedFormulas } = useQuery<any[]>({
    queryKey: ['/api/admin/user-formulations'],
    enabled: !!user?.isAdmin,
  });

  const pagedUsers = users?.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE) ?? [];
  const pagedDownloads = downloads?.slice((downloadsPage - 1) * PAGE_SIZE, downloadsPage * PAGE_SIZE) ?? [];
  const pagedFavorites = favorites?.slice((favoritesPage - 1) * PAGE_SIZE, favoritesPage * PAGE_SIZE) ?? [];

  const handleViewUserFormulas = async (userData: any) => {
    setSelectedUser(userData);
    setLoadingFormulas(true);
    try {
      const userRequests = generatedFormulas?.filter((req: any) => {
        try {
          const formData = typeof req.formData === 'string' ? JSON.parse(req.formData) : req.formData;
          if (userData.email && formData?.email === userData.email) return true;
          if (userData.email && req.email === userData.email) return true;
          if (userData.firstName && req.customer_name?.toLowerCase().includes(userData.firstName.toLowerCase())) return true;
          if (userData.firstName && formData?.customerName?.toLowerCase().includes(userData.firstName.toLowerCase())) return true;
          if (userData.id && req.user_id === userData.id) return true;
          return false;
        } catch { return false; }
      }) || [];

      const displayFormulas = userRequests.map((req: any) => {
        try {
          const formData = typeof req.formData === 'string' ? JSON.parse(req.formData) : req.formData;
          return { id: req.id, name: req.product_name || formData?.productName || 'Unnamed Product', productType: formData?.productType || req.product_category || 'Unknown', status: req.status, createdAt: req.created_at, formData, isActive: true };
        } catch {
          return { id: req.id, name: req.product_name || 'Unnamed Product', productType: req.product_category || 'Unknown', status: req.status, createdAt: req.created_at, isActive: true };
        }
      });

      setUserFormulas(displayFormulas);
      setViewFormulasOpen(true);
    } catch (error) {
      toast({ title: 'Error fetching formulas', variant: 'destructive' });
    } finally {
      setLoadingFormulas(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>Please log in to access the admin dashboard.</CardDescription></CardHeader>
          <CardContent><Link href="/login"><Button data-testid="button-login">Go to Login</Button></Link></CardContent>
        </Card>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You don't have permission to access the admin dashboard.</CardDescription></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Admin privileges are required to view this page.</p>
            <Link href="/"><Button data-testid="button-home">Go to Home</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 bg-[#F5F7FB] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-admin-title">Admin Dashboard</h1>
          <p className="text-muted-foreground">View and manage user activity across the platform</p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users ({users?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="downloads" data-testid="tab-downloads">
              <Download className="w-4 h-4 mr-2" />
              Downloads ({downloads?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="favorites" data-testid="tab-favorites">
              <Heart className="w-4 h-4 mr-2" />
              Favorites ({favorites?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="generated-formulas" data-testid="tab-generated-formulas">
              <FlaskConical className="w-4 h-4 mr-2" />
              Generated ({generatedFormulas?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* ── Users ── */}
          <TabsContent value="users">
            <Card className="border border-[#E6EAF0] shadow-[0_2px_6px_rgba(0,0,0,0.04)] rounded-[14px]">
              <CardHeader>
                <CardTitle className="text-[17px] font-semibold text-gray-900 border-l-[4px] border-[#22C55E] pl-2.5">All Users</CardTitle>
                <CardDescription>Complete list of registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : users && users.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-[#F1F5F9] border-b border-[#EEF2F7]">
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Name</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Email</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Country</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Joined</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Admin</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedUsers.map((userData: any, index: number) => {
                            const todayRow = isToday(userData.createdAt);
                            return (
                              <tr key={userData.id} className={`border-b border-[#EEF2F7] hover:bg-emerald-50/50 transition-colors ${todayRow ? 'bg-emerald-50/40' : ''}`} data-testid={`row-user-${index}`}>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-user-name-${index}`}>
                                  {userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.firstName || 'N/A'}
                                </td>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-user-email-${index}`}>{userData.email}</td>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-user-country-${index}`}>{userData.country || 'N/A'}</td>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-user-joined-${index}`}>
                                  {userData.createdAt ? format(new Date(userData.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                </td>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-user-admin-${index}`}>{userData.isAdmin ? '✓' : ''}</td>
                                <td className="p-3">
                                  <Button variant="ghost" size="sm" onClick={() => handleViewUserFormulas(userData)} disabled={loadingFormulas} className="text-blue-600 hover:text-blue-800" data-testid={`button-view-user-formulas-${index}`} title="View generated formulas">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <Pagination total={users.length} page={usersPage} onPage={(p) => { setUsersPage(p); }} />
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-users">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>No users found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Downloads ── */}
          <TabsContent value="downloads">
            <Card className="border border-[#E6EAF0] shadow-[0_2px_6px_rgba(0,0,0,0.04)] rounded-[14px]">
              <CardHeader>
                <CardTitle className="text-[17px] font-semibold text-gray-900 border-l-[4px] border-[#22C55E] pl-2.5">All Downloads</CardTitle>
                <CardDescription>Complete history of formula downloads with user details</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDownloads ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : downloads && downloads.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-[#F1F5F9] border-b border-[#EEF2F7]">
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">User</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Email</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Country</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Formula</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Downloaded</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedDownloads.map((download: any, index: number) => {
                            const todayRow = isToday(download.downloadedAt);
                            return (
                              <tr key={download.id} className={`border-b border-[#EEF2F7] hover:bg-emerald-50/50 transition-colors ${todayRow ? 'bg-emerald-50/40' : ''}`} data-testid={`row-download-${index}`}>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-download-user-${index}`}>
                                  {download.userFirstName && download.userLastName ? `${download.userFirstName} ${download.userLastName}` : download.userFirstName || 'N/A'}
                                </td>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-download-email-${index}`}>{download.userEmail || 'N/A'}</td>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-download-country-${index}`}>{download.userCountry || 'N/A'}</td>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-download-formula-${index}`}>{download.formulationName}</td>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-download-date-${index}`}>
                                  {format(new Date(download.downloadedAt), 'MMM dd, yyyy HH:mm')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <Pagination total={downloads.length} page={downloadsPage} onPage={(p) => { setDownloadsPage(p); }} />
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-downloads">
                    <Download className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>No downloads found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Favorites ── */}
          <TabsContent value="favorites">
            <Card className="border border-[#E6EAF0] shadow-[0_2px_6px_rgba(0,0,0,0.04)] rounded-[14px]">
              <CardHeader>
                <CardTitle className="text-[17px] font-semibold text-gray-900 border-l-[4px] border-[#22C55E] pl-2.5">All Favorites</CardTitle>
                <CardDescription>Complete list of favorited formulas with user details</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingFavorites ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : favorites && favorites.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-[#F1F5F9] border-b border-[#EEF2F7]">
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">User</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Email</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Country</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Formula</th>
                            <th className="text-left p-3 font-semibold text-gray-600 text-sm">Added</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedFavorites.map((favorite: any, index: number) => {
                            const todayRow = isToday(favorite.addedAt);
                            return (
                              <tr key={favorite.id} className={`border-b border-[#EEF2F7] hover:bg-emerald-50/50 transition-colors ${todayRow ? 'bg-emerald-50/40' : ''}`} data-testid={`row-favorite-${index}`}>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-favorite-user-${index}`}>
                                  {favorite.userFirstName && favorite.userLastName ? `${favorite.userFirstName} ${favorite.userLastName}` : favorite.userFirstName || 'N/A'}
                                </td>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-favorite-email-${index}`}>{favorite.userEmail || 'N/A'}</td>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-favorite-country-${index}`}>{favorite.userCountry || 'N/A'}</td>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-favorite-formula-${index}`}>{favorite.formulation?.name || 'Unknown'}</td>
                                <td className={`p-3 ${todayRow ? 'text-green-700 font-bold' : ''}`} data-testid={`text-favorite-date-${index}`}>
                                  {format(new Date(favorite.addedAt), 'MMM dd, yyyy HH:mm')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <Pagination total={favorites.length} page={favoritesPage} onPage={(p) => { setFavoritesPage(p); }} />
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-favorites">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>No favorites found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Generated Formulas ── */}
          <TabsContent value="generated-formulas">
            {loadingGeneratedFormulas ? (
              <Card>
                <CardHeader><CardTitle>Generated Formulas</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <GeneratedFormulasTab />
            )}
          </TabsContent>
        </Tabs>

        {/* User Formulas Dialog */}
        <Dialog open={viewFormulasOpen} onOpenChange={setViewFormulasOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generated Formulas for {selectedUser?.firstName || 'User'}</DialogTitle>
              <DialogDescription>Total formulas generated: {userFormulas.length}</DialogDescription>
            </DialogHeader>

            {loadingFormulas ? (
              <div className="text-center py-8"><p className="text-gray-500">Loading formulas...</p></div>
            ) : userFormulas.length === 0 ? (
              <div className="text-center py-8"><p className="text-gray-500">No formulas generated yet</p></div>
            ) : (
              <div className="space-y-4">
                {userFormulas.map((formula: any) => (
                  <div key={formula.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{formula.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">Type: {formula.productType}</p>
                        <p className="text-sm text-gray-600 mt-1">Status: <Badge className="text-xs">{formula.status}</Badge></p>
                        <p className="text-sm text-gray-500 mt-1">Created: {new Date(formula.createdAt || '').toLocaleDateString()}</p>
                      </div>
                      <Badge className={formula.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {formula.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setViewFormulasOpen(false)} data-testid="button-close-user-formulas">Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

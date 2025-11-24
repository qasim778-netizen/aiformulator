import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Download, Heart, FlaskConical, Eye } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import GeneratedFormulasTab from "@/components/admin/generated-formulas-tab";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewFormulasOpen, setViewFormulasOpen] = useState(false);
  const [userFormulas, setUserFormulas] = useState<any[]>([]);
  const [loadingFormulas, setLoadingFormulas] = useState(false);
  const { toast } = useToast();

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

  const handleViewUserFormulas = async (userData: any) => {
    setSelectedUser(userData);
    setLoadingFormulas(true);
    try {
      const userRequest = generatedFormulas?.find((req: any) => req.userId === userData.id);
      if (userRequest) {
        const response = await fetch(`/api/admin/user-formulations/${userRequest.id}/generated`);
        if (response.ok) {
          const formulas = await response.json();
          setUserFormulas(formulas);
          setViewFormulasOpen(true);
        } else {
          toast({ title: 'Failed to fetch generated formulas', variant: 'destructive' });
        }
      } else {
        setUserFormulas([]);
        setViewFormulasOpen(true);
      }
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
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to access the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button data-testid="button-login">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Admin privileges are required to view this page.
            </p>
            <Link href="/">
              <Button data-testid="button-home">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
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

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Complete list of registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : users && users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left p-3 font-semibold">Name</th>
                          <th className="text-left p-3 font-semibold">Email</th>
                          <th className="text-left p-3 font-semibold">Country</th>
                          <th className="text-left p-3 font-semibold">Joined</th>
                          <th className="text-left p-3 font-semibold">Admin</th>
                          <th className="text-left p-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((userData: any, index: number) => (
                          <tr 
                            key={userData.id} 
                            className="border-b border-gray-200 hover:bg-gray-50"
                            data-testid={`row-user-${index}`}
                          >
                            <td className="p-3" data-testid={`text-user-name-${index}`}>
                              {userData.firstName && userData.lastName 
                                ? `${userData.firstName} ${userData.lastName}` 
                                : userData.firstName || 'N/A'}
                            </td>
                            <td className="p-3" data-testid={`text-user-email-${index}`}>
                              {userData.email}
                            </td>
                            <td className="p-3" data-testid={`text-user-country-${index}`}>
                              {userData.country || 'N/A'}
                            </td>
                            <td className="p-3" data-testid={`text-user-joined-${index}`}>
                              {userData.createdAt ? format(new Date(userData.createdAt), 'MMM dd, yyyy') : 'N/A'}
                            </td>
                            <td className="p-3" data-testid={`text-user-admin-${index}`}>
                              {userData.isAdmin ? '✓' : ''}
                            </td>
                            <td className="p-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewUserFormulas(userData)}
                                disabled={loadingFormulas}
                                className="text-blue-600 hover:text-blue-800"
                                data-testid={`button-view-user-formulas-${index}`}
                                title="View generated formulas"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-users">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No users found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="downloads">
            <Card>
              <CardHeader>
                <CardTitle>All Downloads</CardTitle>
                <CardDescription>
                  Complete history of formula downloads with user details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDownloads ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : downloads && downloads.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left p-3 font-semibold">User</th>
                          <th className="text-left p-3 font-semibold">Email</th>
                          <th className="text-left p-3 font-semibold">Country</th>
                          <th className="text-left p-3 font-semibold">Formula</th>
                          <th className="text-left p-3 font-semibold">Downloaded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {downloads.map((download: any, index: number) => (
                          <tr 
                            key={download.id} 
                            className="border-b border-gray-200 hover:bg-gray-50"
                            data-testid={`row-download-${index}`}
                          >
                            <td className="p-3" data-testid={`text-download-user-${index}`}>
                              {download.userFirstName && download.userLastName 
                                ? `${download.userFirstName} ${download.userLastName}` 
                                : download.userFirstName || 'N/A'}
                            </td>
                            <td className="p-3" data-testid={`text-download-email-${index}`}>
                              {download.userEmail || 'N/A'}
                            </td>
                            <td className="p-3" data-testid={`text-download-country-${index}`}>
                              {download.userCountry || 'N/A'}
                            </td>
                            <td className="p-3" data-testid={`text-download-formula-${index}`}>
                              {download.formulationName}
                            </td>
                            <td className="p-3" data-testid={`text-download-date-${index}`}>
                              {format(new Date(download.downloadedAt), 'MMM dd, yyyy HH:mm')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-downloads">
                    <Download className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No downloads found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>All Favorites</CardTitle>
                <CardDescription>
                  Complete list of favorited formulas with user details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingFavorites ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : favorites && favorites.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left p-3 font-semibold">User</th>
                          <th className="text-left p-3 font-semibold">Email</th>
                          <th className="text-left p-3 font-semibold">Country</th>
                          <th className="text-left p-3 font-semibold">Formula</th>
                          <th className="text-left p-3 font-semibold">Added</th>
                        </tr>
                      </thead>
                      <tbody>
                        {favorites.map((favorite: any, index: number) => (
                          <tr 
                            key={favorite.id} 
                            className="border-b border-gray-200 hover:bg-gray-50"
                            data-testid={`row-favorite-${index}`}
                          >
                            <td className="p-3" data-testid={`text-favorite-user-${index}`}>
                              {favorite.userFirstName && favorite.userLastName 
                                ? `${favorite.userFirstName} ${favorite.userLastName}` 
                                : favorite.userFirstName || 'N/A'}
                            </td>
                            <td className="p-3" data-testid={`text-favorite-email-${index}`}>
                              {favorite.userEmail || 'N/A'}
                            </td>
                            <td className="p-3" data-testid={`text-favorite-country-${index}`}>
                              {favorite.userCountry || 'N/A'}
                            </td>
                            <td className="p-3" data-testid={`text-favorite-formula-${index}`}>
                              {favorite.formulation?.name || 'Unknown'}
                            </td>
                            <td className="p-3" data-testid={`text-favorite-date-${index}`}>
                              {format(new Date(favorite.addedAt), 'MMM dd, yyyy HH:mm')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-favorites">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No favorites found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generated-formulas">
            {loadingGeneratedFormulas ? (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Formulas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
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
              <DialogDescription>
                Total formulas generated: {userFormulas.length}
              </DialogDescription>
            </DialogHeader>

            {userFormulas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No formulas generated yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userFormulas.map((formula: any) => (
                  <div key={formula.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{formula.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">Category: {formula.categoryId ? 'Custom' : 'Generated'}</p>
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
              <Button
                variant="outline"
                onClick={() => setViewFormulasOpen(false)}
                data-testid="button-close-user-formulas"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

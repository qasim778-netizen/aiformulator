import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Download, Trash2, User } from "lucide-react";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function MyAccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: downloads, isLoading: loadingDownloads } = useQuery<any[]>({
    queryKey: ['/api/user/downloads'],
    enabled: !!user,
  });

  const { data: favorites, isLoading: loadingFavorites } = useQuery<any[]>({
    queryKey: ['/api/user/favorites'],
    enabled: !!user,
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (formulationId: string) => {
      return apiRequest('DELETE', `/api/user/favorites/${formulationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/favorites'] });
      toast({
        title: "Removed from favorites",
        description: "Formula has been removed from your favorites.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to view your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt={user.firstName || 'User'} 
                  className="w-16 h-16 rounded-full"
                  data-testid="img-profile"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center" data-testid="icon-profile-placeholder">
                  <User className="w-8 h-8 text-primary" />
                </div>
              )}
              <div>
                <CardTitle data-testid="text-user-name">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.firstName || 'User'}
                </CardTitle>
                <CardDescription data-testid="text-user-email">{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="downloads" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="downloads" data-testid="tab-downloads">
              <Download className="w-4 h-4 mr-2" />
              My Downloads
            </TabsTrigger>
            <TabsTrigger value="favorites" data-testid="tab-favorites">
              <Heart className="w-4 h-4 mr-2" />
              My Favorites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="downloads">
            <Card>
              <CardHeader>
                <CardTitle>Downloaded Formulas</CardTitle>
                <CardDescription>
                  Track all the formulas you've downloaded
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
                          <th className="text-left p-3 font-semibold">Formula Name</th>
                          <th className="text-left p-3 font-semibold">Category</th>
                          <th className="text-left p-3 font-semibold">Downloaded</th>
                          <th className="text-right p-3 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {downloads.map((download: any, index: number) => (
                          <tr 
                            key={download.id} 
                            className="border-b border-gray-200 hover:bg-gray-50"
                            data-testid={`row-download-${index}`}
                          >
                            <td className="p-3" data-testid={`text-formula-name-${index}`}>
                              {download.formulationName}
                            </td>
                            <td className="p-3" data-testid={`text-category-${index}`}>
                              {download.categoryName}
                            </td>
                            <td className="p-3" data-testid={`text-downloaded-date-${index}`}>
                              {format(new Date(download.downloadedAt), 'MMM dd, yyyy')}
                            </td>
                            <td className="p-3 text-right">
                              {download.formulation && (
                                <Link href={`/formulation/${download.formulationId}`}>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    data-testid={`button-view-${index}`}
                                  >
                                    View
                                  </Button>
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-downloads">
                    <Download className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>You haven't downloaded any formulas yet.</p>
                    <Link href="/">
                      <Button variant="link" className="mt-2" data-testid="button-browse-formulas">
                        Browse Formulas
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Favorite Formulas</CardTitle>
                <CardDescription>
                  Quick access to your favorite formulations
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
                          <th className="text-left p-3 font-semibold">Formula Name</th>
                          <th className="text-left p-3 font-semibold">Category</th>
                          <th className="text-left p-3 font-semibold">Added</th>
                          <th className="text-right p-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {favorites.map((favorite: any, index: number) => (
                          <tr 
                            key={favorite.id} 
                            className="border-b border-gray-200 hover:bg-gray-50"
                            data-testid={`row-favorite-${index}`}
                          >
                            <td className="p-3" data-testid={`text-favorite-name-${index}`}>
                              {favorite.formulation?.name || 'Unknown'}
                            </td>
                            <td className="p-3" data-testid={`text-favorite-category-${index}`}>
                              {favorite.category?.name || 'Unknown'}
                            </td>
                            <td className="p-3" data-testid={`text-favorite-date-${index}`}>
                              {format(new Date(favorite.addedAt), 'MMM dd, yyyy')}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-2">
                                {favorite.formulation && (
                                  <Link href={`/formulation/${favorite.formulationId}`}>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      data-testid={`button-view-favorite-${index}`}
                                    >
                                      View
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFavoriteMutation.mutate(favorite.formulationId)}
                                  disabled={removeFavoriteMutation.isPending}
                                  data-testid={`button-remove-favorite-${index}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-favorites">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>You haven't added any favorites yet.</p>
                    <Link href="/">
                      <Button variant="link" className="mt-2" data-testid="button-browse-formulas-favorites">
                        Browse Formulas
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

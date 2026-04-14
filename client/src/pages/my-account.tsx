import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Download, Trash2, User, Wand2, Zap } from "lucide-react";
import Breadcrumb from "@/components/breadcrumb";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function MyAccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: downloads, isLoading: loadingDownloads } = useQuery<any[]>({
    queryKey: ['/api/user/downloads'],
    enabled: !!user,
    staleTime: 0,
  });

  const { data: favorites, isLoading: loadingFavorites } = useQuery<any[]>({
    queryKey: ['/api/user/favorites'],
    enabled: !!user,
  });

  const { data: generated, isLoading: loadingGenerated } = useQuery<any[]>({
    queryKey: ['/api/user/generated'],
    enabled: !!user,
  });

  const downloadGeneratedMutation = useMutation({
    mutationFn: async (formulation: any) => {
      setDownloadingId(formulation.id);
      try {
        const response = await fetch(`/api/formulations/${formulation.id}/download/pdf`);
        if (response.status === 401) {
          setLocation('/login');
          throw new Error('Please log in to download');
        }
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formulation.name}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        await apiRequest('POST', '/api/user/downloads', {
          formulationId: formulation.id,
          formulationName: formulation.name,
          categoryName: formulation.categoryName || 'Generated'
        });
        
        await queryClient.invalidateQueries({ queryKey: ['/api/user/downloads'] });
        toast({ title: "Downloaded", description: `${formulation.name} PDF downloaded successfully` });
      } finally {
        setDownloadingId(null);
      }
    },
    onError: () => {
      setDownloadingId(null);
      toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
    }
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
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "My Account" }]} />
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

        {/* Generate Formula CTA */}
        <a href="/#ai-formulator" style={{ textDecoration: "none" }}>
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl cursor-pointer group" style={{ background: "linear-gradient(135deg, #0D9488 0%, #059669 100%)" }}>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-base sm:text-lg leading-tight">Generate Your Custom Formula</p>
                <p className="text-white/80 text-sm">AI-powered — get a professional formulation in seconds</p>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 bg-white text-teal-700 font-semibold px-5 py-2.5 rounded-full text-sm group-hover:bg-teal-50 transition-colors">
              Start Now <Zap className="w-4 h-4 ml-1" />
            </div>
          </div>
        </a>

        <Tabs defaultValue="downloads" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="downloads" data-testid="tab-downloads">
              <Download className="w-4 h-4 mr-2" />
              My Downloads
              <span className="ml-1 bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs font-semibold">
                {downloads?.length || 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value="favorites" data-testid="tab-favorites">
              <Heart className="w-4 h-4 mr-2" />
              My Favorites
              <span className="ml-1 bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs font-semibold">
                {favorites?.length || 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value="generated" data-testid="tab-generated">
              <Wand2 className="w-4 h-4 mr-2" />
              Generated Formulas
              <span className="ml-1 bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs font-semibold">
                {generated?.length || 0}
              </span>
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
                            <td className="p-3" data-testid={`text-downloaded-date-${index}`}>
                              {format(new Date(download.downloadedAt), 'MMM dd, yyyy')}
                            </td>
                            <td className="p-3 text-right">
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
                            <td className="p-3" data-testid={`text-favorite-date-${index}`}>
                              {format(new Date(favorite.addedAt), 'MMM dd, yyyy')}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-2">
                                {favorite.formulation && (
                                  <a
                                    href={`/formulation/${favorite.formulation.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      data-testid={`button-view-favorite-${index}`}
                                    >
                                      View
                                    </Button>
                                  </a>
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

          <TabsContent value="generated">
            <Card>
              <CardHeader>
                <CardTitle>Generated Formulas</CardTitle>
                <CardDescription>
                  Formulas you've created using the AI wizard
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingGenerated ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : generated && generated.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left p-3 font-semibold">Formula Name</th>
                          <th className="text-left p-3 font-semibold">Created</th>
                          <th className="text-right p-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generated.map((gen: any, index: number) => (
                          <tr 
                            key={gen.id} 
                            className="border-b border-gray-200 hover:bg-gray-50"
                            data-testid={`row-generated-${index}`}
                          >
                            <td className="p-3" data-testid={`text-generated-name-${index}`}>
                              {gen.name}
                            </td>
                            <td className="p-3" data-testid={`text-generated-date-${index}`}>
                              {format(new Date(gen.createdAt), 'MMM dd, yyyy')}
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => downloadGeneratedMutation.mutate(gen)}
                                disabled={downloadingId === gen.id}
                                data-testid={`button-download-generated-${index}`}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                {downloadingId === gen.id ? 'Downloading...' : 'Download'}
                              </Button>
                              
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-generated">
                    <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>You haven't generated any formulas yet.</p>
                    <a href="/#ai-formulator" style={{ textDecoration: "none" }}>
                      <Button variant="link" className="mt-2" data-testid="button-create-formula">
                        Create Your First Formula
                      </Button>
                    </a>
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

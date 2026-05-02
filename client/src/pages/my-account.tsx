import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Download, Trash2, User, Wand2, Zap, Eye, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useState } from "react";

type Section = "downloads" | "favorites" | "generated";

export default function MyAccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<Section>("downloads");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: downloads, isLoading: loadingDownloads } = useQuery<any[]>({
    queryKey: ["/api/user/downloads"],
    enabled: !!user,
    staleTime: 0,
  });

  const { data: favorites, isLoading: loadingFavorites } = useQuery<any[]>({
    queryKey: ["/api/user/favorites"],
    enabled: !!user,
  });

  const { data: generated, isLoading: loadingGenerated } = useQuery<any[]>({
    queryKey: ["/api/user/generated"],
    enabled: !!user,
  });

  const downloadGeneratedMutation = useMutation({
    mutationFn: async (formulation: any) => {
      setDownloadingId(formulation.id);
      try {
        const response = await fetch(`/api/formulations/${formulation.id}/download/pdf`);
        if (response.status === 401) { setLocation("/login"); throw new Error("Please log in to download"); }
        if (!response.ok) throw new Error("Download failed");
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${formulation.name}.pdf`;
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); document.body.removeChild(a);
        await apiRequest("POST", "/api/user/downloads", {
          formulationId: formulation.id, formulationName: formulation.name,
          categoryName: formulation.categoryName || "Generated",
        });
        await queryClient.invalidateQueries({ queryKey: ["/api/user/downloads"] });
        toast({ title: "Downloaded", description: `${formulation.name} PDF downloaded successfully` });
      } finally { setDownloadingId(null); }
    },
    onError: () => { setDownloadingId(null); toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" }); },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (formulationId: string) => apiRequest("DELETE", `/api/user/favorites/${formulationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
      toast({ title: "Removed from favorites", description: "Formula has been removed from your favorites." });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove from favorites.", variant: "destructive" }),
  });

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Please log in to view your account.</p>
          <Link href="/login"><Button>Go to Login</Button></Link>
        </div>
      </div>
    );
  }

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.email?.split("@")[0] || "User";

  const NAV = [
    { id: "downloads" as Section, label: "My Downloads",      icon: Download, count: downloads?.length ?? 0 },
    { id: "favorites" as Section, label: "My Favourites",     icon: Heart,    count: favorites?.length ?? 0 },
    { id: "generated" as Section, label: "Generated Formulas",icon: Wand2,    count: generated?.length ?? 0 },
  ];

  const sectionTitles: Record<Section, { title: string; desc: string }> = {
    downloads: { title: "Downloaded Formulas",  desc: "Track all the formulas you've downloaded" },
    favorites:  { title: "Favourite Formulas",  desc: "Quick access to your saved formulations" },
    generated:  { title: "Generated Formulas",  desc: "Formulas you've created using the AI wizard" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
          <Link href="/"><span className="hover:text-gray-800 cursor-pointer">Home</span></Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">My Account</span>
        </nav>

        <div className="flex gap-6 items-start">

          {/* ── Left Sidebar ─────────────────────────────────────────────── */}
          <aside className="w-64 flex-shrink-0 space-y-4">

            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col items-center text-center">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt={displayName}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-100 mb-3"
                    data-testid="img-profile" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3 ring-2 ring-emerald-200"
                    data-testid="icon-profile-placeholder">
                    <User className="w-7 h-7 text-emerald-600" />
                  </div>
                )}
                <p className="font-semibold text-gray-900 text-sm leading-tight" data-testid="text-user-name">{displayName}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate w-full" data-testid="text-user-email">{user.email}</p>
              </div>
            </div>

            {/* Nav */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">My Account</p>
              <nav className="pb-2">
                {NAV.map(item => {
                  const Icon = item.icon;
                  const active = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors group ${
                        active ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                      <span className="flex-1 text-left">{item.label}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Generate CTA */}
            <a href="/#ai-formulator" className="block">
              <div className="rounded-2xl p-4 cursor-pointer group" style={{ background: "linear-gradient(135deg, #0D9488 0%, #059669 100%)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white font-semibold text-sm leading-tight">Generate Your Formula</p>
                </div>
                <p className="text-white/80 text-xs mb-3">AI-powered — get a professional formulation in seconds</p>
                <div className="flex items-center justify-center gap-1.5 bg-white text-teal-700 font-semibold px-3 py-2 rounded-xl text-xs group-hover:bg-teal-50 transition-colors">
                  Start Now <Zap className="w-3 h-3" />
                </div>
              </div>
            </a>

          </aside>

          {/* ── Main Content ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Section header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">{sectionTitles[activeSection].title}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{sectionTitles[activeSection].desc}</p>
              </div>

              {/* ── Downloads ── */}
              {activeSection === "downloads" && (
                <div>
                  {loadingDownloads ? (
                    <div className="p-6 space-y-3">
                      {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                    </div>
                  ) : downloads && downloads.length > 0 ? (
                    <table className="w-full" data-testid="table-downloads">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Formula Name</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Downloaded</th>
                          <th className="px-6 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {downloads.map((dl: any, idx: number) => (
                          <tr key={dl.id} className="hover:bg-gray-50 transition-colors" data-testid={`row-download-${idx}`}>
                            <td className="px-6 py-4 text-sm text-gray-800 font-medium" data-testid={`text-formula-name-${idx}`}>
                              {dl.formulationName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500" data-testid={`text-downloaded-date-${idx}`}>
                              {format(new Date(dl.downloadedAt), "MMM dd, yyyy")}
                            </td>
                            <td className="px-6 py-4 text-right" />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400" data-testid="text-no-downloads">
                      <Download className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-sm">You haven't downloaded any formulas yet.</p>
                      <Link href="/"><Button variant="link" className="mt-2 text-emerald-600" data-testid="button-browse-formulas">Browse Formulas</Button></Link>
                    </div>
                  )}
                </div>
              )}

              {/* ── Favourites ── */}
              {activeSection === "favorites" && (
                <div>
                  {loadingFavorites ? (
                    <div className="p-6 space-y-3">
                      {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                    </div>
                  ) : favorites && favorites.length > 0 ? (
                    <table className="w-full" data-testid="table-favorites">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Formula Name</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Added</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {favorites.map((fav: any, idx: number) => (
                          <tr key={fav.id} className="hover:bg-gray-50 transition-colors" data-testid={`row-favorite-${idx}`}>
                            <td className="px-6 py-4 text-sm text-gray-800 font-medium" data-testid={`text-favorite-name-${idx}`}>
                              {fav.formulation?.name || "Unknown"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500" data-testid={`text-favorite-date-${idx}`}>
                              {format(new Date(fav.addedAt), "MMM dd, yyyy")}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                {fav.formulation && (
                                  <a href={`/formulation/${fav.formulation.slug}`} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" data-testid={`button-view-favorite-${idx}`}>
                                      <Eye className="w-3.5 h-3.5" /> View
                                    </Button>
                                  </a>
                                )}
                                <Button variant="ghost" size="sm" className="h-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                  onClick={() => removeFavoriteMutation.mutate(fav.formulationId)}
                                  disabled={removeFavoriteMutation.isPending}
                                  data-testid={`button-remove-favorite-${idx}`}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400" data-testid="text-no-favorites">
                      <Heart className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-sm">You haven't saved any favourites yet.</p>
                      <Link href="/"><Button variant="link" className="mt-2 text-emerald-600" data-testid="button-browse-formulas-favorites">Browse Formulas</Button></Link>
                    </div>
                  )}
                </div>
              )}

              {/* ── Generated ── */}
              {activeSection === "generated" && (
                <div>
                  {loadingGenerated ? (
                    <div className="p-6 space-y-3">
                      {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                    </div>
                  ) : generated && generated.length > 0 ? (
                    <table className="w-full" data-testid="table-generated">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Formula Name</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {generated.map((gen: any, idx: number) => (
                          <tr key={gen.id} className="hover:bg-gray-50 transition-colors" data-testid={`row-generated-${idx}`}>
                            <td className="px-6 py-4 text-sm text-gray-800 font-medium" data-testid={`text-generated-name-${idx}`}>
                              {gen.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500" data-testid={`text-generated-date-${idx}`}>
                              {format(new Date(gen.createdAt), "MMM dd, yyyy")}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                                onClick={() => downloadGeneratedMutation.mutate(gen)}
                                disabled={downloadingId === gen.id}
                                data-testid={`button-download-generated-${idx}`}>
                                <Download className="w-3.5 h-3.5" />
                                {downloadingId === gen.id ? "Downloading…" : "Download"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400" data-testid="text-no-generated">
                      <Wand2 className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-sm">You haven't generated any formulas yet.</p>
                      <a href="/#ai-formulator"><Button variant="link" className="mt-2 text-emerald-600" data-testid="button-create-formula">Create Your First Formula</Button></a>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

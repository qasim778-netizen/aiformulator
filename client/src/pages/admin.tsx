import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  LayoutDashboard, FolderOpen, Package, Layers, Tag, FlaskConical,
  Zap, Sparkles, Users, TestTube2, FileText, BookOpen, FileEdit,
  UserCheck, BarChart2, ShieldCheck, Settings as SettingsIcon,
  Plus, Edit, Trash2, User, CheckCircle, PauseCircle,
  LogOut, Image, Eye, ChevronDown, Bell, Search, Menu, ChevronLeft,
  ArrowUpRight, Download, Heart, Wand2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import CategoryForm from "@/components/admin/category-form";
import FormulationForm from "@/components/admin/formulation-form";
import BulkGenerationForm from "@/components/admin/bulk-generation-form";
import BulkFormulationGenerator from "@/components/admin/bulk-formulation-generator";
import LogoSettings from "@/components/admin/logo-settings";
import ContentManagementTab from "@/components/admin/content-management-tab";
import AICategorySuggestions from "@/components/admin/ai-category-suggestions";
import FormulationTester from "@/components/admin/formulation-tester";
import FormulationContentManagementTab from "@/components/admin/formulation-content-management-tab";
import GeneratedFormulasTab from "@/components/admin/generated-formulas-tab";
import BlogManagementTab from "@/components/admin/blog-management-tab";
import DatabaseBuilderTab from "@/components/admin/database-builder-tab";
import FormulatorManagementTab from "@/components/admin/formulator-management-tab";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminOverviewTab from "@/components/admin/admin-overview-tab";
import SampleProductsTab from "@/components/admin/sample-products-tab";
import OpenAIUsageTab from "@/components/admin/openai-usage-tab";
import type { Category, Formulation } from "@shared/schema";

type NavId =
  | "overview" | "categories" | "product-types" | "base-types" | "feature-chips"
  | "formulations" | "bulk-formulations" | "generated-formulas" | "user-requests"
  | "sample-products" | "test-formulation" | "prompt-templates" | "blog"
  | "formulation-content" | "formulators" | "openai-usage" | "safety-validation" | "settings";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  href?: string;
  action?: "open-create-formulation";
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  children: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "formulation",
    label: "Formulation",
    icon: FlaskConical,
    children: [
      { id: "_create-formulation", label: "Create Formulation",  icon: Plus,      action: "open-create-formulation" },
      { id: "formulations",        label: "Formula Management",  icon: FileText },
      { id: "bulk-formulations",   label: "Bulk Formulations",   icon: Zap },
      { id: "generated-formulas",  label: "Generated Formulas",  icon: Sparkles },
      { id: "user-requests",       label: "User Requests",       icon: Users },
      { id: "sample-products",      label: "Sample Products",     icon: Package },
    ],
  },
  {
    id: "product-structure",
    label: "Product Structure",
    icon: Layers,
    children: [
      { id: "database-builder", label: "Database Builder",     icon: Wand2 },
      { id: "categories",    label: "Category Management",    icon: FolderOpen },
      { id: "product-types", label: "Product Type Management",icon: Package },
      { id: "base-types",    label: "Base Type Management",   icon: Layers },
      { id: "feature-chips", label: "Feature Chips",          icon: Tag },
    ],
  },
  {
    id: "ai-system",
    label: "AI System",
    icon: Sparkles,
    children: [
      { id: "test-formulation", label: "Test AI System",      icon: TestTube2 },
      { id: "prompt-templates", label: "Prompt Templates",    icon: FileText },
      { id: "openai-usage",     label: "OpenAI Usage",        icon: BarChart2 },
      { id: "safety-validation",label: "Safety & Validation", icon: ShieldCheck },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: BookOpen,
    children: [
      { id: "blog",                label: "Blog Management", icon: BookOpen },
      { id: "formulation-content", label: "Page Content",   icon: FileEdit },
      { id: "formulators",         label: "Expert Cards",   icon: UserCheck },
    ],
  },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<NavId>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["formulation", "product-structure", "ai-system", "content"])
  );
  const toggleGroup = (groupId: string) =>
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [formulationsPage, setFormulationsPage] = useState(1);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [formulationDialogOpen, setFormulationDialogOpen] = useState(false);
  const [bulkGenerationDialogOpen, setBulkGenerationDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingFormulation, setEditingFormulation] = useState<Formulation | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setFormulationsPage(1);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({ title: "Unauthorized", description: "Redirecting to login…", variant: "destructive" });
      setTimeout(() => { window.location.href = "/api/login"; }, 1000);
    }
    if (!isLoading && isAuthenticated && user && !user.isAdmin) {
      toast({ title: "Access Denied", description: "Admin privileges required.", variant: "destructive" });
      setTimeout(() => { window.location.href = "/"; }, 1000);
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const itemsPerPage = 10;
  const totalCatPages = Math.ceil((categories?.length || 0) / itemsPerPage);
  const catStart = (categoriesPage - 1) * itemsPerPage;
  const categoriesPaginated = {
    data: categories?.slice(catStart, catStart + itemsPerPage) || [],
    pagination: { currentPage: categoriesPage, totalPages: totalCatPages, totalItems: categories?.length || 0, itemsPerPage },
  };

  const { data: formulationsPaginated } = useQuery<{
    data: Formulation[];
    pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number };
  }>({
    queryKey: ["/api/admin/formulations", formulationsPage, selectedCategory],
    queryFn: async () => {
      const cat = selectedCategory !== "all" ? `&categoryId=${selectedCategory}` : "";
      const r = await fetch(`/api/admin/formulations?page=${formulationsPage}&limit=10${cat}`);
      if (!r.ok) throw new Error("Failed to fetch formulations");
      return r.json();
    },
  });

  const { data: formulationsData } = useQuery<Formulation[]>({ queryKey: ["/api/formulations"] });

  const stats = {
    totalCategories: categories?.length || 0,
    totalFormulations: formulationsData?.length || 0,
    activeFormulations: formulationsData?.filter(f => f.isActive !== false).length || 0,
    draftFormulations: formulationsData?.filter(f => f.isActive === false).length || 0,
  };

  const { data: adminUsers } = useQuery<any[]>({ queryKey: ["/api/admin/users"], queryFn: async () => { const r = await fetch("/api/admin/users"); return r.ok ? r.json() : []; }, staleTime: 60000 });
  const { data: adminDownloads } = useQuery<any[]>({ queryKey: ["/api/admin/downloads"], queryFn: async () => { const r = await fetch("/api/admin/downloads"); return r.ok ? r.json() : []; }, staleTime: 60000 });
  const { data: adminFavorites } = useQuery<any[]>({ queryKey: ["/api/admin/favorites"], queryFn: async () => { const r = await fetch("/api/admin/favorites"); return r.ok ? r.json() : []; }, staleTime: 60000 });
  const { data: adminGenerated } = useQuery<any[]>({ queryKey: ["/api/admin/user-formulations"], queryFn: async () => { const r = await fetch("/api/admin/user-formulations"); return r.ok ? r.json() : []; }, staleTime: 60000 });

  const platformStats = [
    { label: "Users",     count: adminUsers?.length     ?? 0, icon: Users,    color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Downloads", count: adminDownloads?.length ?? 0, icon: Download,  color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Favourites",count: adminFavorites?.length ?? 0, icon: Heart,     color: "text-pink-600",   bg: "bg-pink-50" },
    { label: "Generated", count: adminGenerated?.length ?? 0, icon: Wand2,     color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const deleteCategory = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeleteConfirmOpen(false);
      setDeletingCategory(null);
      toast({ title: "Category deleted successfully" });
    },
    onError: (error: any) => {
      setDeleteConfirmOpen(false);
      setDeletingCategory(null);
      toast({ title: "Delete failed", description: error?.message || "Failed to delete category", variant: "destructive" });
    },
  });

  const deleteFormulation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/formulations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/formulations"] });
      toast({ title: "Formulation deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete formulation", variant: "destructive" }),
  });

  const updateFormulationStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/formulations/${id}/status`, { isActive }),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: isActive ? "Formulation Approved" : "Formulation Deactivated" });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const getCategoryName = (id: string) =>
    categories?.find(c => c.id === id)?.name || "Unknown";

  const handleLogout = () => { window.location.href = "/api/logout"; };

  const activeNavItem = NAV_GROUPS.flatMap(g => g.children).find(n => n.id === activeTab)
    ?? (activeTab === "overview" ? { label: "Overview" } : activeTab === "settings" ? { label: "Settings" } : null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-[#F5F7FB] overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ${
          collapsed ? "w-[68px]" : "w-64"
        } flex-shrink-0`}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 ${collapsed ? "justify-center px-0" : ""}`}>
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight truncate">AIFormulator</p>
              <p className="text-[11px] text-emerald-600 font-medium">Admin</p>
            </div>
          )}
        </div>

        {/* ── Platform stats strip ────────────────────────────────────────── */}
        {!collapsed && (
          <div className="px-3 py-3 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Platform Activity</p>
            <div className="grid grid-cols-2 gap-1.5">
              {platformStats.map(({ label, count, icon: Icon, color, bg }) => (
                <button
                  key={label}
                  onClick={() => setActiveTab("user-requests")}
                  className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{count}</p>
                    <p className="text-[10px] text-gray-500 leading-tight truncate">{label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">

          {/* Overview — standalone */}
          <button
            onClick={() => setActiveTab("overview")}
            title={collapsed ? "Overview" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
              activeTab === "overview"
                ? "bg-[#E8F8F1] text-[#16A34A]"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <LayoutDashboard className={`h-[18px] w-[18px] flex-shrink-0 ${activeTab === "overview" ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`} />
            {!collapsed && <span>Overview</span>}
          </button>

          {/* Grouped nav sections */}
          {NAV_GROUPS.map(group => {
            const GroupIcon = group.icon;
            const isOpen = expandedGroups.has(group.id);
            const groupHasActive = group.children.some(c => c.id === activeTab);

            return (
              <div key={group.id} className="mt-1">
                {/* Group header */}
                <button
                  onClick={() => collapsed ? undefined : toggleGroup(group.id)}
                  title={collapsed ? group.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors group ${
                    collapsed
                      ? groupHasActive
                        ? "bg-[#E8F8F1] text-[#16A34A]"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <GroupIcon className={`h-[18px] w-[18px] flex-shrink-0 ${groupHasActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} />
                    </>
                  )}
                </button>

                {/* Children */}
                {!collapsed && isOpen && (
                  <div className="mt-0.5 ml-2 pl-3 border-l border-gray-100 space-y-0.5">
                    {group.children.map(item => {
                      const Icon = item.icon;
                      const isActionItem = !!item.action || !!item.href;
                      const active = !isActionItem && activeTab === item.id;

                      const handleItemClick = () => {
                        if (item.action === "open-create-formulation") {
                          setActiveTab("formulations");
                          setFormulationDialogOpen(true);
                        } else if (item.href) {
                          window.location.href = item.href;
                        } else {
                          setActiveTab(item.id as NavId);
                        }
                      };

                      return (
                        <button
                          key={item.id}
                          onClick={handleItemClick}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors group ${
                            active
                              ? "bg-[#E8F8F1] text-[#16A34A]"
                              : isActionItem
                                ? "text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                          }`}
                        >
                          <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-emerald-500" : "text-gray-400 group-hover:text-gray-500"}`} />
                          <span className="truncate">{item.label}</span>
                          {item.badge ? (
                            <span className="ml-auto bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Settings — standalone */}
          <div className="mt-1">
            <button
              onClick={() => setActiveTab("settings")}
              title={collapsed ? "Settings" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                activeTab === "settings"
                  ? "bg-[#E8F8F1] text-[#16A34A]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <SettingsIcon className={`h-[18px] w-[18px] flex-shrink-0 ${activeTab === "settings" ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`} />
              {!collapsed && <span>Settings</span>}
            </button>
          </div>

        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 gap-4 flex-shrink-0">
          <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-gray-700 transition-colors lg:hidden">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <Link href="/">
              <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Back to Site
              </button>
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-sm font-semibold text-gray-900">
              {activeNavItem?.label || "Admin Dashboard"}
            </h1>
          </div>

          <div className="flex-1 max-w-sm ml-4 hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-9 h-9 bg-gray-50 border-gray-200 text-sm" placeholder="Search formulations..." />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-1.5 text-gray-400 hover:text-gray-700 transition-colors">
              <Bell className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.email?.split("@")[0] || "Admin"}</p>
                <p className="text-[10px] text-emerald-600 font-medium">Super Admin</p>
              </div>
            </div>

            <Button size="sm" variant="outline" className="h-8 px-3 gap-1.5 text-xs border-gray-200 text-gray-600 hover:text-gray-900"
              onClick={() => setActiveTab("overview")}>
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 px-2 text-gray-500 hover:text-gray-800">
              <LogOut className="h-4 w-4 mr-1" />
              <span className="text-xs hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
          {activeTab === "overview" && <AdminOverviewTab />}

          {/* ── SAMPLE PRODUCTS ──────────────────────────────────────────── */}
          {activeTab === "sample-products" && <SampleProductsTab />}

          {/* ── CATEGORY MANAGEMENT ──────────────────────────────────────── */}
          {activeTab === "categories" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Category Management</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Manage product categories and their properties</p>
                </div>
                <div className="flex gap-2">
                  <AICategorySuggestions />
                  <Dialog open={categoryDialogOpen} onOpenChange={open => { setCategoryDialogOpen(open); if (!open) setEditingCategory(null); }}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-add-category-main">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
                        <DialogDescription>{editingCategory ? "Update category details" : "Add a new formulation category"}</DialogDescription>
                      </DialogHeader>
                      <CategoryForm category={editingCategory} onSuccess={() => { setCategoryDialogOpen(false); setEditingCategory(null); }} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-50">
                        {categoriesPaginated.data.map(cat => (
                          <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold text-emerald-700">{cat.name.charAt(0)}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                              <span className="line-clamp-1">{cat.description}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                                  onClick={() => { setEditingCategory(cat); setCategoryDialogOpen(true); }}
                                  data-testid={`button-edit-category-${cat.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                  onClick={() => { setDeletingCategory(cat); setDeleteConfirmOpen(true); }}
                                  data-testid={`button-delete-category-${cat.id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                                  data-testid={`button-upload-image-${cat.id}`}>
                                  <Image className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {categoriesPaginated.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Showing {catStart + 1}–{Math.min(catStart + itemsPerPage, categories.length)} of {categories.length}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCategoriesPage(p => Math.max(p - 1, 1))} disabled={categoriesPage === 1}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setCategoriesPage(p => Math.min(p + 1, totalCatPages))} disabled={categoriesPage === totalCatPages}>Next</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── DATABASE BUILDER ─────────────────────────────────────────── */}
          {activeTab === "database-builder" && <DatabaseBuilderTab />}

          {/* ── PRODUCT TYPE MANAGEMENT ──────────────────────────────────── */}
          {activeTab === "product-types" && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Product Type Management</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage wizard product types linked to each category</p>
              </div>
              <WizardDataTab
                endpoint="/api/wizard/product-types"
                label="Product Types"
                generateEndpoint="/api/admin/wizard/product-types/generate"
                deleteEndpoint="/api/admin/wizard/product-types"
              />
            </div>
          )}

          {/* ── BASE TYPE MANAGEMENT ─────────────────────────────────────── */}
          {activeTab === "base-types" && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Base Type Management</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage formulation base types per wizard category</p>
              </div>
              <WizardDataTab endpoint="/api/wizard/base-types" label="Base Types" />
            </div>
          )}

          {/* ── FEATURE CHIPS ────────────────────────────────────────────── */}
          {activeTab === "feature-chips" && (
            <PlaceholderTab title="Feature Chips" description="Manage feature chips and tags displayed in wizard selections." icon={Tag} />
          )}

          {/* ── FORMULA MANAGEMENT ───────────────────────────────────────── */}
          {activeTab === "formulations" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Formula Management</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Manage, approve, and edit chemical formulations</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="w-44 h-9 text-sm border-gray-200">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Dialog open={formulationDialogOpen} onOpenChange={setFormulationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 h-9" data-testid="button-add-formulation-main">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Formulation
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingFormulation ? "Edit Formulation" : "Create Formulation"}</DialogTitle>
                        <DialogDescription>Fill in all formulation details below</DialogDescription>
                      </DialogHeader>
                      <FormulationForm formulation={editingFormulation} categories={categories || []}
                        onSuccess={() => { setFormulationDialogOpen(false); setEditingFormulation(null); }} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-64">Formulation</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-50">
                        {formulationsPaginated?.data?.map(f => (
                          <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              {(f.thumbnail || f.image) ? (
                                <img src={(f.thumbnail || f.image) ?? undefined} alt={f.imageAlt || f.name}
                                  className="h-12 w-12 rounded-lg object-cover border border-gray-100" />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-100">
                                  <Image className="h-5 w-5 text-gray-300" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 max-w-xs">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2">{f.name}</p>
                              <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{f.description?.substring(0, 55)}…</p>
                            </td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-100">
                                {f.categoryId ? getCategoryName(f.categoryId) : "Custom"}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${f.isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                  {f.isActive ? "Active" : "Draft"}
                                </Badge>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                                  onClick={() => updateFormulationStatus.mutate({ id: f.id, isActive: !f.isActive })}
                                  data-testid={`button-toggle-status-${f.id}`}>
                                  {f.isActive ? <PauseCircle className="h-4 w-4 text-amber-500" /> : <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                </Button>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                <Link href={`/formulation/${f.id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600" data-testid={`button-view-formulation-${f.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                                  onClick={() => { setEditingFormulation(f); setFormulationDialogOpen(true); }}
                                  data-testid={`button-edit-formulation-${f.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                  onClick={() => deleteFormulation.mutate(f.id)}
                                  data-testid={`button-delete-formulation-${f.id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {formulationsPaginated?.pagination && formulationsPaginated.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Page {formulationsPaginated.pagination.currentPage} of {formulationsPaginated.pagination.totalPages}
                        {" "}· {formulationsPaginated.pagination.totalItems} total
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={formulationsPage === 1} onClick={() => setFormulationsPage(p => p - 1)}>Previous</Button>
                        <Button variant="outline" size="sm" disabled={formulationsPage === formulationsPaginated.pagination.totalPages} onClick={() => setFormulationsPage(p => p + 1)}>Next</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── BULK FORMULATIONS ────────────────────────────────────────── */}
          {activeTab === "bulk-formulations" && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Bulk Formulations Generator</h2>
                <p className="text-sm text-gray-500 mt-0.5">Generate multiple formulations for a category automatically</p>
              </div>
              <BulkFormulationGenerator categories={categories || []} />
            </div>
          )}

          {/* ── GENERATED FORMULAS ───────────────────────────────────────── */}
          {activeTab === "generated-formulas" && <GeneratedFormulasTab />}

          {/* ── USER REQUESTS ────────────────────────────────────────────── */}
          {activeTab === "user-requests" && <AdminDashboard />}

          {/* ── TEST AI SYSTEM ───────────────────────────────────────────── */}
          {activeTab === "test-formulation" && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">AI Formulation System Tester</h2>
                <p className="text-sm text-gray-500 mt-0.5">Test the category-specific AI generation pipeline with validation</p>
              </div>
              <FormulationTester />
            </div>
          )}

          {/* ── PROMPT TEMPLATES ─────────────────────────────────────────── */}
          {activeTab === "prompt-templates" && (
            <PlaceholderTab title="Prompt Templates" description="Create and manage AI prompt templates used during formulation generation." icon={FileText} />
          )}

          {/* ── BLOG MANAGEMENT ──────────────────────────────────────────── */}
          {activeTab === "blog" && <BlogManagementTab />}

          {/* ── PAGE CONTENT ─────────────────────────────────────────────── */}
          {activeTab === "formulation-content" && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Formulation Page Content</h2>
                <p className="text-sm text-gray-500 mt-0.5">Customize content displayed on public formulation pages</p>
              </div>
              <FormulationContentManagementTab />
            </div>
          )}

          {/* ── EXPERT CARDS ─────────────────────────────────────────────── */}
          {activeTab === "formulators" && (
            <div className="p-6">
              <FormulatorManagementTab />
            </div>
          )}

          {/* ── OPENAI USAGE ─────────────────────────────────────────────── */}
          {activeTab === "openai-usage" && (
            <div className="p-6">
              <OpenAIUsageTab />
            </div>
          )}

          {/* ── SAFETY & VALIDATION ──────────────────────────────────────── */}
          {activeTab === "safety-validation" && (
            <PlaceholderTab title="Safety & Validation" description="Review formulation safety scores, validation results, and flagged ingredients." icon={ShieldCheck} />
          )}

          {/* ── SETTINGS ─────────────────────────────────────────────────── */}
          {activeTab === "settings" && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Application Settings</h2>
                <p className="text-sm text-gray-500 mt-0.5">Customize appearance, branding, and configuration</p>
              </div>
              <LogoSettings />
            </div>
          )}

          {/* Content management (kept for back-compat, not in sidebar) */}
          {activeTab === "content" && <ContentManagementTab />}

        </main>
      </div>

      {/* ── Delete category dialog ─────────────────────────────────────────── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setDeletingCategory(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingCategory && deleteCategory.mutate(deletingCategory.id)}
              disabled={deleteCategory.isPending} data-testid="button-confirm-delete-category">
              {deleteCategory.isPending ? "Deleting…" : "Delete Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function PlaceholderTab({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm">{description}</p>
      <Badge className="mt-4 bg-amber-50 text-amber-600 border-amber-100 border text-xs">Coming Soon</Badge>
    </div>
  );
}

function WizardDataTab({
  endpoint,
  label,
  generateEndpoint,
  deleteEndpoint,
}: {
  endpoint: string;
  label: string;
  generateEndpoint?: string;
  deleteEndpoint?: string;
}) {
  const { data: mainCategories } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: [endpoint, selectedCatId],
    queryFn: async () => {
      if (!selectedCatId) return [];
      const r = await fetch(`${endpoint}?categoryId=${selectedCatId}`);
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
    enabled: !!selectedCatId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!generateEndpoint || !selectedCatId) throw new Error("Missing config");
      const r = await apiRequest("POST", generateEndpoint, { categoryId: selectedCatId, count: 8 });
      return r.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [endpoint, selectedCatId] });
      toast({
        title: data.inserted > 0 ? `Generated ${data.inserted} ${label.toLowerCase()}` : "Nothing new added",
        description: data.message || `Added ${data.inserted} new entries.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Generation failed", description: err?.message || "Try again later.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!deleteEndpoint) throw new Error("Delete not supported");
      const r = await apiRequest("DELETE", `${deleteEndpoint}/${id}`);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint, selectedCatId] });
      toast({ title: "Deleted", description: `${label.replace(/s$/, "")} removed.` });
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err?.message || "Try again.", variant: "destructive" });
    },
  });

  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedCatId} onValueChange={setSelectedCatId}>
            <SelectTrigger className="w-64 h-9 text-sm border-gray-200">
              <SelectValue placeholder="Select a category…" />
            </SelectTrigger>
            <SelectContent>
              {mainCategories?.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCatId && <span className="text-sm text-gray-500">{items.length} {label.toLowerCase()}</span>}
          {generateEndpoint && selectedCatId && (
            <Button
              size="sm"
              className="ml-auto bg-emerald-600 hover:bg-emerald-700 h-9"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              data-testid="button-generate-product-types"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generateMutation.isPending ? "Generating…" : `Generate ${label}`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!selectedCatId ? (
          <p className="text-sm text-gray-400 py-8 text-center">Select a category to view its {label.toLowerCase()}</p>
        ) : isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            No {label.toLowerCase()} defined for this category yet
            {generateEndpoint ? ` — click "Generate ${label}" above to create some.` : ""}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1 truncate">{item.name}</span>
                {deleteEndpoint && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      if (confirm(`Delete "${item.name}"?`)) deleteMutation.mutate(item.id);
                    }}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-product-type-${item.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Plus, Edit, Trash2, Upload, X, Package, ExternalLink,
  CheckCircle, PauseCircle, Image as ImageIcon, Search,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SampleProduct, InsertSampleProduct } from "@shared/schema";

const EMPTY_FORM: InsertSampleProduct = {
  title: "",
  description: "",
  image: "",
  link: "",
  category: "General",
  isActive: true,
};

async function uploadImageToStorage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `sample-product-${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append("file", new File([file], filename, { type: file.type }));
  formData.append("folder", "sample-products");
  const response = await fetch("/api/uploads/local", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to upload image");
  const { objectPath } = await response.json();
  return objectPath as string;
}

export default function SampleProductsTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState<InsertSampleProduct>(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [search, setSearch]           = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SampleProduct | null>(null);

  /* ── Queries ─────────────────────────────────────────────────────────── */
  const { data: products = [], isLoading } = useQuery<SampleProduct[]>({
    queryKey: ["/api/sample-products"],
    queryFn: async () => {
      const r = await fetch("/api/admin/sample-products");
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
  });

  /* ── Mutations ───────────────────────────────────────────────────────── */
  const saveMutation = useMutation({
    mutationFn: (data: InsertSampleProduct) =>
      editingId
        ? apiRequest("PATCH", `/api/sample-products/${editingId}`, data).then(r => r.json())
        : apiRequest("POST",  "/api/sample-products", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sample-products"] });
      closeDialog();
      toast({ title: editingId ? "Product updated" : "Product created", description: form.title });
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/sample-products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sample-products"] });
      setDeleteTarget(null);
      toast({ title: "Product deleted" });
    },
    onError: (e: any) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/sample-products/${id}`, { isActive }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sample-products"] }),
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setDialogOpen(true);
  }

  function openEdit(p: SampleProduct) {
    setEditingId(p.id);
    setForm({ title: p.title, description: p.description, image: p.image, link: p.link, category: p.category, isActive: p.isActive });
    setImagePreview(p.image || null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5 MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      setImagePreview(URL.createObjectURL(file));
      const objectPath = await uploadImageToStorage(file);
      setForm(f => ({ ...f, image: objectPath }));
      toast({ title: "Image uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setImagePreview(null);
      setForm(f => ({ ...f, image: "" }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage() {
    setImagePreview(null);
    setForm(f => ({ ...f, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    if (!form.description.trim()) { toast({ title: "Description is required", variant: "destructive" }); return; }
    if (!form.image) { toast({ title: "Please upload an image", variant: "destructive" }); return; }
    if (!form.link.trim()) { toast({ title: "Product link is required", variant: "destructive" }); return; }
    saveMutation.mutate(form);
  }

  /* ── Filtered list ───────────────────────────────────────────────────── */
  const filtered = products.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );
  const active   = products.filter(p => p.isActive).length;
  const inactive = products.length - active;

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sample Products</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage the sample product cards shown to users.</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Products", value: products.length, clr: "text-gray-900", bg: "bg-gray-50" },
          { label: "Active",         value: active,          clr: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Inactive",       value: inactive,        clr: "text-gray-500",   bg: "bg-gray-50" },
        ].map(s => (
          <Card key={s.label} className="border-gray-100 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold tabular-nums ${s.clr}`}>{isLoading ? "—" : s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + table */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or category…"
                className="pl-9 h-9 text-sm border-gray-200 bg-gray-50"
              />
            </div>
            {search && (
              <button onClick={() => setSearch("")} className="text-xs text-gray-400 hover:text-gray-700">Clear</button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-400">{search ? "No products match your search" : "No products yet"}</p>
              {!search && (
                <Button onClick={openCreate} variant="outline" size="sm" className="mt-4 gap-1.5">
                  <Plus className="h-4 w-4" />Add your first product
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} alt={p.title}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="h-5 w-5 text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[160px]">{p.title}</p>
                            {p.link && (
                              <a href={p.link} target="_blank" rel="noopener noreferrer"
                                className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5 mt-0.5">
                                <ExternalLink className="h-2.5 w-2.5" />View link
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-gray-500 line-clamp-2 max-w-[220px]">{p.description}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs border-blue-100 bg-blue-50 text-blue-700">{p.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={p.isActive}
                          onCheckedChange={checked => toggleMutation.mutate({ id: p.id, isActive: checked })}
                          disabled={toggleMutation.isPending}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                            onClick={() => openEdit(p)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                            onClick={() => setDeleteTarget(p)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create / Edit dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">

            {/* Title + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <Label htmlFor="sp-title">Product Title <span className="text-red-500">*</span></Label>
                <Input id="sp-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Fabric Softener" />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <Label htmlFor="sp-cat">Category <span className="text-red-500">*</span></Label>
                <Input id="sp-cat" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. General" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="sp-desc">Description <span className="text-red-500">*</span></Label>
              <textarea
                id="sp-desc"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description of the product…"
                rows={3}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            {/* Image upload */}
            <div className="space-y-1">
              <Label>Product Image <span className="text-red-500">*</span></Label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="max-h-36 rounded-lg border border-gray-200 object-contain" />
                  <button type="button" onClick={removeImage}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                    <X className="h-3 w-3" />
                  </button>
                  {uploading && (
                    <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center">
                      <div className="text-xs text-emerald-600 font-medium animate-pulse">Uploading…</div>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg py-8 text-center hover:border-emerald-400 transition-colors disabled:opacity-50">
                  <Upload className="h-7 w-7 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload image or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 5 MB</p>
                </button>
              )}
            </div>

            {/* Link */}
            <div className="space-y-1">
              <Label htmlFor="sp-link">Product Link <span className="text-gray-400 font-normal text-xs">(optional)</span></Label>
              <p className="text-[11px] text-gray-400">Link where users can learn more or purchase this product</p>
              <Input id="sp-link" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://example.com" />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3 py-1">
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
                className="data-[state=checked]:bg-emerald-600"
              />
              <Label className="cursor-pointer">Active — visible to users</Label>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={saveMutation.isPending || uploading}
                className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                {saveMutation.isPending ? "Saving…" : editingId ? "Update Product" : "Add Product"}
              </Button>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm dialog ─────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-1">
            Are you sure you want to delete <span className="font-semibold">"{deleteTarget?.title}"</span>? This action cannot be undone.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="destructive" className="flex-1"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

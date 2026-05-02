import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Upload, Loader2, GripVertical, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import type { Formulator } from "@shared/schema";

// ── Color options ──────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
  { value: "pink",   label: "Pink",   bg: "bg-pink-500",   border: "border-pink-500" },
  { value: "purple", label: "Purple", bg: "bg-purple-700", border: "border-purple-700" },
  { value: "orange", label: "Orange", bg: "bg-orange-500", border: "border-orange-500" },
  { value: "blue",   label: "Blue",   bg: "bg-blue-600",   border: "border-blue-600" },
  { value: "teal",   label: "Teal",   bg: "bg-teal-600",   border: "border-teal-600" },
  { value: "green",  label: "Green",  bg: "bg-green-600",  border: "border-green-600" },
  { value: "indigo", label: "Indigo", bg: "bg-indigo-600", border: "border-indigo-600" },
  { value: "red",    label: "Red",    bg: "bg-red-500",    border: "border-red-500" },
];

function colorBg(color: string) {
  return COLOR_OPTIONS.find((c) => c.value === color)?.bg ?? "bg-gray-500";
}

const EMPTY_FORM = {
  name: "",
  photoUrl: "",
  expertiseName: "",
  color: "pink",
  affiliateLink: "",
  position: 0,
  isActive: true,
};

type FormState = typeof EMPTY_FORM;

// ── Form dialog ────────────────────────────────────────────────────────────────
function FormulatorForm({
  open,
  initial,
  onClose,
  onSave,
  isSaving,
}: {
  open: boolean;
  initial: FormState & { id?: string };
  onClose: () => void;
  onSave: (data: FormState) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [preview, setPreview] = useState(initial.photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => {
      const url = `/objects/uploads/${res.objectPath.split("/").pop()}`;
      setForm((f) => ({ ...f, photoUrl: url }));
      setPreview(url);
    },
    onError: () => toast({ title: "Upload failed", description: "Please try again", variant: "destructive" }),
  });

  // Reset form when dialog opens with new data
  const handleOpen = () => {
    setForm(initial);
    setPreview(initial.photoUrl);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Images only", description: "Please select a JPG, PNG, or WebP file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5 MB", variant: "destructive" });
      return;
    }
    // Optimistic preview
    setPreview(URL.createObjectURL(file));
    await uploadFile(file);
  };

  const set = (field: keyof FormState, value: string | number | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const valid = form.name.trim() && form.photoUrl && form.expertiseName.trim() && form.affiliateLink.trim();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); else handleOpen(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial.id ? "Edit Expert" : "Add Expert"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Dr. Sarah Johnson"
            />
          </div>

          {/* Photo upload */}
          <div className="space-y-1.5">
            <Label>Photo *</Label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs text-center px-1">
                    No photo
                  </div>
                )}
              </div>
              {/* Upload button */}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> Choose Photo</>
                  )}
                </Button>
                <p className="text-xs text-gray-400">JPG, PNG, WebP — max 5 MB</p>
                {/* Or paste URL */}
                <Input
                  value={form.photoUrl}
                  onChange={(e) => { set("photoUrl", e.target.value); setPreview(e.target.value); }}
                  placeholder="Or paste image URL"
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Expertise name */}
          <div className="space-y-1.5">
            <Label>Expertise Label *</Label>
            <Input
              value={form.expertiseName}
              onChange={(e) => set("expertiseName", e.target.value)}
              placeholder="e.g. COSMETIC FORMULATION EXPERT"
            />
            <p className="text-xs text-gray-400">Shown in the card header bar (all caps)</p>
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Card Color *</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set("color", c.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold border-2 transition-all ${c.bg} ${
                    form.color === c.value ? "ring-2 ring-offset-2 ring-gray-900 scale-105" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {/* Live preview of header bar */}
            <div className={`${colorBg(form.color)} text-white text-xs font-bold px-3 py-2 rounded-lg mt-1`}>
              {form.expertiseName.toUpperCase() || "EXPERTISE LABEL PREVIEW"}
            </div>
          </div>

          {/* Affiliate link */}
          <div className="space-y-1.5">
            <Label>Affiliate / CTA Link *</Label>
            <Input
              value={form.affiliateLink}
              onChange={(e) => set("affiliateLink", e.target.value)}
              placeholder="https://www.fiverr.com/…"
              type="url"
            />
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <Label>Display Order</Label>
            <Input
              type="number"
              min={0}
              value={form.position}
              onChange={(e) => set("position", Number(e.target.value))}
            />
            <p className="text-xs text-gray-400">Lower numbers appear first (0, 1, 2…)</p>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => set("isActive", v)}
            />
            <Label>Active (visible on site)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!valid || isSaving || isUploading}>
            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Save Expert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const FORMULATOR_PAGE_SIZE = 10;

function FormulatorPagination({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / FORMULATOR_PAGE_SIZE);
  if (totalPages <= 1) return null;
  const from = (page - 1) * FORMULATOR_PAGE_SIZE + 1;
  const to = Math.min(page * FORMULATOR_PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between pt-4 border-t mt-2">
      <span className="text-sm text-gray-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)} className="h-8 w-8 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "…")[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
            ) : (
              <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => onPage(p as number)} className="h-8 w-8 p-0 text-xs">
                {p}
              </Button>
            )
          )}
        <Button variant="outline" size="sm" disabled={page === Math.ceil(total / FORMULATOR_PAGE_SIZE)} onClick={() => onPage(page + 1)} className="h-8 w-8 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function FormulatorManagementTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Formulator | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Formulator | null>(null);
  const [fPage, setFPage] = useState(1);

  const { data: formulatorsAll = [], isLoading } = useQuery<Formulator[]>({
    queryKey: ["/api/admin/formulators"],
  });

  const formulators = formulatorsAll.slice((fPage - 1) * FORMULATOR_PAGE_SIZE, fPage * FORMULATOR_PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: (data: Omit<Formulator, "id" | "createdAt">) =>
      apiRequest("POST", "/api/admin/formulators", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/formulators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/formulators"] });
      setDialogOpen(false);
      toast({ title: "Expert added" });
    },
    onError: () => toast({ title: "Failed to add expert", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Formulator> & { id: string }) =>
      apiRequest("PATCH", `/api/admin/formulators/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/formulators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/formulators"] });
      setEditTarget(null);
      toast({ title: "Expert updated" });
    },
    onError: () => toast({ title: "Failed to update expert", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/formulators/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/formulators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/formulators"] });
      setDeleteTarget(null);
      toast({ title: "Expert deleted" });
    },
    onError: () => toast({ title: "Failed to delete expert", variant: "destructive" }),
  });

  const handleSaveNew = (data: typeof EMPTY_FORM) => createMutation.mutate(data as any);
  const handleSaveEdit = (data: typeof EMPTY_FORM) => {
    if (editTarget) updateMutation.mutate({ id: editTarget.id, ...data });
  };

  const toggleActive = (f: Formulator) =>
    updateMutation.mutate({ id: f.id, isActive: !f.isActive });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expert Support Cards</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage the experts shown in the "Need Professional Help?" section on every formulation page.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Expert
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading experts…</div>
      ) : formulators.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 mb-3">No experts added yet.</p>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add your first expert
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {formulators.map((f) => (
            <div key={f.id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              {/* Drag handle visual */}
              <GripVertical className="h-5 w-5 text-gray-300 flex-shrink-0" />

              {/* Photo */}
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={f.photoUrl} alt={f.name} className="w-full h-full object-cover object-top" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{f.name}</span>
                  <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full ${colorBg(f.color)}`}>
                    {f.expertiseName}
                  </span>
                  <Badge variant={f.isActive ? "default" : "secondary"} className="text-[10px]">
                    {f.isActive ? "Active" : "Hidden"}
                  </Badge>
                </div>
                <a
                  href={f.affiliateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5 truncate max-w-xs"
                >
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  {f.affiliateLink}
                </a>
              </div>

              {/* Position badge */}
              <span className="text-xs text-gray-400 hidden sm:block">#{f.position}</span>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={f.isActive}
                  onCheckedChange={() => toggleActive(f)}
                  className="scale-90"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditTarget(f)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setDeleteTarget(f)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formulatorsAll.length > 0 && (
        <FormulatorPagination total={formulatorsAll.length} page={fPage} onPage={setFPage} />
      )}

      {/* Add dialog */}
      <FormulatorForm
        open={dialogOpen}
        initial={{ ...EMPTY_FORM, position: formulatorsAll.length }}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveNew}
        isSaving={createMutation.isPending}
      />

      {/* Edit dialog */}
      {editTarget && (
        <FormulatorForm
          open={!!editTarget}
          initial={{
            name: editTarget.name,
            photoUrl: editTarget.photoUrl,
            expertiseName: editTarget.expertiseName,
            color: editTarget.color,
            affiliateLink: editTarget.affiliateLink,
            position: editTarget.position,
            isActive: editTarget.isActive,
            id: editTarget.id,
          }}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
          isSaving={updateMutation.isPending}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expert?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong> from the expert support section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

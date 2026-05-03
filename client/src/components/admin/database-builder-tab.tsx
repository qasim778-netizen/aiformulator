import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Sparkles, Wand2, Trash2, Edit, Check, X, Plus, RefreshCw,
  Package, Layers, Tag, ShieldCheck, FileText, Eye,
} from "lucide-react";

type StringList = string[];

interface Preview {
  productTypes: StringList;
  baseTypes: StringList;
  featureChips: StringList;
  safetyNotes: StringList;
  promptRules: StringList;
}

const EMPTY_PREVIEW: Preview = {
  productTypes: [], baseTypes: [], featureChips: [], safetyNotes: [], promptRules: [],
};

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  counts: {
    productTypes: number;
    baseTypes: number;
    featureChips: number;
    safetyNotes: number;
    promptRules: number;
  };
}

const GROUPS: Array<{
  key: keyof Preview;
  label: string;
  example: string;
  icon: any;
  color: string;
}> = [
  { key: "productTypes", label: "Product Types", example: "e.g. Kitchen Cleaner, Glass Cleaner", icon: Package, color: "emerald" },
  { key: "baseTypes",    label: "Base Types",    example: "e.g. Liquid, Powder, Gel",            icon: Layers,  color: "blue" },
  { key: "featureChips", label: "Feature Chips", example: "e.g. Antibacterial, Eco-Friendly",    icon: Tag,     color: "amber" },
  { key: "safetyNotes",  label: "Safety Notes",  example: "e.g. Skin Safe, Non-Toxic",           icon: ShieldCheck, color: "rose" },
  { key: "promptRules",  label: "Prompt Rules",  example: "e.g. Important instructions for AI",  icon: FileText, color: "violet" },
];

export default function DatabaseBuilderTab() {
  const { toast } = useToast();

  const [mode, setMode] = useState<"new" | "expand">("new");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [generateOpts, setGenerateOpts] = useState({
    productTypes: true, baseTypes: true, featureChips: true, safetyNotes: true, promptRules: true,
  });
  const [preview, setPreview] = useState<Preview>(EMPTY_PREVIEW);
  const [hasPreview, setHasPreview] = useState(false);
  const [editing, setEditing] = useState<{ key: keyof Preview; idx: number } | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<CategoryRow[] | null>({
    queryKey: ["/api/admin/database-builder/categories"],
  });
  const categories: CategoryRow[] = Array.isArray(categoriesData) ? categoriesData : [];

  const previewMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/database-builder/preview", {
        categoryName: mode === "expand" ? selectedName() : categoryName,
        categoryDescription,
        generate: generateOpts,
      });
      return r.json();
    },
    onSuccess: (data: Preview) => {
      setPreview({
        productTypes: data.productTypes || [],
        baseTypes: data.baseTypes || [],
        featureChips: data.featureChips || [],
        safetyNotes: data.safetyNotes || [],
        promptRules: data.promptRules || [],
      });
      setHasPreview(true);
      toast({ title: "AI suggestions ready", description: "Review and edit before saving." });
    },
    onError: (err: any) => toast({ title: "Generation failed", description: err?.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async (resetAfter: boolean) => {
      const r = await apiRequest("POST", "/api/admin/database-builder/save", {
        categoryId: mode === "expand" ? selectedCategoryId : undefined,
        categoryName: mode === "new" ? categoryName : undefined,
        categoryDescription,
        ...preview,
      });
      const data = await r.json();
      return { data, resetAfter };
    },
    onSuccess: ({ data, resetAfter }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/database-builder/categories"] });
      const total = Object.values(data.inserted as Record<string, number>).reduce((a, b) => a + b, 0);
      toast({ title: "Saved to database", description: `Added ${total} new entries to "${data.category.name}".` });
      if (resetAfter) discard();
    },
    onError: (err: any) => toast({ title: "Save failed", description: err?.message, variant: "destructive" }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/admin/database-builder/categories/${id}`);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/database-builder/categories"] });
      toast({ title: "Category deleted" });
    },
    onError: (err: any) => toast({ title: "Delete failed", description: err?.message, variant: "destructive" }),
  });

  const selectedName = () => categories.find(c => c.id === selectedCategoryId)?.name || "";

  const discard = () => {
    setPreview(EMPTY_PREVIEW);
    setHasPreview(false);
    setEditing(null);
    if (mode === "new") {
      setCategoryName("");
      setCategoryDescription("");
    }
  };

  const removeItem = (key: keyof Preview, idx: number) => {
    setPreview(p => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));
  };
  const startEdit = (key: keyof Preview, idx: number) => {
    setEditing({ key, idx });
    setEditValue(preview[key][idx]);
  };
  const commitEdit = () => {
    if (!editing) return;
    setPreview(p => ({
      ...p,
      [editing.key]: p[editing.key].map((v, i) => (i === editing.idx ? editValue.trim() : v)).filter(Boolean),
    }));
    setEditing(null);
    setEditValue("");
  };
  const addItem = (key: keyof Preview) => {
    setPreview(p => ({ ...p, [key]: [...p[key], "New entry"] }));
    setEditing({ key, idx: preview[key].length });
    setEditValue("New entry");
  };

  const canGenerate =
    (mode === "new" ? categoryName.trim().length >= 2 : !!selectedCategoryId) &&
    Object.values(generateOpts).some(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-emerald-600" /> Database Builder
          </h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage categories, product types, base types, and features for your platform.</p>
        </div>
        <Button
          onClick={() => { setMode("new"); setSelectedCategoryId(""); setCategoryName(""); setCategoryDescription(""); discard(); }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Add New Category
        </Button>
      </div>

      {/* Top configuration grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Create / Expand Category */}
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">1. Create / Expand Category</h3>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => { setMode("new"); setSelectedCategoryId(""); }}
                className={`flex-1 py-1.5 rounded-md border ${mode === "new" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200"}`}
              >Create new</button>
              <button
                onClick={() => setMode("expand")}
                className={`flex-1 py-1.5 rounded-md border ${mode === "expand" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200"}`}
              >Expand existing</button>
            </div>

            {mode === "expand" ? (
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Select a category…" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label className="text-xs">Category Name <span className="text-red-500">*</span></Label>
                <Input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Cleaning Products"
                  className="h-9 text-sm mt-1" data-testid="input-db-category-name" />
              </div>
            )}

            <div>
              <Label className="text-xs">Category Description <span className="text-gray-400">(Optional)</span></Label>
              <Textarea
                value={categoryDescription}
                onChange={e => setCategoryDescription(e.target.value.slice(0, 200))}
                placeholder="All types of home, industrial and commercial cleaning products."
                className="text-sm mt-1 resize-none"
                rows={4}
              />
              <p className="text-[11px] text-gray-400 text-right mt-1">{categoryDescription.length}/200</p>
            </div>
          </CardContent>
        </Card>

        {/* 2. What do you want AI to generate */}
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">2. What do you want AI to generate?</h3>
            {GROUPS.map(g => (
              <label key={g.key} className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={generateOpts[g.key]}
                  onCheckedChange={v => setGenerateOpts(o => ({ ...o, [g.key]: !!v }))}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                    <g.icon className="h-3.5 w-3.5 text-gray-400" />{g.label}
                  </p>
                  <p className="text-xs text-gray-400">{g.example}</p>
                </div>
              </label>
            ))}
            <Button
              onClick={() => previewMutation.mutate()}
              disabled={!canGenerate || previewMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
              data-testid="button-generate-with-ai"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {previewMutation.isPending ? "Generating with AI…" : "Generate with AI"}
            </Button>
          </CardContent>
        </Card>

        {/* 3. How AI Generation Works */}
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" /> How AI Generation Works
            </h3>
            <ol className="mt-3 space-y-2.5 text-sm text-gray-600">
              {[
                "You provide a category name",
                "AI generates structured suggestions",
                "You review and edit the data",
                "Save to database",
              ].map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-sm">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 leading-relaxed">
              AI helps you build a complete and consistent database in seconds.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions Preview */}
      {hasPreview && (
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                3. AI Suggestions Preview
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">AI Generated</span>
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}>
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${previewMutation.isPending ? "animate-spin" : ""}`} /> Regenerate
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {GROUPS.map(g => (
                <div key={g.key} className="flex flex-col">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg bg-${g.color}-50 border border-${g.color}-100 border-b-0`}>
                    <p className={`text-xs font-semibold text-${g.color}-700 flex items-center gap-1.5`}>
                      <g.icon className="h-3.5 w-3.5" /> {g.label} ({preview[g.key].length})
                    </p>
                  </div>
                  <div className="flex-1 border border-gray-100 rounded-b-lg p-2 space-y-1.5 bg-white min-h-[200px]">
                    {preview[g.key].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 rounded text-xs group">
                        {editing && editing.key === g.key && editing.idx === idx ? (
                          <>
                            <Input
                              value={editValue}
                              autoFocus
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }}
                              className="h-7 text-xs flex-1"
                            />
                            <button onClick={commitEdit} className="text-emerald-600 hover:text-emerald-700"><Check className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 truncate text-gray-700" title={item}>{item}</span>
                            <button onClick={() => startEdit(g.key, idx)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity">
                              <Edit className="h-3 w-3" />
                            </button>
                            <button onClick={() => removeItem(g.key, idx)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addItem(g.key)}
                      className="w-full text-xs text-gray-400 hover:text-emerald-600 py-1.5 border border-dashed border-gray-200 hover:border-emerald-300 rounded transition-colors"
                    >+ Add</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={discard}>Discard</Button>
              <Button
                onClick={() => saveMutation.mutate(false)}
                disabled={saveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="button-save-to-database"
              >
                {saveMutation.isPending ? "Saving…" : "Save to Database"}
              </Button>
              <Button
                variant="outline"
                onClick={() => saveMutation.mutate(true)}
                disabled={saveMutation.isPending}
              >Save & Add Another</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Categories */}
      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-0">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Existing Categories</h3>
            <p className="text-xs text-gray-500 mt-0.5">Manage all your wizard categories and their data</p>
          </div>
          {categoriesLoading ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />)}
            </div>
          ) : categories.length === 0 ? (
            <p className="p-8 text-sm text-gray-400 text-center">No categories yet — create one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category Name</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Product Types</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Base Types</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Features</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Safety</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rules</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categories.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.slug}</p>
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-gray-700">{c.counts.productTypes}</td>
                      <td className="px-3 py-3 text-center text-sm text-gray-700">{c.counts.baseTypes}</td>
                      <td className="px-3 py-3 text-center text-sm text-gray-700">{c.counts.featureChips}</td>
                      <td className="px-3 py-3 text-center text-sm text-gray-700">{c.counts.safetyNotes}</td>
                      <td className="px-3 py-3 text-center text-sm text-gray-700">{c.counts.promptRules}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                            onClick={() => { setMode("expand"); setSelectedCategoryId(c.id); discard(); }}
                            title="Expand this category"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                            onClick={() => { if (confirm(`Delete "${c.name}" and all its data?`)) deleteCategory.mutate(c.id); }}
                            title="Delete category"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
}

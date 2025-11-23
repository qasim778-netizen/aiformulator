import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Edit2, Plus, Upload, X } from 'lucide-react'
import { queryClient, apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import type { SampleProduct, InsertSampleProduct } from '@shared/schema'

export default function AdminProducts() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<InsertSampleProduct>({
    title: '',
    description: '',
    image: '',
    link: '',
    category: 'General',
    isActive: true,
  })

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/sample-products'],
    queryFn: async () => {
      const response = await fetch('/api/sample-products')
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json() as Promise<SampleProduct[]>
    },
  })

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: InsertSampleProduct) => {
      if (editingId) {
        return apiRequest('PATCH', `/api/sample-products/${editingId}`, data)
      } else {
        return apiRequest('POST', '/api/sample-products', data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sample-products'] })
      resetForm()
      toast({
        title: 'Success',
        description: editingId ? 'Product updated successfully' : 'Product created successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save product',
        variant: 'destructive',
      })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/sample-products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sample-products'] })
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setEditingId(null)
    setImagePreview(null)
    setFormData({
      title: '',
      description: '',
      image: '',
      link: '',
      category: 'General',
      isActive: true,
    })
  }

  const handleEdit = (product: SampleProduct) => {
    setEditingId(product.id)
    setImagePreview(product.image)
    setFormData({
      title: product.title,
      description: product.description,
      image: product.image,
      link: product.link,
      category: product.category,
      isActive: product.isActive,
    })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setFormData({ ...formData, image: result })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process image',
        variant: 'destructive',
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description || !formData.image || !formData.link) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields including an image',
        variant: 'destructive',
      })
      return
    }
    saveMutation.mutate(formData)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Manage Sample Products</h1>

        {/* Form Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Product' : 'Add New Product'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Product Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="input-product-title"
                />
                <Input
                  placeholder="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  data-testid="input-category"
                />
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-1 md:col-span-2 border rounded px-3 py-2 min-h-20"
                  required
                  data-testid="textarea-description"
                />
                
                {/* Image Upload Section */}
                <div className="col-span-1 md:col-span-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Product Image</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      data-testid="input-image-file"
                    />
                    
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-xs h-auto max-h-48 object-contain rounded border border-gray-300"
                          data-testid="img-preview"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null)
                            setFormData({ ...formData, image: '' })
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600"
                          data-testid="button-remove-image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-full border-2 border-dashed border-gray-300 rounded py-8 text-center hover:border-blue-500 transition-colors disabled:opacity-50"
                        data-testid="button-upload-image"
                      >
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600">Click to upload image or drag and drop</p>
                        <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                      </button>
                    )}
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Link (optional)</label>
                  <p className="text-xs text-gray-500 mb-2">Link where users can learn more or purchase this product</p>
                  <Input
                    placeholder="https://example.com"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    required
                    data-testid="input-link"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={saveMutation.isPending || uploadingImage}
                  data-testid="button-submit-product"
                >
                  {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel">
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Products List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow" data-testid={`card-product-${product.id}`}>
              <CardHeader>
                <CardTitle className="text-lg">{product.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-32 object-cover rounded"
                    data-testid={`img-product-${product.id}`}
                  />
                )}
                <p className="text-sm text-gray-600">{product.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{product.category}</span>
                  <span className={product.isActive ? 'text-green-600' : 'text-red-600'} data-testid={`status-${product.id}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                    className="flex-1"
                    data-testid={`button-edit-${product.id}`}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(product.id)}
                    className="flex-1"
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${product.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Plus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No products yet. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}

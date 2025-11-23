import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Edit2, Plus } from 'lucide-react'
import { queryClient, apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import type { SampleProduct, InsertSampleProduct } from '@shared/schema'

export default function AdminProducts() {
  const { toast } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
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
    setFormData({
      title: product.title,
      description: product.description,
      image: product.image,
      link: product.link,
      category: product.category,
      isActive: product.isActive,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
                />
                <Input
                  placeholder="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-1 md:col-span-2 border rounded px-3 py-2 min-h-20"
                  required
                />
                <Input
                  placeholder="Image URL"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  required
                />
                <Input
                  placeholder="Link/URL"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
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
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{product.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-32 object-cover rounded"
                  />
                )}
                <p className="text-sm text-gray-600">{product.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{product.category}</span>
                  <span className={product.isActive ? 'text-green-600' : 'text-red-600'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                    className="flex-1"
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

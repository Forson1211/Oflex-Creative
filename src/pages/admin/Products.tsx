import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

const categories = ['Prompts', 'Templates', 'Branding', 'UI Kits', 'Mockups'];

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    file_url: '',
    template_link: '',
    is_active: true,
  });
  const { toast } = useToast();
  
  const { uploadImage, isUploading } = useImageUpload({
    bucket: 'product-images',
    onSuccess: (url) => setFormData((prev) => ({ ...prev, image_url: url })),
  });

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch products',
        variant: 'destructive',
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      file_url: '',
      template_link: '',
      is_active: true,
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      image_url: product.image_url || '',
      file_url: product.file_url || '',
      template_link: product.template_link || '',
      is_active: product.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      fetchProducts();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      title: formData.title,
      description: formData.description || null,
      price: parseFloat(formData.price),
      category: formData.category,
      image_url: formData.image_url || null,
      file_url: formData.file_url || null,
      template_link: formData.template_link || null,
      is_active: formData.is_active,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update product',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from('products').insert([productData]);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create product',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Product created successfully',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchProducts();
      }
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Products</h1>
              <p className="text-muted-foreground">Manage your digital products</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Product Image</Label>
                    <ImageUpload
                      value={formData.image_url}
                      onChange={(url) => setFormData({ ...formData, image_url: url })}
                      onUpload={uploadImage}
                      isUploading={isUploading}
                      aspectRatio="video"
                    />
                    <p className="text-xs text-muted-foreground">Or enter URL manually:</p>
                    <Input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file_url">File URL (Download Link)</Label>
                    <Input
                      id="file_url"
                      type="url"
                      value={formData.file_url}
                      onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template_link">Canva Template Link</Label>
                    <Input
                      id="template_link"
                      type="url"
                      value={formData.template_link}
                      onChange={(e) => setFormData({ ...formData, template_link: e.target.value })}
                      placeholder="https://www.canva.com/design/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Canva template URL that buyers can access after purchase
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="is_active">Active (visible in store)</Label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingProduct ? 'Update' : 'Create'} Product
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>

          {loading ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 border-b border-border last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-48 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 font-medium text-foreground">Product</th>
                      <th className="text-left p-4 font-medium text-foreground">Category</th>
                      <th className="text-left p-4 font-medium text-foreground">Price</th>
                      <th className="text-left p-4 font-medium text-foreground">Status</th>
                      <th className="text-right p-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-border last:border-0">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground">{product.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-accent text-accent-foreground">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-foreground">
                          ${Number(product.price).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              product.is_active
                                ? 'bg-chart-3/20 text-chart-3'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(product)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Products;

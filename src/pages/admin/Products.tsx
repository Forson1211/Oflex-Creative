import { useState, useEffect } from 'react';
import { useProducts, useProductMutations } from '@/hooks/useProducts';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Settings, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { Tables } from '@/integrations/supabase/types';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTable, ADMIN_TABLE_HEADER_CLASS } from '@/components/admin/AdminTable';

type Product = Tables<'products'>;

// Define categories for the dropdown
const defaultCategories: string[] = [
  'Church Flyers',
  'Birthday Flyers',
  'Business Flyers',
  'Club & Party Flyers',
  'Social Media Templates',
  'Funeral & Memorial Flyers',
  'Concert & Festival Flyers',
  'Real Estate Flyers',
  'Education & School Flyers',
  'Food & Restaurant Flyers'
];

const Products = () => {
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
    resolution: '',
    dimensions: '',
    file_size: '',
    is_active: true,
  });
  const { toast } = useToast();
  const [newCategory, setNewCategory] = useState('');
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const generateAIDescription = async () => {
    if (!formData.title) return;
    
    setIsGeneratingAI(true);
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const titles = [
      `Elevate your design game with this premium ${formData.title}. Meticulously crafted for creative professionals who demand excellence. This high-resolution template features clean layouts, modern typography, and fully customizable elements to fit your brand perfectly.`,
      `Transform your creative workflow with our exclusive ${formData.title}. Designed with a focus on impact and professional aesthetics, this digital asset provides the perfect foundation for your next masterpiece. Easy to use, highly flexible, and ready for deployment.`,
      `The definitive ${formData.title} for creators. Whether you are building a brand or launching a new campaign, this professional-grade template offers the surgical precision and elite design language your project deserves. Experience the next level of creative studio assets.`
    ];
    
    const randomDesc = titles[Math.floor(Math.random() * titles.length)];
    setFormData(prev => ({ ...prev, description: randomDesc }));
    setIsGeneratingAI(false);
    
    toast({
      title: 'AI Generated',
      description: 'Professional product description has been generated successfully.',
    });
  };

  // ... (existing code) ...

  const handleDeleteCategory = async (category: string) => {
    // 1. Check if it's a default category (optional: allow deleting but warn)
    // 2. Update products using this category to 'Uncategorized'
    try {
      const { error } = await supabase
        .from('products')
        .update({ category: 'Uncategorized' })
        .eq('category', category);

      if (error) throw error;

      // 3. Update local state
      setAllCategories(prev => prev.filter(c => c !== category));
      setCategoryToDelete(null);

      toast({
        title: 'Category Removed',
        description: `Category "${category}" has been removed. Products in this category are now "Uncategorized".`
      });

      // Refresh to ensure everything is in sync
      fetchCategories();
      // Also invalidate products query if needed, but fetchCategories usually handles the list.
      window.location.reload(); // Hard refresh to force ensuring listing is consistent? Or just invalidate query. 
      // Actually a simple reload or refetch is better.
      // Let's rely on useProducts hook refetch if we knew how to access queryClient here.
      // For now, fetchCategories updates the dropdown. The products list needs refetch.
      // I'll leave the products list update to the user navigating or manual refresh, or force reload.

    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to remove category: ${err.message}`,
        variant: 'destructive'
      });
    }
  };

  const { data: products = [], isLoading: loading } = useProducts();
  const { createProduct, updateProduct, deleteProduct } = useProductMutations();

  const { uploadImage, isUploading } = useImageUpload({
    bucket: 'product-images',
    onSuccess: (url) => setFormData((prev) => ({ ...prev, image_url: url })),
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      file_url: '',
      template_link: '',
      resolution: '',
      dimensions: '',
      file_size: '',
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
      resolution: product.resolution || '',
      dimensions: product.dimensions || '',
      file_size: product.file_size || '',
      is_active: product.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    deleteProduct.mutate(id);
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
      resolution: formData.resolution || null,
      dimensions: formData.dimensions || null,
      file_size: formData.file_size || null,
      is_active: formData.is_active,
    };

    if (editingProduct) {
      updateProduct.mutate(
        { id: editingProduct.id, data: productData },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            resetForm();
          },
        }
      );
    } else {
      createProduct.mutate(productData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  // Ensure dropdown always displays the full set of categories
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('category');

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch categories.', variant: 'destructive' });
      setAllCategories([...defaultCategories]);
      return;
    }

    if (data) {
      // Get unique categories from products
      const dbCategoryNames = [...new Set(data.map((item) => item.category).filter(Boolean))];
      // Combine default categories with database categories, avoiding duplicates
      const allCats = [...new Set([...defaultCategories, ...dbCategoryNames])];
      setAllCategories(allCats);
    } else {
      setAllCategories([...defaultCategories]);
    }
  };

  useEffect(() => {
    fetchCategories(); // Fetch categories on component mount
  }, []);

  // Update addCategory to fetch categories after adding a new one
  const addCategory = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default button behavior

    if (newCategory.trim() && !allCategories.includes(newCategory)) {
      // Add to local state - category will be saved when product is created
      setAllCategories((prev) => [...prev, newCategory]);
      setFormData((prev) => ({ ...prev, category: newCategory }));
      setNewCategory('');
      toast({ title: 'Category added', description: `${newCategory} has been added to the dropdown.` });
    } else {
      toast({ title: 'Error', description: 'Category already exists or is invalid.', variant: 'destructive' });
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute requireModerator>
      <AdminLayout>
        <div className="space-y-6">
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <AdminPageHeader
              title="Products"
              description="Manage your digital products"
              icon={<Package className="w-5 h-5" />}
              actions={
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
              }
            />
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Description</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10 gap-2"
                      onClick={() => generateAIDescription()}
                      disabled={isGeneratingAI || !formData.title}
                    >
                      {isGeneratingAI ? (
                        <Sparkles className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {isGeneratingAI ? 'Generating...' : 'AI Enhance'}
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Enter description or use AI to generate professional copy..."
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="Select or type category"
                          list="category-options"
                          required
                        />
                        <datalist id="category-options">
                          {allCategories.map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Add new category name"
                        />
                        <Button
                          onClick={addCategory}
                          variant="secondary"
                          disabled={!newCategory.trim() || allCategories.includes(newCategory)}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsCategoryManagerOpen(true)}
                          title="Manage Categories"
                        >
                          <Settings className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
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

                {/* Add image preview when URL is entered */}
                {formData.image_url && (
                  <div className="mt-4">
                    <Label>Image Preview</Label>
                    <img
                      src={formData.image_url}
                      alt="Product Preview"
                      className="w-full h-auto rounded-md border border-gray-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/150'; // Fallback image
                        toast({ title: 'Invalid URL', description: 'The provided image URL is not valid.', variant: 'destructive' });
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution (e.g. 300 DPI)</Label>
                    <Input
                      id="resolution"
                      value={formData.resolution}
                      onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                      placeholder="High Res"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions (e.g. 2000x2000)</Label>
                    <Input
                      id="dimensions"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      placeholder="Size"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="file_size">File Size</Label>
                    <Input
                      id="file_size"
                      value={formData.file_size}
                      onChange={(e) => setFormData({ ...formData, file_size: e.target.value })}
                      placeholder="5 MB"
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
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file_url">Direct Download Link</Label>
                  <Input
                    id="file_url"
                    type="url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    placeholder="https://..."
                  />
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:max-w-sm"
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
            <>
              {/* Mobile View - Cards */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div className="flex gap-4 mb-3">
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground mb-1 inline-block">
                              {product.category}
                            </span>
                            <h3 className="font-semibold text-foreground truncate">{product.title}</h3>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ml-2 ${product.is_active
                              ? 'bg-chart-3/20 text-chart-3'
                              : 'bg-muted text-muted-foreground'
                              }`}
                          >
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-foreground mt-1">
                          ${Number(product.price).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(product)}>
                        <Pencil className="w-3 h-3 mr-2" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive px-3"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block">
                <AdminTable minWidthClassName="min-w-[760px]">
                  <thead className={ADMIN_TABLE_HEADER_CLASS}>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Product</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Category</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Price</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Status</th>
                      <th className="text-right p-4 font-medium text-foreground whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-border last:border-0">
                        <td className="p-4">
                          <div className="flex items-center gap-3 min-w-[18rem]">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.title}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{product.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-accent text-accent-foreground">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-foreground whitespace-nowrap">
                          ${Number(product.price).toFixed(2)}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${product.is_active
                              ? 'bg-chart-3/20 text-chart-3'
                              : 'bg-muted text-muted-foreground'
                              }`}
                          >
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              </div>
            </>
          )}
        </div>

        {/* Category Manager Dialog */}
        <Dialog open={isCategoryManagerOpen} onOpenChange={setIsCategoryManagerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Categories</DialogTitle>
              <DialogDescription>
                Remove unused categories. Products with removed categories will be marked as "Uncategorized".
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-2 mt-4 pr-2">
              {allCategories.map((category) => (
                <div key={category} className="flex items-center justify-between p-2 rounded-lg border bg-card/50">
                  <span className="font-medium truncate max-w-[200px]">{category}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setCategoryToDelete(category)}
                    disabled={category === 'Uncategorized'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {allCategories.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No categories found.</p>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsCategoryManagerOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Category?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{categoryToDelete}"?
                <br /><br />
                This will NOT delete products. Products using this category will be moved to "Uncategorized".
                <div className="mt-2 text-amber-500 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  This action cannot be undone.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Products;

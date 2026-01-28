import { useState } from 'react';
import { useFAQs, useFAQMutations } from '@/hooks/useFAQs';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Loader2, HelpCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableContainer, ADMIN_TABLE_HEADER_CLASS } from '@/components/admin/AdminTable';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

const FAQs = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    display_order: 0,
    is_active: true,
  });

  const { data: faqs = [], isLoading } = useFAQs();
  const { createFAQ, updateFAQ, deleteFAQ } = useFAQMutations();

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingFAQ(null);
    setFormData({
      question: '',
      answer: '',
      display_order: 0,
      is_active: true,
    });
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order,
      is_active: faq.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFAQ) {
      updateFAQ.mutate(
        { id: editingFAQ.id, data: formData },
        { onSuccess: () => resetForm() }
      );
    } else {
      createFAQ.mutate(formData, { onSuccess: () => resetForm() });
    }
  };


  return (
    <ProtectedRoute requireModerator>
      <AdminLayout>
        <div className="space-y-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AdminPageHeader
              title="FAQs"
              description="Manage frequently asked questions"
              icon={<HelpCircle className="w-5 h-5" />}
              actions={
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add FAQ
                  </Button>
                </DialogTrigger>
              }
            />
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    placeholder="What is your question?"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">Answer</Label>
                  <Textarea
                    id="answer"
                    value={formData.answer}
                    onChange={(e) =>
                      setFormData({ ...formData, answer: e.target.value })
                    }
                    placeholder="Enter the answer..."
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          display_order: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editingFAQ ? updateFAQ.isPending : createFAQ.isPending}>
                    {(editingFAQ ? updateFAQ.isPending : createFAQ.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingFAQ ? 'Update FAQ' : 'Add FAQ'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No FAQs yet</h3>
              <p className="text-muted-foreground mb-4">Add your first FAQ to help your visitors.</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="grid grid-cols-1 gap-6 md:hidden">
                {faqs.map((faq) => (
                  <div key={faq.id} className="group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {faq.display_order}
                          </span>
                          <h3 className="font-semibold text-lg text-foreground line-clamp-2">{faq.question}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 bg-muted/30 p-3 rounded-lg">{faq.answer}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${faq.is_active
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                          }`}
                      >
                        {faq.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(faq)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteFAQ.mutate(faq.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block">
                <AdminTableContainer>
                  <Table className="min-w-[900px]">
                    <TableHeader className={ADMIN_TABLE_HEADER_CLASS}>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Order</TableHead>
                        <TableHead className="w-[40%]">Question</TableHead>
                        <TableHead className="w-[35%]">Answer</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faqs.map((faq) => (
                        <TableRow key={faq.id}>
                          <TableCell className="whitespace-nowrap">{faq.display_order}</TableCell>
                          <TableCell className="font-medium min-w-[18rem]">{faq.question}</TableCell>
                          <TableCell className="text-muted-foreground min-w-[18rem]">
                            <div className="line-clamp-2">{faq.answer}</div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${faq.is_active
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                                }`}
                            >
                              {faq.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(faq)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteFAQ.mutate(faq.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AdminTableContainer>
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default FAQs;

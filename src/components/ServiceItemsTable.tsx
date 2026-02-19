import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ServiceItem } from '@/types/bill';

interface ServiceItemsTableProps {
  items: ServiceItem[];
  onChange: (items: ServiceItem[]) => void;
}

export function ServiceItemsTable({ items, onChange }: ServiceItemsTableProps) {
  const addItem = () => {
    const newItem: ServiceItem = {
      sno: items.length + 1,
      description: '',
      hsnCode: '87141090',
      quantity: 1,
      rate: 0,
      gst: 0,
      amount: 0,
    };
    onChange([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof ServiceItem, value: string | number) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      if (field === 'quantity' || field === 'rate') {
        const qty = field === 'quantity' ? Number(value) : item.quantity;
        const rate = field === 'rate' ? Number(value) : item.rate;
        updatedItem.amount = qty * rate;
      }
      
      return updatedItem;
    });
    onChange(updated);
  };

  const removeItem = (index: number) => {
    const updated = items
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, sno: i + 1 }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-2 py-3 text-left text-sm font-semibold w-12">S.No</th>
              <th className="px-2 py-3 text-left text-sm font-semibold">Item Description</th>
              <th className="px-2 py-3 text-center text-sm font-semibold w-24">HSN Code</th>
              <th className="px-2 py-3 text-center text-sm font-semibold w-16">Qty</th>
              <th className="px-2 py-3 text-right text-sm font-semibold w-24">Price (₹)</th>
              <th className="px-2 py-3 text-center text-sm font-semibold w-16">GST %</th>
              <th className="px-2 py-3 text-right text-sm font-semibold w-24">Amount (₹)</th>
              <th className="px-2 py-3 text-center text-sm font-semibold w-12">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No items added. Click "Add Item" to begin.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/50">
                  <td className="px-2 py-2 text-center font-medium">{item.sno}</td>
                  <td className="px-2 py-2">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Enter item description"
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={item.hsnCode}
                      onChange={(e) => updateItem(index, 'hsnCode', e.target.value)}
                      placeholder="HSN Code"
                      className="text-center border-0 bg-transparent p-0 h-auto focus-visible:ring-0 w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      className="text-center border-0 bg-transparent p-0 h-auto focus-visible:ring-0 w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                      className="text-right border-0 bg-transparent p-0 h-auto focus-visible:ring-0 w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.gst}
                      onChange={(e) => updateItem(index, 'gst', Number(e.target.value))}
                      className="text-center border-0 bg-transparent p-0 h-auto focus-visible:ring-0 w-full"
                    />
                  </td>
                  <td className="px-2 py-2 text-right font-medium">
                    ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <Button type="button" variant="outline" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
}

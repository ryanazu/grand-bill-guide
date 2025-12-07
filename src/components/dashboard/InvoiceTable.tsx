import { Eye, MoreHorizontal } from 'lucide-react';
import { Invoice } from '@/types/invoice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface InvoiceTableProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
}

const statusVariants: Record<Invoice['status'], 'success' | 'pending' | 'destructive' | 'secondary'> = {
  paid: 'success',
  pending: 'pending',
  overdue: 'destructive',
  cancelled: 'secondary',
};

const statusLabels: Record<Invoice['status'], string> = {
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export function InvoiceTable({ invoices, onViewInvoice }: InvoiceTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Invoice #</TableHead>
            <TableHead className="font-semibold">Hotel</TableHead>
            <TableHead className="font-semibold">Room</TableHead>
            <TableHead className="font-semibold">Guests</TableHead>
            <TableHead className="font-semibold">Check-in</TableHead>
            <TableHead className="font-semibold">Amount</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice, index) => (
            <TableRow 
              key={invoice.id} 
              className="group cursor-pointer transition-colors hover:bg-muted/30"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TableCell className="font-medium text-foreground">
                {invoice.invoiceNumber}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">{invoice.hotelName}</p>
                  <p className="text-xs text-muted-foreground">{invoice.hotelId}</p>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{invoice.roomNumber}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">{invoice.guests[0]?.name}</p>
                  {invoice.numberOfGuests > 1 && (
                    <p className="text-xs text-muted-foreground">+{invoice.numberOfGuests - 1} more</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(invoice.checkInDate), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell className="font-semibold text-foreground">
                ${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariants[invoice.status]}>
                  {statusLabels[invoice.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onViewInvoice(invoice)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

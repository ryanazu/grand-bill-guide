import { Eye, MoreHorizontal } from 'lucide-react';
import { Invoice, InvoiceFlag } from '@/types/invoice';
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
import { getStateLabel } from '@/constants/usStates';

interface InvoiceTableProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
}

const statusVariants: Record<Invoice['status'], 'success' | 'pending' | 'destructive'> = {
  paid: 'success',
  pending: 'pending',
  overdue: 'destructive',
};

const statusLabels: Record<Invoice['status'], string> = {
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue',
};

const flagVariants: Record<InvoiceFlag, { label: string; variant: 'destructive' | 'warning' | 'info' }> = {
  DUPLICATE_SUSPECTED: { label: 'Duplicate Suspected', variant: 'warning' },
  OFFSETS_PRESENT: { label: 'Offsets Present', variant: 'info' },
  OVER_MAX_NIGHTLY_RATE: { label: 'Over Max Rate', variant: 'destructive' },
};

export function InvoiceTable({ invoices, onViewInvoice }: InvoiceTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Invoice #</TableHead>
            <TableHead className="font-semibold">Hotel</TableHead>
            <TableHead className="font-semibold">Disaster</TableHead>
            <TableHead className="font-semibold">State</TableHead>
            <TableHead className="font-semibold">Check-in</TableHead>
            <TableHead className="font-semibold">Check-out</TableHead>
            <TableHead className="font-semibold text-center">Nights</TableHead>
            <TableHead className="font-semibold text-right">Net Total</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Flags</TableHead>
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
              <TableCell className="text-muted-foreground font-mono text-sm">
                {invoice.disasterId}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {invoice.state}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(invoice.checkInDate), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(invoice.checkOutDate), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {invoice.nights}
              </TableCell>
              <TableCell className="font-semibold text-foreground text-right">
                ${invoice.netTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariants[invoice.status]}>
                  {statusLabels[invoice.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {invoice.flags.map(flag => (
                    <Badge key={flag} variant={flagVariants[flag].variant} className="text-[10px] px-1.5 py-0">
                      {flagVariants[flag].label}
                    </Badge>
                  ))}
                </div>
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

import { useState } from 'react';
import { Eye, MoreHorizontal } from 'lucide-react';
import { Invoice, InvoiceFlag } from '@/types/invoice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { FLAG_CONFIG, sortFlagsBySeverity, getFlagTooltip } from '@/utils/flagUtils';

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

const MAX_VISIBLE_FLAGS = 2;

function FlagBadge({ flag, tooltip }: { flag: InvoiceFlag; tooltip: string }) {
  const config = FLAG_CONFIG[flag];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none whitespace-nowrap ${config.bgClass}`}>
          {config.shortLabel}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function FlagsCell({ invoice }: { invoice: Invoice }) {
  const sorted = sortFlagsBySeverity(invoice.flags);
  if (sorted.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

  const visible = sorted.slice(0, MAX_VISIBLE_FLAGS);
  const overflow = sorted.slice(MAX_VISIBLE_FLAGS);

  return (
    <div className="flex items-center gap-1 max-w-[180px]">
      {visible.map(flag => (
        <FlagBadge
          key={flag}
          flag={flag}
          tooltip={getFlagTooltip(flag, invoice.flagDetails)}
        />
      ))}
      {overflow.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-muted/80 transition-colors">
              +{overflow.length}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 space-y-1" align="start">
            {overflow.map(flag => (
              <div key={flag} className="flex items-center gap-2">
                <FlagBadge flag={flag} tooltip={getFlagTooltip(flag, invoice.flagDetails)} />
                <span className="text-xs text-muted-foreground">{getFlagTooltip(flag, invoice.flagDetails)}</span>
              </div>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function GuestsCell({ invoice }: { invoice: Invoice }) {
  const primary = invoice.guests[0]?.name || '—';
  const extra = invoice.guests.length - 1;
  return (
    <div className="min-w-0">
      <p className="text-sm text-foreground truncate">{primary}</p>
      {extra > 0 && (
        <p className="text-[10px] text-muted-foreground">+{extra} more</p>
      )}
    </div>
  );
}

export function InvoiceTable({ invoices, onViewInvoice }: InvoiceTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Invoice #</TableHead>
            <TableHead className="font-semibold">Hotel</TableHead>
            <TableHead className="font-semibold">Guest(s)</TableHead>
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
              <TableCell>
                <GuestsCell invoice={invoice} />
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
                <FlagsCell invoice={invoice} />
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

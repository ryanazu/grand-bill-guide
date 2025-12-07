import { X, Download, Mail, Calendar, Users, CreditCard, FileText } from 'lucide-react';
import { Invoice } from '@/types/invoice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
}

const statusVariants: Record<Invoice['status'], 'success' | 'pending' | 'destructive' | 'secondary'> = {
  paid: 'success',
  pending: 'pending',
  overdue: 'destructive',
  cancelled: 'secondary',
};

export function InvoiceDetail({ invoice, onClose }: InvoiceDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border border-border bg-card p-8 shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">{invoice.invoiceNumber}</h2>
              <p className="text-muted-foreground">{invoice.hotelName}</p>
            </div>
            <Badge variant={statusVariants[invoice.status]} className="text-sm px-3 py-1">
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium">Room</span>
              </div>
              <p className="font-semibold text-foreground">{invoice.roomNumber}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Guests</span>
              </div>
              <p className="font-semibold text-foreground">{invoice.numberOfGuests}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium">Check-in</span>
              </div>
              <p className="font-semibold text-foreground">{format(new Date(invoice.checkInDate), 'MMM dd')}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium">Check-out</span>
              </div>
              <p className="font-semibold text-foreground">{format(new Date(invoice.checkOutDate), 'MMM dd')}</p>
            </div>
          </div>

          {/* Guests */}
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Guest Information</h3>
            <div className="space-y-2">
              {invoice.guests.map((guest, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-foreground">{guest.name}</p>
                    {guest.email && <p className="text-sm text-muted-foreground">{guest.email}</p>}
                  </div>
                  {guest.phone && <p className="text-sm text-muted-foreground">{guest.phone}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Charges Breakdown */}
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Charges Breakdown</h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="flex justify-between p-3 border-b border-border">
                <span className="text-muted-foreground">Room Rate</span>
                <span className="font-medium text-foreground">${invoice.roomRate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 border-b border-border">
                <span className="text-muted-foreground">Taxes</span>
                <span className="font-medium text-foreground">${invoice.taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 border-b border-border">
                <span className="text-muted-foreground">Additional Charges</span>
                <span className="font-medium text-foreground">${invoice.additionalCharges.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-4 bg-primary/5">
                <span className="font-semibold text-foreground">Total Amount</span>
                <span className="font-display text-xl font-bold text-primary">${invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {(invoice.paymentMethod || invoice.bookingReference || invoice.notes) && (
            <div className="space-y-2 text-sm">
              {invoice.paymentMethod && (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Payment:</span>
                  <span className="text-foreground">{invoice.paymentMethod}</span>
                </div>
              )}
              {invoice.bookingReference && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Booking Ref:</span>
                  <span className="text-foreground">{invoice.bookingReference}</span>
                </div>
              )}
              {invoice.notes && (
                <div className="mt-3 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-foreground">{invoice.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="accent" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              Send to Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

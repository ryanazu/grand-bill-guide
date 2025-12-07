import { useState } from 'react';
import { Lock, Table, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockInvoices } from '@/data/mockInvoices';
import { format } from 'date-fns';

const DEV_PASSWORD = '123';

export default function DevMode() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DEV_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Invoice #', 'Hotel Name', 'Hotel ID', 'Room', 'Check-in', 'Check-out',
      'Guest Names', 'Guest Emails', 'Guest Phones', 'Num Guests',
      'Room Rate', 'Taxes', 'Additional', 'Total', 'Status', 
      'Payment Method', 'Booking Ref', 'Submitted At', 'Notes'
    ];

    const rows = mockInvoices.map(inv => [
      inv.invoiceNumber,
      inv.hotelName,
      inv.hotelId,
      inv.roomNumber,
      inv.checkInDate,
      inv.checkOutDate,
      inv.guests.map(g => g.name).join('; '),
      inv.guests.map(g => g.email || '').join('; '),
      inv.guests.map(g => g.phone || '').join('; '),
      inv.numberOfGuests,
      inv.roomRate,
      inv.taxes,
      inv.additionalCharges,
      inv.totalAmount,
      inv.status,
      inv.paymentMethod || '',
      inv.bookingReference || '',
      inv.submittedAt,
      inv.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 shadow-lg animate-scale-in">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-2xl font-bold text-center text-foreground mb-2">
              Dev Mode
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Enter password to access raw data view
            </p>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <Button type="submit" className="w-full">
                Unlock
              </Button>
            </div>
            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to home
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Table className="h-5 w-5 text-accent" />
              <span className="font-display font-semibold text-foreground">Dev Mode - Raw Data</span>
            </div>
          </div>
          <Button variant="accent" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </header>

      {/* Spreadsheet View */}
      <main className="p-4">
        <div className="rounded-lg border border-border bg-card overflow-auto animate-fade-in">
          <table className="w-full text-xs">
            <thead className="bg-muted/70 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">#</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Invoice #</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Hotel Name</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Hotel ID</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Room</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Check-in</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Check-out</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Guest Names</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Guest Emails</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Guest Phones</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap"># Guests</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground border-r border-border whitespace-nowrap">Room Rate</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground border-r border-border whitespace-nowrap">Taxes</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground border-r border-border whitespace-nowrap">Additional</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground border-r border-border whitespace-nowrap">Total</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Payment</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Booking Ref</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border whitespace-nowrap">Submitted</th>
                <th className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockInvoices.map((inv, index) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border">{index + 1}</td>
                  <td className="px-3 py-2 font-medium text-foreground border-r border-border whitespace-nowrap">{inv.invoiceNumber}</td>
                  <td className="px-3 py-2 text-foreground border-r border-border whitespace-nowrap">{inv.hotelName}</td>
                  <td className="px-3 py-2 text-muted-foreground border-r border-border">{inv.hotelId}</td>
                  <td className="px-3 py-2 text-foreground border-r border-border">{inv.roomNumber}</td>
                  <td className="px-3 py-2 text-foreground border-r border-border whitespace-nowrap">{inv.checkInDate}</td>
                  <td className="px-3 py-2 text-foreground border-r border-border whitespace-nowrap">{inv.checkOutDate}</td>
                  <td className="px-3 py-2 text-foreground border-r border-border whitespace-nowrap">{inv.guests.map(g => g.name).join(', ')}</td>
                  <td className="px-3 py-2 text-muted-foreground border-r border-border whitespace-nowrap">{inv.guests.map(g => g.email || '-').join(', ')}</td>
                  <td className="px-3 py-2 text-muted-foreground border-r border-border whitespace-nowrap">{inv.guests.map(g => g.phone || '-').join(', ')}</td>
                  <td className="px-3 py-2 text-center text-foreground border-r border-border">{inv.numberOfGuests}</td>
                  <td className="px-3 py-2 text-right text-foreground border-r border-border">${inv.roomRate.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-foreground border-r border-border">${inv.taxes.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-foreground border-r border-border">${inv.additionalCharges.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground border-r border-border">${inv.totalAmount.toFixed(2)}</td>
                  <td className="px-3 py-2 border-r border-border">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                      inv.status === 'paid' ? 'bg-success/15 text-success' :
                      inv.status === 'pending' ? 'bg-muted text-muted-foreground' :
                      inv.status === 'overdue' ? 'bg-destructive/15 text-destructive' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-foreground border-r border-border whitespace-nowrap">{inv.paymentMethod || '-'}</td>
                  <td className="px-3 py-2 text-muted-foreground border-r border-border whitespace-nowrap">{inv.bookingReference || '-'}</td>
                  <td className="px-3 py-2 text-muted-foreground border-r border-border whitespace-nowrap">{format(new Date(inv.submittedAt), 'MMM dd, yyyy HH:mm')}</td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{inv.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{mockInvoices.length} records</span>
          <span>
            Total: ${mockInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </main>
    </div>
  );
}

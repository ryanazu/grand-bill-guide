import { useState, useMemo } from 'react';
import { FileText, DollarSign, Clock, AlertTriangle, Search, Filter } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { InvoiceTable } from '@/components/dashboard/InvoiceTable';
import { InvoiceDetail } from '@/components/dashboard/InvoiceDetail';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockInvoices } from '@/data/mockInvoices';
import { Invoice } from '@/types/invoice';

export default function Dashboard() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => {
    const total = mockInvoices.length;
    const totalRevenue = mockInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const pending = mockInvoices.filter(inv => inv.status === 'pending').length;
    const overdue = mockInvoices.filter(inv => inv.status === 'overdue').length;

    return { total, totalRevenue, pending, overdue };
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return mockInvoices;
    const query = searchQuery.toLowerCase();
    return mockInvoices.filter(inv =>
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.hotelName.toLowerCase().includes(query) ||
      inv.guests.some(g => g.name.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 space-y-8">
        {/* Page Header */}
        <div className="animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground">Invoice Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage hotel booking invoices</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
            <StatsCard
              title="Total Invoices"
              value={stats.total}
              subtitle="All time"
              icon={FileText}
              trend={{ value: 12, isPositive: true }}
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <StatsCard
              title="Total Revenue"
              value={`$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtitle="This month"
              icon={DollarSign}
              variant="success"
              trend={{ value: 8, isPositive: true }}
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <StatsCard
              title="Pending"
              value={stats.pending}
              subtitle="Awaiting payment"
              icon={Clock}
              variant="accent"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <StatsCard
              title="Overdue"
              value={stats.overdue}
              subtitle="Requires attention"
              icon={AlertTriangle}
              variant="warning"
            />
          </div>
        </div>

        {/* Invoices Section */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">Recent Invoices</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <InvoiceTable 
            invoices={filteredInvoices} 
            onViewInvoice={setSelectedInvoice}
          />
        </div>
      </main>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetail 
          invoice={selectedInvoice} 
          onClose={() => setSelectedInvoice(null)} 
        />
      )}
    </div>
  );
}

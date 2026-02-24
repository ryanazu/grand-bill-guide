import { useState, useMemo } from 'react';
import { FileText, DollarSign, Clock, AlertTriangle, Search, Filter, Settings } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { InvoiceTable } from '@/components/dashboard/InvoiceTable';
import { InvoiceDetail } from '@/components/dashboard/InvoiceDetail';
import { UploadInvoiceButton } from '@/components/dashboard/UploadInvoiceButton';
import { ImportReviewDialog } from '@/components/dashboard/ImportReviewDialog';
import { DashboardFilters, DashboardFilterValues, EMPTY_FILTERS } from '@/components/dashboard/DashboardFilters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mockInvoices } from '@/data/mockInvoices';
import { Invoice, ChargeCategory } from '@/types/invoice';
import { ParseResult } from '@/utils/csvParser';
import { applyFlags } from '@/utils/financialControls';
import { getFiscalYearFromDisasterId } from '@/constants/usStates';
import { useSettings } from '@/hooks/useSettings';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importedInvoices, setImportedInvoices] = useState<Invoice[]>([]);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DashboardFilterValues>(EMPTY_FILTERS);
  const { settings, updateSettings } = useSettings();

  // Merge and apply flags
  const allInvoices = useMemo(() => {
    const merged = [...mockInvoices, ...importedInvoices];
    return applyFlags(merged, settings.maxRatePerNight);
  }, [importedInvoices, settings.maxRatePerNight]);

  // Derive available filter values
  const availableDisasterIds = useMemo(() => [...new Set(allInvoices.map(i => i.disasterId))].sort(), [allInvoices]);
  const availableStates = useMemo(() => [...new Set(allInvoices.map(i => i.state))].sort(), [allInvoices]);
  const availableFiscalYears = useMemo(() => {
    const fys = allInvoices.map(i => getFiscalYearFromDisasterId(i.disasterId)).filter(Boolean) as string[];
    return [...new Set(fys)].sort();
  }, [allInvoices]);

  const stats = useMemo(() => {
    const total = allInvoices.length;
    const totalNet = allInvoices.reduce((sum, inv) => sum + inv.netTotal, 0);
    const pending = allInvoices.filter(inv => inv.status === 'pending').length;
    const overdue = allInvoices.filter(inv => inv.status === 'overdue').length;
    const flagged = allInvoices.filter(inv => inv.flags.length > 0).length;
    return { total, totalNet, pending, overdue, flagged };
  }, [allInvoices]);

  const filteredInvoices = useMemo(() => {
    let result = allInvoices;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.hotelName.toLowerCase().includes(query) ||
        inv.guests.some(g => g.name.toLowerCase().includes(query)) ||
        inv.disasterId.toLowerCase().includes(query) ||
        inv.state.toLowerCase().includes(query)
      );
    }

    // Filters
    if (filters.disasterId) result = result.filter(i => i.disasterId === filters.disasterId);
    if (filters.fiscalYear) result = result.filter(i => getFiscalYearFromDisasterId(i.disasterId) === filters.fiscalYear);
    if (filters.state) result = result.filter(i => i.state === filters.state);
    if (filters.amountMin) result = result.filter(i => i.netTotal >= parseFloat(filters.amountMin));
    if (filters.amountMax) result = result.filter(i => i.netTotal <= parseFloat(filters.amountMax));
    if (filters.category) {
      const cat = filters.category as ChargeCategory;
      result = result.filter(i => i.lineItems.some(li => li.category === cat));
    }
    if (filters.flag) result = result.filter(i => i.flags.includes(filters.flag as any));

    return result;
  }, [searchQuery, allInvoices, filters]);

  const handleImportConfirm = (invoices: Invoice[]) => {
    setImportedInvoices(prev => [...prev, ...invoices]);
    setParseResult(null);
    toast({ title: 'Import successful', description: `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} imported.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Invoice Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage hotel booking invoices</p>
          </div>
          {/* Settings Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-foreground">Settings</h4>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Rate Per Night ($)</Label>
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    value={settings.maxRatePerNight}
                    onChange={e => updateSettings({ maxRatePerNight: parseFloat(e.target.value) || 200 })}
                  />
                  <p className="text-[10px] text-muted-foreground">Invoices exceeding this rate will be flagged.</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
            <StatsCard title="Total Invoices" value={stats.total} subtitle="All time" icon={FileText} />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <StatsCard
              title="Net Spend"
              value={`$${stats.totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtitle="All invoices"
              icon={DollarSign}
              variant="success"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <StatsCard title="Pending" value={stats.pending} subtitle="Awaiting payment" icon={Clock} variant="accent" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <StatsCard title="Overdue" value={stats.overdue} subtitle="Requires attention" icon={AlertTriangle} variant="warning" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <StatsCard title="Flagged" value={stats.flagged} subtitle="Needs review" icon={AlertTriangle} variant="warning" />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="animate-fade-in">
            <DashboardFilters
              filters={filters}
              onChange={setFilters}
              availableDisasterIds={availableDisasterIds}
              availableStates={availableStates}
              availableFiscalYears={availableFiscalYears}
            />
          </div>
        )}

        {/* Invoices Section */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">Recent Invoices</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices, hotels, guests, disaster ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-80"
                />
              </div>
              <Button variant={showFilters ? 'default' : 'outline'} size="icon" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4" />
              </Button>
              <UploadInvoiceButton
                existingInvoices={allInvoices}
                onParseComplete={setParseResult}
              />
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
          maxRatePerNight={settings.maxRatePerNight}
        />
      )}

      {parseResult && (
        <ImportReviewDialog
          result={parseResult}
          onConfirm={handleImportConfirm}
          onCancel={() => setParseResult(null)}
        />
      )}
    </div>
  );
}

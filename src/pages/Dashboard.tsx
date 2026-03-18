import { useState, useMemo, useCallback } from 'react';
import { FileText, DollarSign, Clock, AlertTriangle, Search, Filter, Settings, Briefcase, Shield } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { InvoiceTable } from '@/components/dashboard/InvoiceTable';
import { InvoiceDetail } from '@/components/dashboard/InvoiceDetail';
import { UploadInvoiceButton } from '@/components/dashboard/UploadInvoiceButton';
import { ImportReviewDialog } from '@/components/dashboard/ImportReviewDialog';
import { FlagSettingsDialog } from '@/components/dashboard/FlagSettingsDialog';
import { DashboardFilters, DashboardFilterValues, EMPTY_FILTERS } from '@/components/dashboard/DashboardFilters';
import PortfoliosPage from '@/pages/Portfolios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockInvoices } from '@/data/mockInvoices';
import { mockPortfolios } from '@/data/mockPortfolios';
import { Invoice, ChargeCategory } from '@/types/invoice';
import { ClientPortfolio } from '@/types/portfolio';
import { ParseResult } from '@/utils/csvParser';
import { applyFlags } from '@/utils/financialControls';
import { applyPortfolioMatching } from '@/utils/portfolioMatching';
import { getFiscalYearFromDisasterId } from '@/constants/usStates';
import { useSettings } from '@/hooks/useSettings';
import { toast } from '@/hooks/use-toast';
import { FlagRule } from '@/types/flagRule';

type ActiveTab = 'invoices' | 'portfolios';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('invoices');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importedInvoices, setImportedInvoices] = useState<Invoice[]>([]);
  const [portfolios, setPortfolios] = useState<ClientPortfolio[]>(mockPortfolios);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showFlagSettings, setShowFlagSettings] = useState(false);
  const [filters, setFilters] = useState<DashboardFilterValues>(EMPTY_FILTERS);
  const { settings, updateSettings } = useSettings();

  // Merge, flag, then portfolio-match
  const allInvoices = useMemo(() => {
    const merged = [...mockInvoices, ...importedInvoices];
    const flagged = applyFlags(merged, settings.maxRatePerNight, settings.flagRules);
    return applyPortfolioMatching(flagged, portfolios, settings.maxRatePerNight);
  }, [importedInvoices, portfolios, settings.maxRatePerNight, settings.flagRules]);

  // Derive filter values
  const availableDisasterIds = useMemo(() => [...new Set(allInvoices.map(i => i.disasterId))].sort(), [allInvoices]);
  const availableStates = useMemo(() => [...new Set(allInvoices.map(i => i.state))].sort(), [allInvoices]);
  const availableFiscalYears = useMemo(() => {
    const fys = allInvoices.map(i => getFiscalYearFromDisasterId(i.disasterId)).filter(Boolean) as string[];
    return [...new Set(fys)].sort();
  }, [allInvoices]);

  const filteredInvoices = useMemo(() => {
    let result = allInvoices;
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

  // Stats now computed from filtered invoices
  const stats = useMemo(() => {
    const total = filteredInvoices.length;
    const totalNet = filteredInvoices.reduce((sum, inv) => sum + inv.netTotal, 0);
    const pending = filteredInvoices.filter(inv => inv.status === 'pending').length;
    const overdue = filteredInvoices.filter(inv => inv.status === 'overdue').length;
    const flagged = filteredInvoices.filter(inv => inv.flags.length > 0).length;
    return { total, totalNet, pending, overdue, flagged };
  }, [filteredInvoices]);

  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== '' || Object.values(filters).some(v => v !== '');
  }, [searchQuery, filters]);

  const handleImportConfirm = (invoices: Invoice[]) => {
    setImportedInvoices(prev => [...prev, ...invoices]);
    setParseResult(null);
    toast({ title: 'Import successful', description: `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} imported.` });
  };

  const handleDeleteInvoice = useCallback((invoiceId: string) => {
    setImportedInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    setSelectedInvoice(prev => prev?.id === invoiceId ? null : prev);
    toast({ title: 'Invoice deleted' });
  }, []);

  const handleAddPortfolio = useCallback((pf: ClientPortfolio) => {
    setPortfolios(prev => [...prev, pf]);
  }, []);

  const handleImportPortfolios = useCallback((pfs: ClientPortfolio[]) => {
    setPortfolios(prev => [...prev, ...pfs]);
  }, []);

  const handleDeletePortfolio = useCallback((portfolioId: string) => {
    setPortfolios(prev => prev.filter(p => p.portfolioId !== portfolioId));
    toast({ title: 'Portfolio deleted' });
  }, []);

  const handleLinkPortfolio = useCallback((invoiceId: string, portfolioId: string) => {
    setImportedInvoices(prev => prev.map(inv =>
      inv.id === invoiceId ? { ...inv, portfolioId, portfolioMatchStatus: 'MATCHED' as const, portfolioMatchMethod: 'MANUAL' as const } : inv
    ));
    setSelectedInvoice(prev => prev && prev.id === invoiceId ? { ...prev, portfolioId, portfolioMatchStatus: 'MATCHED' as const, portfolioMatchMethod: 'MANUAL' as const } : prev);
    toast({ title: 'Portfolio linked' });
  }, []);

  const handleConfirmMatch = useCallback((invoiceId: string) => {
    setImportedInvoices(prev => prev.map(inv =>
      inv.id === invoiceId ? { ...inv, portfolioMatchStatus: 'MATCHED' as const, portfolioMatchMethod: 'MANUAL' as const } : inv
    ));
    setSelectedInvoice(prev => prev && prev.id === invoiceId ? { ...prev, portfolioMatchStatus: 'MATCHED' as const, portfolioMatchMethod: 'MANUAL' as const } : prev);
    toast({ title: 'Match confirmed' });
  }, []);

  const handleRejectMatch = useCallback((invoiceId: string) => {
    setImportedInvoices(prev => prev.map(inv =>
      inv.id === invoiceId ? { ...inv, portfolioId: null, portfolioMatchStatus: 'UNMATCHED' as const, portfolioMatchMethod: undefined } : inv
    ));
    setSelectedInvoice(prev => prev && prev.id === invoiceId ? { ...prev, portfolioId: null, portfolioMatchStatus: 'UNMATCHED' as const, portfolioMatchMethod: undefined } : prev);
    toast({ title: 'Match rejected' });
  }, []);

  const handleSaveFlagRules = useCallback((rules: FlagRule[]) => {
    updateSettings({ flagRules: rules });
    toast({ title: 'Flag rules updated' });
  }, [updateSettings]);

  // Portfolio aggregation
  const invoiceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allInvoices.forEach(inv => { if (inv.portfolioId) counts[inv.portfolioId] = (counts[inv.portfolioId] || 0) + 1; });
    return counts;
  }, [allInvoices]);

  const invoiceFlagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allInvoices.forEach(inv => { if (inv.portfolioId && inv.flags.length > 0) counts[inv.portfolioId] = (counts[inv.portfolioId] || 0) + 1; });
    return counts;
  }, [allInvoices]);

  const invoiceSpend = useMemo(() => {
    const spend: Record<string, number> = {};
    allInvoices.forEach(inv => { if (inv.portfolioId) spend[inv.portfolioId] = (spend[inv.portfolioId] || 0) + inv.netTotal; });
    return spend;
  }, [allInvoices]);

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
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setShowFlagSettings(true)} title="Flag Rules">
              <Shield className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 border-b border-border">
          <button
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'invoices' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('invoices')}
          >
            <FileText className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
            Invoices
          </button>
          <button
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'portfolios' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('portfolios')}
          >
            <Briefcase className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
            Portfolios
            <span className="ml-1.5 text-xs text-muted-foreground">({portfolios.length})</span>
          </button>
        </div>

        {activeTab === 'invoices' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
                <StatsCard title="Total Invoices" value={stats.total} subtitle={hasActiveFilters ? 'Filtered' : 'All time'} icon={FileText} />
              </div>
              <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
                <StatsCard
                  title="Net Spend"
                  value={`$${stats.totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  subtitle={hasActiveFilters ? 'Filtered' : 'All invoices'}
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
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Recent Invoices
                  {hasActiveFilters && <span className="text-sm font-normal text-muted-foreground ml-2">({filteredInvoices.length} of {allInvoices.length})</span>}
                </h2>
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
                onDeleteInvoice={handleDeleteInvoice}
              />
            </div>
          </>
        ) : (
          <PortfoliosPage
            portfolios={portfolios}
            onAddPortfolio={handleAddPortfolio}
            onImportPortfolios={handleImportPortfolios}
            onDeletePortfolio={handleDeletePortfolio}
            invoiceCounts={invoiceCounts}
            invoiceFlagCounts={invoiceFlagCounts}
            invoiceSpend={invoiceSpend}
          />
        )}
      </main>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetail
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          maxRatePerNight={settings.maxRatePerNight}
          portfolios={portfolios}
          onLinkPortfolio={handleLinkPortfolio}
          onConfirmMatch={handleConfirmMatch}
          onRejectMatch={handleRejectMatch}
        />
      )}

      {parseResult && (
        <ImportReviewDialog
          result={parseResult}
          onConfirm={handleImportConfirm}
          onCancel={() => setParseResult(null)}
        />
      )}

      {showFlagSettings && (
        <FlagSettingsDialog
          rules={settings.flagRules}
          onSave={handleSaveFlagRules}
          onClose={() => setShowFlagSettings(false)}
        />
      )}
    </div>
  );
}

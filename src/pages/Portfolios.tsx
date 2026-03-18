import { useState } from 'react';
import { Plus, Send, Trash2, Upload, X, ChevronDown, ChevronUp, Users, FileText } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ClientPortfolio, PortfolioFormData, RoomType } from '@/types/portfolio';
import { ChargeCategory } from '@/types/invoice';
import { US_STATES, isValidDisasterId } from '@/constants/usStates';
import { calculateNights } from '@/utils/financialControls';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PortfoliosPageProps {
  portfolios: ClientPortfolio[];
  onAddPortfolio: (portfolio: ClientPortfolio) => void;
  onImportPortfolios: (portfolios: ClientPortfolio[]) => void;
  onDeletePortfolio: (portfolioId: string) => void;
  invoiceCounts: Record<string, number>;
  invoiceFlagCounts: Record<string, number>;
  invoiceSpend: Record<string, number>;
  onViewPortfolio?: (portfolio: ClientPortfolio) => void;
}

const ALL_CATEGORIES: ChargeCategory[] = ['ROOM', 'TAX', 'PET', 'PARKING', 'OTHER_FEE', 'ADJUSTMENT', 'UNKNOWN'];

export default function PortfoliosPage({ portfolios, onAddPortfolio, onImportPortfolios, onDeletePortfolio, invoiceCounts, invoiceFlagCounts, invoiceSpend, onViewPortfolio }: PortfoliosPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<ClientPortfolio | null>(null);
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Client Portfolios</h2>
          <p className="text-sm text-muted-foreground">{portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <ImportPortfoliosButton onImport={onImportPortfolios} />
          <Button variant="accent" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" /> Create Portfolio
          </Button>
        </div>
      </div>

      {showForm && (
        <CreatePortfolioForm
          onSubmit={pf => { onAddPortfolio(pf); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {selectedPortfolio ? (
        <PortfolioDetail
          portfolio={selectedPortfolio}
          invoiceCount={invoiceCounts[selectedPortfolio.portfolioId] || 0}
          flagCount={invoiceFlagCounts[selectedPortfolio.portfolioId] || 0}
          totalSpend={invoiceSpend[selectedPortfolio.portfolioId] || 0}
          onBack={() => setSelectedPortfolio(null)}
        />
      ) : (
        <PortfolioListTable
          portfolios={portfolios}
          invoiceCounts={invoiceCounts}
          invoiceFlagCounts={invoiceFlagCounts}
          invoiceSpend={invoiceSpend}
          onSelect={setSelectedPortfolio}
          onDelete={onDeletePortfolio}
        />
      )}
    </div>
  );
}

function PortfolioListTable({ portfolios, invoiceCounts, invoiceFlagCounts, invoiceSpend, onSelect, onDelete }: {
  portfolios: ClientPortfolio[];
  invoiceCounts: Record<string, number>;
  invoiceFlagCounts: Record<string, number>;
  invoiceSpend: Record<string, number>;
  onSelect: (p: ClientPortfolio) => void;
  onDelete: (portfolioId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="text-left font-semibold px-4 py-3">Portfolio ID</th>
            <th className="text-left font-semibold px-4 py-3">Guest</th>
            <th className="text-left font-semibold px-4 py-3">Disaster</th>
            <th className="text-left font-semibold px-4 py-3">State</th>
            <th className="text-left font-semibold px-4 py-3">Authorized Dates</th>
            <th className="text-right font-semibold px-4 py-3">Max Rate</th>
            <th className="text-center font-semibold px-4 py-3">Invoices</th>
            <th className="text-right font-semibold px-4 py-3">Total Spend</th>
            <th className="text-right font-semibold px-4 py-3">Flags</th>
            <th className="text-right font-semibold px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {portfolios.map(p => (
            <tr key={p.portfolioId} className="group border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => onSelect(p)}>
              <td className="px-4 py-3 font-mono text-xs text-foreground">{p.portfolioId}</td>
              <td className="px-4 py-3 font-medium text-foreground">{p.primaryGuestName}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.disasterId}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.state}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {format(new Date(p.authorizedCheckInDate), 'MMM dd')} — {format(new Date(p.authorizedCheckOutDate), 'MMM dd, yyyy')}
              </td>
              <td className="px-4 py-3 text-right text-foreground">
                {p.maxRatePerNight ? `$${p.maxRatePerNight}` : '—'}
              </td>
              <td className="px-4 py-3 text-center">
                <Badge variant={invoiceCounts[p.portfolioId] ? 'default' : 'secondary'} className="text-xs">
                  {invoiceCounts[p.portfolioId] || 0}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right font-medium text-foreground">
                ${(invoiceSpend[p.portfolioId] || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right">
                {(invoiceFlagCounts[p.portfolioId] || 0) > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    {invoiceFlagCounts[p.portfolioId]} flagged
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); onDelete(p.portfolioId); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
          {portfolios.length === 0 && (
            <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No portfolios yet. Create one or import from CSV.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PortfolioDetail({ portfolio, invoiceCount, flagCount, totalSpend, onBack }: {
  portfolio: ClientPortfolio;
  invoiceCount: number;
  flagCount: number;
  totalSpend: number;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>← Back to list</Button>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">{portfolio.primaryGuestName}</h2>
          <p className="text-muted-foreground">{portfolio.portfolioId} · {portfolio.disasterId} · {portfolio.state}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DetailCard label="Authorized Dates" value={`${format(new Date(portfolio.authorizedCheckInDate), 'MMM dd')} — ${format(new Date(portfolio.authorizedCheckOutDate), 'MMM dd, yyyy')}`} />
        <DetailCard label="Authorized Nights" value={String(portfolio.authorizedNights)} />
        <DetailCard label="Max Rate/Night" value={portfolio.maxRatePerNight ? `$${portfolio.maxRatePerNight}` : 'N/A'} />
        <DetailCard label="Assistance Cap" value={portfolio.totalAssistanceCap ? `$${portfolio.totalAssistanceCap}` : 'N/A'} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <DetailCard label="Linked Invoices" value={String(invoiceCount)} />
        <DetailCard label="Flagged Invoices" value={String(flagCount)} />
        <DetailCard label="Total Spend" value={`$${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
      </div>

      {portfolio.allowedChargeCategories && portfolio.allowedChargeCategories.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Allowed Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {portfolio.allowedChargeCategories.map(c => (
              <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
            ))}
          </div>
        </div>
      )}

      {(portfolio.clientId || portfolio.caseId || portfolio.bookingReference) && (
        <div className="grid grid-cols-3 gap-3">
          {portfolio.clientId && <DetailCard label="Client ID" value={portfolio.clientId} />}
          {portfolio.caseId && <DetailCard label="Case ID" value={portfolio.caseId} />}
          {portfolio.bookingReference && <DetailCard label="Booking Ref" value={portfolio.bookingReference} />}
        </div>
      )}

      {portfolio.notes && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
          <p className="text-sm text-foreground">{portfolio.notes}</p>
        </div>
      )}
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="font-semibold text-sm text-foreground mt-1">{value}</p>
    </div>
  );
}

function CreatePortfolioForm({ onSubmit, onCancel }: { onSubmit: (pf: ClientPortfolio) => void; onCancel: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<PortfolioFormData>({
    disasterId: '', state: '', primaryGuestName: '',
    authorizedCheckInDate: '', authorizedCheckOutDate: '',
  });
  const [allowedCats, setAllowedCats] = useState<ChargeCategory[]>([]);
  const [disasterIdError, setDisasterIdError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDisasterId(form.disasterId)) {
      setDisasterIdError('Format: 123-25');
      return;
    }
    if (!form.state || !form.primaryGuestName || !form.authorizedCheckInDate || !form.authorizedCheckOutDate) {
      toast({ title: 'Required fields missing', variant: 'destructive' });
      return;
    }

    const portfolio: ClientPortfolio = {
      portfolioId: `PF-${Date.now().toString(36).toUpperCase()}`,
      disasterId: form.disasterId,
      state: form.state,
      primaryGuestName: form.primaryGuestName,
      authorizedCheckInDate: form.authorizedCheckInDate,
      authorizedCheckOutDate: form.authorizedCheckOutDate,
      authorizedNights: calculateNights(form.authorizedCheckInDate, form.authorizedCheckOutDate),
      clientId: form.clientId || undefined,
      caseId: form.caseId || undefined,
      bookingReference: form.bookingReference || undefined,
      authorizedHotelName: form.authorizedHotelName || undefined,
      authorizedRoomType: form.authorizedRoomType || undefined,
      maxRatePerNight: form.maxRatePerNight || undefined,
      allowedChargeCategories: allowedCats.length > 0 ? allowedCats : undefined,
      totalAssistanceCap: form.totalAssistanceCap || undefined,
      householdSize: form.householdSize || undefined,
      notes: form.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSubmit(portfolio);
    toast({ title: 'Portfolio created' });
  };

  const toggleCat = (cat: ChargeCategory) => {
    setAllowedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">Create Portfolio</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Disaster ID *</Label>
          <Input value={form.disasterId} onChange={e => { setForm(p => ({ ...p, disasterId: e.target.value })); setDisasterIdError(e.target.value && !isValidDisasterId(e.target.value) ? 'Format: 123-25' : ''); }} placeholder="123-25" className={`h-9 text-sm ${disasterIdError ? 'border-destructive' : ''}`} />
          {disasterIdError && <p className="text-[10px] text-destructive">{disasterIdError}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">State *</Label>
          <Select value={form.state} onValueChange={v => setForm(p => ({ ...p, state: v }))}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{US_STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.value} — {s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Primary Guest Name *</Label>
          <Input value={form.primaryGuestName} onChange={e => setForm(p => ({ ...p, primaryGuestName: e.target.value }))} placeholder="Full name" className="h-9 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Check-in Date *</Label>
          <Input type="date" value={form.authorizedCheckInDate} onChange={e => setForm(p => ({ ...p, authorizedCheckInDate: e.target.value }))} className="h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Check-out Date *</Label>
          <Input type="date" value={form.authorizedCheckOutDate} onChange={e => setForm(p => ({ ...p, authorizedCheckOutDate: e.target.value }))} className="h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Max Rate/Night</Label>
          <Input type="number" step="0.01" value={form.maxRatePerNight ?? ''} onChange={e => setForm(p => ({ ...p, maxRatePerNight: parseFloat(e.target.value) || undefined }))} placeholder="$200" className="h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Assistance Cap</Label>
          <Input type="number" step="0.01" value={form.totalAssistanceCap ?? ''} onChange={e => setForm(p => ({ ...p, totalAssistanceCap: parseFloat(e.target.value) || undefined }))} placeholder="$1000" className="h-9 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Client ID</Label>
          <Input value={form.clientId ?? ''} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))} placeholder="RC-2024-XXXX" className="h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Case ID</Label>
          <Input value={form.caseId ?? ''} onChange={e => setForm(p => ({ ...p, caseId: e.target.value }))} placeholder="CASE-XX-XXX" className="h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Booking Reference</Label>
          <Input value={form.bookingReference ?? ''} onChange={e => setForm(p => ({ ...p, bookingReference: e.target.value }))} className="h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hotel Name</Label>
          <Input value={form.authorizedHotelName ?? ''} onChange={e => setForm(p => ({ ...p, authorizedHotelName: e.target.value }))} className="h-9 text-sm" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Allowed Charge Categories</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {ALL_CATEGORIES.map(cat => (
            <label key={cat} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <Checkbox checked={allowedCats.includes(cat)} onCheckedChange={() => toggleCat(cat)} />
              {cat}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Notes</Label>
        <Textarea value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="text-sm" />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="accent" size="sm"><Send className="h-3.5 w-3.5 mr-1" /> Create</Button>
      </div>
    </form>
  );
}

function ImportPortfoliosButton({ onImport }: { onImport: (portfolios: ClientPortfolio[]) => void }) {
  const { toast } = useToast();
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { toast({ title: 'Empty file', variant: 'destructive' }); return; }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
      const portfolios: ClientPortfolio[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, j) => { row[h] = values[j] || ''; });

        const disasterId = row['disaster_id'] || row['disasterid'] || '';
        const state = row['state'] || '';
        const guest = row['primary_guest_name'] || row['primaryguestname'] || row['guest_name'] || row['guestname'] || '';
        const checkIn = row['authorized_check_in_date'] || row['authorizedcheckindate'] || row['check_in'] || row['checkin'] || '';
        const checkOut = row['authorized_check_out_date'] || row['authorizedcheckoutdate'] || row['check_out'] || row['checkout'] || '';

        if (!disasterId || !state || !guest || !checkIn || !checkOut) continue;

        portfolios.push({
          portfolioId: `PF-IMP-${Date.now().toString(36)}-${i}`,
          disasterId,
          state,
          primaryGuestName: guest,
          authorizedCheckInDate: checkIn,
          authorizedCheckOutDate: checkOut,
          authorizedNights: calculateNights(checkIn, checkOut),
          clientId: row['client_id'] || row['clientid'] || undefined,
          caseId: row['case_id'] || row['caseid'] || undefined,
          bookingReference: row['booking_reference'] || row['bookingreference'] || undefined,
          authorizedHotelName: row['authorized_hotel_name'] || row['hotelname'] || undefined,
          maxRatePerNight: row['max_rate_per_night'] ? parseFloat(row['max_rate_per_night']) : undefined,
          totalAssistanceCap: row['total_assistance_cap'] ? parseFloat(row['total_assistance_cap']) : undefined,
          householdSize: row['household_size'] ? parseInt(row['household_size']) : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      if (portfolios.length === 0) {
        toast({ title: 'No valid portfolios found', description: 'Check CSV headers: disaster_id, state, primary_guest_name, check_in, check_out', variant: 'destructive' });
      } else {
        onImport(portfolios);
        toast({ title: `${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''} imported` });
      }
    } catch {
      toast({ title: 'Import failed', variant: 'destructive' });
    }

    e.target.value = '';
  };

  return (
    <>
      <input type="file" accept=".csv" onChange={handleFile} className="hidden" id="portfolio-import" />
      <Button variant="outline" size="sm" onClick={() => document.getElementById('portfolio-import')?.click()}>
        <Upload className="h-4 w-4 mr-1" /> Import Portfolios
      </Button>
    </>
  );
}

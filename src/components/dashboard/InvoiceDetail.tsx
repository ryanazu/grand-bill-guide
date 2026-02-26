import { useState } from 'react';
import { X, Download, Mail, Calendar, Users, CreditCard, FileText, Eye, EyeOff, AlertTriangle, MapPin, Hash, Link2, Check, XCircle, Search } from 'lucide-react';
import { Invoice, InvoiceFlag, InvoiceLineItem, ChargeCategory } from '@/types/invoice';
import { ClientPortfolio } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { getStateLabel } from '@/constants/usStates';
import { detectOffsetPairs } from '@/utils/financialControls';
import { FLAG_CONFIG, sortFlagsBySeverity, getFlagTooltip } from '@/utils/flagUtils';

interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
  maxRatePerNight: number;
  portfolios: ClientPortfolio[];
  onLinkPortfolio: (invoiceId: string, portfolioId: string) => void;
  onConfirmMatch: (invoiceId: string) => void;
  onRejectMatch: (invoiceId: string) => void;
}

const statusVariants: Record<Invoice['status'], 'success' | 'pending' | 'destructive'> = {
  paid: 'success',
  pending: 'pending',
  overdue: 'destructive',
};

const categoryLabels: Record<ChargeCategory, string> = {
  ROOM: 'Room', TAX: 'Tax', PET: 'Pet', PARKING: 'Parking',
  OTHER_FEE: 'Other Fee', ADJUSTMENT: 'Adjustment', UNKNOWN: 'Unknown',
};

const categoryColors: Record<ChargeCategory, string> = {
  ROOM: 'bg-primary/10 text-primary',
  TAX: 'bg-info/10 text-info',
  PET: 'bg-warning/10 text-warning',
  PARKING: 'bg-accent/10 text-accent',
  OTHER_FEE: 'bg-muted text-muted-foreground',
  ADJUSTMENT: 'bg-destructive/10 text-destructive',
  UNKNOWN: 'bg-muted text-muted-foreground',
};

export function InvoiceDetail({ invoice, onClose, maxRatePerNight, portfolios, onLinkPortfolio, onConfirmMatch, onRejectMatch }: InvoiceDetailProps) {
  const [hideOffsets, setHideOffsets] = useState(true);
  const [showLinkSearch, setShowLinkSearch] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');

  const offsetPairs = detectOffsetPairs(invoice.lineItems);
  const offsetIds = new Set(offsetPairs.flatMap(p => [p.positive.id, p.negative.id]));
  const visibleLineItems = hideOffsets ? invoice.lineItems.filter(li => !offsetIds.has(li.id)) : invoice.lineItems;
  const isOverRate = invoice.ratePerNight > maxRatePerNight && invoice.ratePerNight > 0;
  const linkedPortfolio = invoice.portfolioId ? portfolios.find(p => p.portfolioId === invoice.portfolioId) : null;
  const sortedFlags = sortFlagsBySeverity(invoice.flags);

  const filteredPortfolios = linkSearch.trim()
    ? portfolios.filter(p => {
        const q = linkSearch.toLowerCase();
        return p.primaryGuestName.toLowerCase().includes(q) ||
          p.portfolioId.toLowerCase().includes(q) ||
          (p.clientId && p.clientId.toLowerCase().includes(q)) ||
          (p.caseId && p.caseId.toLowerCase().includes(q)) ||
          (p.bookingReference && p.bookingReference.toLowerCase().includes(q)) ||
          p.disasterId.includes(q);
      })
    : portfolios.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl border border-border bg-card p-8 shadow-2xl animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">{invoice.invoiceNumber}</h2>
              <p className="text-muted-foreground">{invoice.hotelName}</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant={statusVariants[invoice.status]} className="text-sm px-3 py-1">
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
              {invoice.portfolioMatchStatus && (
                <Badge variant={invoice.portfolioMatchStatus === 'MATCHED' ? 'success' : invoice.portfolioMatchStatus === 'POSSIBLE_MATCH' ? 'warning' : 'secondary'} className="text-sm px-3 py-1">
                  {invoice.portfolioMatchStatus === 'MATCHED' ? 'Linked' : invoice.portfolioMatchStatus === 'POSSIBLE_MATCH' ? 'Possible Match' : 'Unmatched'}
                </Badge>
              )}
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4" /> Portfolio Pairing
            </h3>
            {invoice.portfolioMatchStatus === 'MATCHED' && linkedPortfolio ? (
              <div className="rounded-lg bg-success/5 border border-success/20 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{linkedPortfolio.primaryGuestName}</p>
                    <p className="text-xs text-muted-foreground">
                      {linkedPortfolio.portfolioId} · {linkedPortfolio.disasterId} · {linkedPortfolio.state}
                      {invoice.portfolioMatchMethod && ` · via ${invoice.portfolioMatchMethod.replace(/_/g, ' ')}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Authorized: {format(new Date(linkedPortfolio.authorizedCheckInDate), 'MMM dd')} — {format(new Date(linkedPortfolio.authorizedCheckOutDate), 'MMM dd, yyyy')}
                      {linkedPortfolio.maxRatePerNight && ` · Max $${linkedPortfolio.maxRatePerNight}/night`}
                    </p>
                  </div>
                </div>
              </div>
            ) : invoice.portfolioMatchStatus === 'POSSIBLE_MATCH' && linkedPortfolio ? (
              <div className="rounded-lg bg-warning/5 border border-warning/20 p-3">
                <p className="text-sm font-medium text-foreground">Suggested: {linkedPortfolio.primaryGuestName}</p>
                <p className="text-xs text-muted-foreground">
                  {linkedPortfolio.portfolioId} · Matched via {invoice.portfolioMatchMethod?.replace(/_/g, ' ')}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="default" onClick={() => onConfirmMatch(invoice.id)}>
                    <Check className="h-3 w-3 mr-1" /> Confirm Link
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onRejectMatch(invoice.id)}>
                    <XCircle className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-2">No portfolio linked.</p>
                {!showLinkSearch ? (
                  <Button size="sm" variant="outline" onClick={() => setShowLinkSearch(true)}>
                    <Link2 className="h-3 w-3 mr-1" /> Link to Portfolio
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={linkSearch}
                        onChange={e => setLinkSearch(e.target.value)}
                        placeholder="Search by name, ID, booking ref..."
                        className="h-8 text-xs pl-8"
                      />
                    </div>
                    <div className="max-h-40 overflow-auto space-y-1">
                      {filteredPortfolios.map(p => (
                        <button
                          key={p.portfolioId}
                          className="w-full text-left rounded-lg border border-border p-2 hover:bg-muted/50 transition-colors"
                          onClick={() => { onLinkPortfolio(invoice.id, p.portfolioId); setShowLinkSearch(false); }}
                        >
                          <p className="text-xs font-medium text-foreground">{p.primaryGuestName}</p>
                          <p className="text-[10px] text-muted-foreground">{p.portfolioId} · {p.disasterId} · {p.state}</p>
                        </button>
                      ))}
                      {filteredPortfolios.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3">No portfolios found</p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setShowLinkSearch(false)}>Cancel</Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Flags */}
          {sortedFlags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sortedFlags.map(flag => (
                <Tooltip key={flag}>
                  <TooltipTrigger asChild>
                    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${FLAG_CONFIG[flag].bgClass}`}>
                      {FLAG_CONFIG[flag].shortLabel}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-xs">
                    {getFlagTooltip(flag, invoice.flagDetails)}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <SummaryCard icon={<AlertTriangle className="h-4 w-4" />} label="Disaster ID" value={invoice.disasterId} />
            <SummaryCard icon={<MapPin className="h-4 w-4" />} label="State" value={`${invoice.state} — ${getStateLabel(invoice.state)}`} />
            <SummaryCard icon={<Calendar className="h-4 w-4" />} label="Check-in" value={format(new Date(invoice.checkInDate), 'MMM dd, yyyy')} />
            <SummaryCard icon={<Calendar className="h-4 w-4" />} label="Check-out" value={format(new Date(invoice.checkOutDate), 'MMM dd, yyyy')} />
            <SummaryCard icon={<Hash className="h-4 w-4" />} label="Nights" value={String(invoice.nights)} />
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <FinancialCard label="Room Subtotal" value={invoice.roomSubtotal} />
            <FinancialCard label="Tax Subtotal" value={invoice.taxSubtotal} />
            <FinancialCard label="Fees Subtotal" value={invoice.feesSubtotal} />
            <FinancialCard label="Adjustments" value={invoice.adjustmentsSubtotal} negative />
            <FinancialCard label="Net Total" value={invoice.netTotal} highlight />
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Rate/Night</p>
              <p className={`font-display text-lg font-bold ${isOverRate ? 'text-destructive' : 'text-foreground'}`}>
                ${invoice.ratePerNight.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Threshold: ${maxRatePerNight} {isOverRate && '⚠️'}
              </p>
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold text-foreground">Charges Breakdown</h3>
              {offsetPairs.length > 0 && (
                <div className="flex items-center gap-2">
                  <Switch id="hide-offsets" checked={hideOffsets} onCheckedChange={setHideOffsets} />
                  <Label htmlFor="hide-offsets" className="text-sm text-muted-foreground">Hide offset pairs (net $0)</Label>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Reference</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Guest</TableHead>
                    <TableHead className="text-xs">Room</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleLineItems.map(li => (
                    <TableRow key={li.id}>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(li.date), 'MMM dd')}</TableCell>
                      <TableCell className="text-xs">{li.type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{li.reference}</TableCell>
                      <TableCell className="text-xs">{li.description}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoryColors[li.category]}`}>
                          {categoryLabels[li.category]}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{li.guestName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{li.room || '—'}</TableCell>
                      <TableCell className={`text-xs text-right font-medium ${li.amount < 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {li.amount < 0 ? '-' : ''}${Math.abs(li.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {hideOffsets && offsetPairs.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Offset Pairs (Net $0) — {offsetPairs.length} pair{offsetPairs.length !== 1 ? 's' : ''}
                </h4>
                <div className="space-y-1">
                  {offsetPairs.map((pair, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-mono">{pair.positive.reference}</span>
                      <span>{pair.positive.description}</span>
                      <span className="ml-auto font-medium text-success">+${pair.positive.amount.toFixed(2)}</span>
                      <span className="font-medium text-destructive">-${Math.abs(pair.negative.amount).toFixed(2)}</span>
                      <span className="font-medium">= $0.00</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
            <Button variant="outline" className="flex-1">
              <Mail className="h-4 w-4 mr-2" /> Send to Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-semibold text-sm text-foreground">{value}</p>
    </div>
  );
}

function FinancialCard({ label, value, highlight, negative }: { label: string; value: number; highlight?: boolean; negative?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-primary/5' : 'bg-muted/50'}`}>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`font-display text-lg font-bold ${highlight ? 'text-primary' : negative && value < 0 ? 'text-destructive' : 'text-foreground'}`}>
        {value < 0 ? '-' : ''}${Math.abs(value).toFixed(2)}
      </p>
    </div>
  );
}

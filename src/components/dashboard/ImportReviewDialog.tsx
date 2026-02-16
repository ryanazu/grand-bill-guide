import { useState } from 'react';
import { AlertTriangle, CheckCircle, Copy, Trash2, X, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ParsedInvoice, ParseResult } from '@/utils/csvParser';
import { Invoice } from '@/types/invoice';

interface ImportReviewDialogProps {
  result: ParseResult;
  onConfirm: (invoices: Invoice[]) => void;
  onCancel: () => void;
}

export function ImportReviewDialog({ result, onConfirm, onCancel }: ImportReviewDialogProps) {
  const [entries, setEntries] = useState<ParsedInvoice[]>(result.invoices);
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: string, value: string) => {
    setEntries(prev => prev.map((entry, i) => {
      if (i !== index) return entry;
      const updated = { ...entry, invoice: { ...entry.invoice, [field]: field === 'roomRate' || field === 'taxes' || field === 'additionalCharges' || field === 'totalAmount' ? parseFloat(value) || 0 : value } };
      // Recalculate issues
      const newIssues = entry.issues.filter(issue => issue.field !== field);
      return { ...updated, issues: newIssues };
    }));
  };

  const cleanEntries = entries.filter(e => e.issues.length === 0);
  const errorEntries = entries.filter(e => e.issues.length > 0);

  const handleConfirm = () => {
    const validInvoices = entries
      .filter(e => e.issues.filter(i => i.type !== 'missing' || e.invoice[i.field as keyof typeof e.invoice]).length === 0 || e.issues.length === 0)
      .map(e => e.invoice as Invoice);
    onConfirm(validInvoices);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col animate-scale-in mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Review Import</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {entries.length} invoice{entries.length !== 1 ? 's' : ''} found
              {errorEntries.length > 0 && (
                <span className="text-destructive"> · {errorEntries.length} with issues</span>
              )}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Summary Badges */}
        <div className="flex gap-2 px-6 py-3 border-b border-border bg-muted/30">
          <Badge variant={cleanEntries.length > 0 ? 'success' : 'secondary'}>
            <CheckCircle className="h-3 w-3 mr-1" />
            {cleanEntries.length} Ready
          </Badge>
          {result.missingFields > 0 && (
            <Badge variant="warning">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {result.missingFields} Missing Fields
            </Badge>
          )}
          {result.duplicates > 0 && (
            <Badge variant="info">
              <Copy className="h-3 w-3 mr-1" />
              {result.duplicates} Duplicates
            </Badge>
          )}
        </div>

        {/* Invoice List */}
        <div className="flex-1 overflow-auto px-6 py-3">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No invoices to import. All entries have been removed.
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => {
                const hasIssues = entry.issues.length > 0;
                const isExpanded = expandedRow === index;

                return (
                  <div
                    key={index}
                    className={`rounded-lg border transition-colors ${
                      hasIssues ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-background'
                    }`}
                  >
                    {/* Row summary */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => setExpandedRow(isExpanded ? null : index)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground truncate">
                            {entry.invoice.invoiceNumber || '(no invoice #)'}
                          </span>
                          <span className="text-xs text-muted-foreground">—</span>
                          <span className="text-sm text-muted-foreground truncate">
                            {entry.invoice.hotelName || '(no hotel)'}
                          </span>
                        </div>
                        {hasIssues && (
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {entry.issues.map((issue, ii) => (
                              <span key={ii} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                issue.type === 'duplicate' ? 'bg-info/15 text-info' :
                                issue.type === 'missing' ? 'bg-warning/15 text-warning' :
                                'bg-destructive/15 text-destructive'
                              }`}>
                                {issue.message}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <span className="text-sm font-medium text-foreground whitespace-nowrap">
                        ${(entry.invoice.totalAmount || 0).toFixed(2)}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeEntry(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Expanded edit view */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-border/50">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { key: 'invoiceNumber', label: 'Invoice #' },
                            { key: 'hotelName', label: 'Hotel Name' },
                            { key: 'hotelId', label: 'Hotel ID' },
                            { key: 'roomNumber', label: 'Room #' },
                            { key: 'checkInDate', label: 'Check-in' },
                            { key: 'checkOutDate', label: 'Check-out' },
                            { key: 'roomRate', label: 'Room Rate' },
                            { key: 'taxes', label: 'Taxes' },
                            { key: 'additionalCharges', label: 'Additional' },
                            { key: 'status', label: 'Status' },
                            { key: 'paymentMethod', label: 'Payment' },
                            { key: 'bookingReference', label: 'Booking Ref' },
                          ].map(({ key, label }) => {
                            const hasFieldIssue = entry.issues.some(i => i.field === key);
                            const value = String(entry.invoice[key as keyof typeof entry.invoice] ?? '');
                            return (
                              <div key={key}>
                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                  {label}
                                  {hasFieldIssue && <span className="text-destructive ml-1">*</span>}
                                </label>
                                <Input
                                  value={value}
                                  onChange={(e) => updateField(index, key, e.target.value)}
                                  className={`h-8 text-xs mt-0.5 ${hasFieldIssue ? 'border-destructive/50 bg-destructive/5' : ''}`}
                                  placeholder={label}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {errorEntries.length > 0
              ? 'Expand rows to fix issues, or remove them before importing.'
              : 'All entries look good!'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button
              variant="accent"
              onClick={handleConfirm}
              disabled={entries.length === 0}
            >
              Import {entries.length} Invoice{entries.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlagRule, FlagConditionType, FlagSeverity, CONDITION_TYPE_LABELS } from '@/types/flagRule';
import { ChargeCategory } from '@/types/invoice';

interface FlagSettingsDialogProps {
  rules: FlagRule[];
  onSave: (rules: FlagRule[]) => void;
  onClose: () => void;
}

const SEVERITY_COLORS: Record<FlagSeverity, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  review: 'bg-warning/10 text-warning border-warning/20',
  info: 'bg-info/10 text-info border-info/20',
};

const ALL_CATEGORIES: ChargeCategory[] = ['ROOM', 'TAX', 'PET', 'PARKING', 'OTHER_FEE', 'ADJUSTMENT', 'UNKNOWN'];

function RuleEditor({ rule, onSave, onCancel }: { rule: Partial<FlagRule>; onSave: (r: FlagRule) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<FlagRule>>({
    name: '',
    shortLabel: '',
    conditionType: 'rate_exceeds_threshold',
    severity: 'review',
    enabled: true,
    threshold: 200,
    categories: [],
    keywords: [],
    ...rule,
  });
  const [keywordInput, setKeywordInput] = useState('');

  const update = (key: keyof FlagRule, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name || !form.shortLabel || !form.conditionType) return;
    onSave({
      id: form.id || `rule-${Date.now()}`,
      name: form.name!,
      shortLabel: form.shortLabel!,
      conditionType: form.conditionType!,
      severity: form.severity || 'review',
      enabled: form.enabled ?? true,
      threshold: form.threshold,
      categories: form.categories,
      keywords: form.keywords,
    });
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      update('keywords', [...(form.keywords || []), keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Rule Name</Label>
          <Input className="h-8 text-sm" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Pet Charges" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Short Label (tag)</Label>
          <Input className="h-8 text-sm" value={form.shortLabel} onChange={e => update('shortLabel', e.target.value)} placeholder="e.g. Pet" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Condition</Label>
          <Select value={form.conditionType} onValueChange={v => update('conditionType', v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CONDITION_TYPE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Severity</Label>
          <Select value={form.severity} onValueChange={v => update('severity', v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical (Red)</SelectItem>
              <SelectItem value="review">Review (Amber)</SelectItem>
              <SelectItem value="info">Info (Blue)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.conditionType === 'rate_exceeds_threshold' && (
        <div className="space-y-1">
          <Label className="text-xs">Threshold ($)</Label>
          <Input type="number" className="h-8 text-sm w-32" value={form.threshold ?? ''} onChange={e => update('threshold', parseFloat(e.target.value) || 0)} />
        </div>
      )}

      {form.conditionType === 'category_present' && (
        <div className="space-y-1">
          <Label className="text-xs">Categories</Label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CATEGORIES.map(cat => {
              const selected = form.categories?.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => update('categories', selected ? form.categories!.filter(c => c !== cat) : [...(form.categories || []), cat])}
                  className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {form.conditionType === 'custom_keyword' && (
        <div className="space-y-1">
          <Label className="text-xs">Keywords</Label>
          <div className="flex gap-2">
            <Input className="h-8 text-sm flex-1" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} placeholder="Add keyword..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())} />
            <Button variant="outline" size="sm" className="h-8" onClick={addKeyword}>Add</Button>
          </div>
          {form.keywords && form.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {form.keywords.map((kw, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs">
                  {kw}
                  <button onClick={() => update('keywords', form.keywords!.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={!form.name || !form.shortLabel}>Save Rule</Button>
      </div>
    </div>
  );
}

export function FlagSettingsDialog({ rules, onSave, onClose }: FlagSettingsDialogProps) {
  const [localRules, setLocalRules] = useState<FlagRule[]>(rules);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const toggleRule = (id: string) => {
    setLocalRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setLocalRules(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveRule = (rule: FlagRule) => {
    setLocalRules(prev => {
      const idx = prev.findIndex(r => r.id === rule.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = rule;
        return next;
      }
      return [...prev, rule];
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSaveAll = () => {
    onSave(localRules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col animate-scale-in mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Flag Rules</h2>
              <p className="text-sm text-muted-foreground">Manage financial control rules and conditions</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4 space-y-3">
          {localRules.map(rule => (
            <div key={rule.id}>
              {editingId === rule.id ? (
                <RuleEditor rule={rule} onSave={handleSaveRule} onCancel={() => setEditingId(null)} />
              ) : (
                <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${rule.enabled ? 'border-border bg-background' : 'border-border/50 bg-muted/30 opacity-60'}`}>
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{rule.name}</span>
                      <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${SEVERITY_COLORS[rule.severity]}`}>
                        {rule.shortLabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {CONDITION_TYPE_LABELS[rule.conditionType]}
                      {rule.conditionType === 'rate_exceeds_threshold' && rule.threshold && ` · $${rule.threshold}`}
                      {rule.conditionType === 'category_present' && rule.categories?.length ? ` · ${rule.categories.join(', ')}` : ''}
                      {rule.conditionType === 'custom_keyword' && rule.keywords?.length ? ` · "${rule.keywords.join('", "')}"` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(rule.id)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isAdding ? (
            <RuleEditor rule={{}} onSave={handleSaveRule} onCancel={() => setIsAdding(false)} />
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Rule
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveAll}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}

import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseCSV, parsePDFMock, ParseResult } from '@/utils/csvParser';
import { Invoice } from '@/types/invoice';
import { toast } from '@/hooks/use-toast';

interface UploadInvoiceButtonProps {
  existingInvoices: Invoice[];
  onParseComplete: (result: ParseResult) => void;
}

export function UploadInvoiceButton({ existingInvoices, onParseComplete }: UploadInvoiceButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      const text = await file.text();
      const result = parseCSV(text, existingInvoices);
      if (result.invoices.length === 0) {
        toast({ title: 'No data found', description: 'The CSV file appears to be empty or incorrectly formatted.', variant: 'destructive' });
      } else {
        onParseComplete(result);
      }
    } else if (ext === 'pdf') {
      // Mock PDF parsing
      toast({ title: 'PDF Detected', description: 'PDF parsing is in mock mode. Fields will need manual entry.' });
      const result = parsePDFMock(file.name);
      onParseComplete(result);
    } else {
      toast({ title: 'Unsupported file', description: 'Please upload a CSV or PDF file.', variant: 'destructive' });
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button variant="accent" size="sm" onClick={() => fileInputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />
        Import File
      </Button>
    </>
  );
}

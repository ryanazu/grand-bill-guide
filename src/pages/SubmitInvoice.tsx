import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceSubmissionForm } from '@/components/forms/InvoiceSubmissionForm';
import { InvoiceFormData } from '@/types/invoice';

export default function SubmitInvoice() {
  const navigate = useNavigate();

  const handleSubmit = (data: InvoiceFormData) => {
    console.log('Submitted invoice:', data);
    // In a real app, this would send to a backend
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Building2 className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Submit Invoice</h1>
              <p className="text-xs text-muted-foreground">Hotel Booking Invoice Portal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Intro */}
          <div className="mb-8 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              New Invoice Submission
            </h2>
            <p className="text-muted-foreground">
              Please fill out the form below with your hotel booking invoice details. 
              Required fields are marked with an asterisk (*).
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm animate-slide-up">
            <InvoiceSubmissionForm onSubmit={handleSubmit} />
          </div>
        </div>
      </main>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Building2, FileText, Send, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: FileText,
    title: 'Standardized Format',
    description: 'All invoices follow the same structure for easy processing and analysis.',
  },
  {
    icon: Send,
    title: 'Direct Submission',
    description: 'Hotels submit invoices directly through your branded portal.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Dashboard',
    description: 'Monitor all submissions with live updates and status tracking.',
  },
];

const benefits = [
  'Eliminate manual data entry',
  'Reduce processing errors',
  'Centralized invoice management',
  'Instant notification of new submissions',
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Hotel Invoice Management
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Streamline Your 
              <span className="block text-primary">Hotel Invoicing</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Collect and manage hotel booking invoices in a standardized format. 
              Send your portal link to hotels and receive structured data directly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild variant="accent" size="lg" className="text-base">
                <Link to="/dashboard">
                  View Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link to="/submit">
                  Submit Invoice
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A simple workflow to collect and manage all your hotel invoices in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-lg hover:border-accent/30 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent mb-6 transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">
                Why Use HotelInvoice?
              </h2>
              <p className="text-muted-foreground mb-8">
                Stop chasing hotels for invoices. Create a single submission portal and let 
                them submit directly in the format you need.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li 
                    key={benefit}
                    className="flex items-center gap-3 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative animate-fade-in">
              <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <div className="h-3 w-3 rounded-full bg-success" />
                </div>
                <div className="space-y-4">
                  <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-full rounded bg-muted/60" />
                  <div className="h-4 w-5/6 rounded bg-muted/60" />
                  <div className="grid grid-cols-3 gap-3 pt-4">
                    <div className="h-20 rounded-lg bg-accent/10" />
                    <div className="h-20 rounded-lg bg-primary/10" />
                    <div className="h-20 rounded-lg bg-success/10" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl bg-accent/20" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center animate-fade-in">
          <h2 className="font-display text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Start collecting standardized invoices from your hotel partners today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-base">
              <Link to="/dashboard">
                Open Dashboard
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/submit">
                Try Submission Form
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold text-foreground">HotelInvoice</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 HotelInvoice. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

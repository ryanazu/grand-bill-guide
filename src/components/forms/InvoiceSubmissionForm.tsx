import { useState } from 'react';
import { Plus, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Guest, InvoiceFormData } from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';

interface InvoiceSubmissionFormProps {
  onSubmit: (data: InvoiceFormData) => void;
}

export function InvoiceSubmissionForm({ onSubmit }: InvoiceSubmissionFormProps) {
  const { toast } = useToast();
  const [guests, setGuests] = useState<Guest[]>([{ name: '', email: '', phone: '' }]);
  const [formData, setFormData] = useState({
    hotelName: '',
    invoiceNumber: '',
    roomNumber: '',
    checkInDate: '',
    checkOutDate: '',
    roomRate: '',
    taxes: '',
    additionalCharges: '',
    notes: '',
    paymentMethod: '',
    bookingReference: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuestChange = (index: number, field: keyof Guest, value: string) => {
    const updatedGuests = [...guests];
    updatedGuests[index] = { ...updatedGuests[index], [field]: value };
    setGuests(updatedGuests);
  };

  const addGuest = () => {
    setGuests([...guests, { name: '', email: '', phone: '' }]);
  };

  const removeGuest = (index: number) => {
    if (guests.length > 1) {
      setGuests(guests.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: InvoiceFormData = {
      hotelName: formData.hotelName,
      invoiceNumber: formData.invoiceNumber,
      roomNumber: formData.roomNumber,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      guests: guests.filter(g => g.name.trim() !== ''),
      numberOfGuests: guests.filter(g => g.name.trim() !== '').length,
      roomRate: parseFloat(formData.roomRate) || 0,
      taxes: parseFloat(formData.taxes) || 0,
      additionalCharges: parseFloat(formData.additionalCharges) || 0,
      notes: formData.notes,
      paymentMethod: formData.paymentMethod,
      bookingReference: formData.bookingReference,
    };

    onSubmit(data);
    toast({
      title: "Invoice Submitted",
      description: "Your invoice has been submitted successfully.",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Hotel Information */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Hotel Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hotelName">Hotel Name *</Label>
            <Input
              id="hotelName"
              name="hotelName"
              value={formData.hotelName}
              onChange={handleInputChange}
              placeholder="Enter hotel name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number *</Label>
            <Input
              id="invoiceNumber"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleInputChange}
              placeholder="INV-2024-XXX"
              required
            />
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Booking Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room Number *</Label>
            <Input
              id="roomNumber"
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleInputChange}
              placeholder="e.g., 301"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkInDate">Check-in Date *</Label>
            <Input
              id="checkInDate"
              name="checkInDate"
              type="date"
              value={formData.checkInDate}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkOutDate">Check-out Date *</Label>
            <Input
              id="checkOutDate"
              name="checkOutDate"
              type="date"
              value={formData.checkOutDate}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bookingReference">Booking Reference</Label>
            <Input
              id="bookingReference"
              name="bookingReference"
              value={formData.bookingReference}
              onChange={handleInputChange}
              placeholder="Optional booking reference"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Input
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              placeholder="e.g., Credit Card, Bank Transfer"
            />
          </div>
        </div>
      </div>

      {/* Guest Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-foreground">Guest Information</h3>
          <Button type="button" variant="outline" size="sm" onClick={addGuest}>
            <Plus className="h-4 w-4 mr-1" />
            Add Guest
          </Button>
        </div>
        <div className="space-y-4">
          {guests.map((guest, index) => (
            <div key={index} className="relative rounded-lg border border-border p-4 animate-fade-in">
              {guests.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGuest(index)}
                  className="absolute top-3 right-3 p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Guest Name *</Label>
                  <Input
                    value={guest.name}
                    onChange={(e) => handleGuestChange(index, 'name', e.target.value)}
                    placeholder="Full name"
                    required={index === 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={guest.email || ''}
                    onChange={(e) => handleGuestChange(index, 'email', e.target.value)}
                    placeholder="guest@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={guest.phone || ''}
                    onChange={(e) => handleGuestChange(index, 'phone', e.target.value)}
                    placeholder="+1 555-0100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charges */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Charges</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="roomRate">Room Rate ($) *</Label>
            <Input
              id="roomRate"
              name="roomRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.roomRate}
              onChange={handleInputChange}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxes">Taxes ($)</Label>
            <Input
              id="taxes"
              name="taxes"
              type="number"
              step="0.01"
              min="0"
              value={formData.taxes}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalCharges">Additional Charges ($)</Label>
            <Input
              id="additionalCharges"
              name="additionalCharges"
              type="number"
              step="0.01"
              min="0"
              value={formData.additionalCharges}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="rounded-lg bg-primary/5 p-4 flex items-center justify-between">
          <span className="font-medium text-foreground">Calculated Total</span>
          <span className="font-display text-2xl font-bold text-primary">
            ${(
              (parseFloat(formData.roomRate) || 0) +
              (parseFloat(formData.taxes) || 0) +
              (parseFloat(formData.additionalCharges) || 0)
            ).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Any special requests, packages, or additional information..."
          rows={3}
        />
      </div>

      {/* Submit */}
      <Button type="submit" variant="accent" size="lg" className="w-full">
        <Send className="h-5 w-5 mr-2" />
        Submit Invoice
      </Button>
    </form>
  );
}

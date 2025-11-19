
"use client";

import { useState } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { mockBookings, MockBooking } from "@/lib/mock-data";
import { BookingDetailsModal } from "@/components/bookings/booking-details-modal";
import { TicketStub } from "@/components/bookings/ticket-stub";

export default function BookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<MockBooking | null>(null);

  const handleBookingSelect = (booking: MockBooking) => {
    setSelectedBooking(booking);
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
  };

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Mis Reservas</h1>
        </div>
        
        {mockBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mockBookings.map((booking) => (
                    <TicketStub key={booking.id} booking={booking} onSelect={handleBookingSelect} />
                ))}
            </div>
        ) : (
             <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8">
                <p className="text-2xl font-semibold text-muted-foreground mb-4">No tienes reservas activas</p>
                <p className="text-muted-foreground">Cuando reserves un tiquete para un evento, aparecerá aquí.</p>
            </div>
        )}
      </main>

      {selectedBooking && (
        <BookingDetailsModal 
            booking={selectedBooking} 
            isOpen={!!selectedBooking}
            onClose={handleCloseModal}
        />
      )}
    </AuthenticatedLayout>
  );
}

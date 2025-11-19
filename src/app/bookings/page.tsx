
"use client";

import { useState, useMemo } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { mockBookings, MockBooking } from "@/lib/mock-data";
import { BookingDetailsModal } from "@/components/bookings/booking-details-modal";
import { TicketStub } from "@/components/bookings/ticket-stub";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function BookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<MockBooking | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleBookingSelect = (booking: MockBooking) => {
    setSelectedBooking(booking);
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
  };

  const filteredBookings = useMemo(() => {
    if (!searchQuery) {
      return mockBookings;
    }
    return mockBookings.filter((booking) =>
      booking.event.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Mis Reservas</h1>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por evento..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBookings.map((booking) => (
              <TicketStub key={booking.id} booking={booking} onSelect={handleBookingSelect} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4">
            <p className="text-2xl font-semibold text-muted-foreground mb-4">
              {searchQuery ? "No se encontraron reservas" : "No tienes reservas activas"}
            </p>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Intenta con otro término de búsqueda."
                : "Cuando reserves un tiquete para un evento, aparecerá aquí."}
            </p>
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

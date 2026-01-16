"use client";
import type { ApiBooking, Survey } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { es, enUS } from 'date-fns/locale';

type SurveyListItemProps = {
    booking: ApiBooking & { survey?: Survey };
    isSelected: boolean;
    onSelect: () => void;
};

export function SurveyListItem({ booking, isSelected, onSelect }: SurveyListItemProps) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'es' ? es : enUS;

    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-4",
                isSelected ? "bg-primary/10" : "hover:bg-muted/50"
            )}
        >
            <div className="relative h-16 w-16 rounded-md overflow-hidden shrink-0 bg-muted">
                {booking.eventoImagen ? (
                    <Image src={booking.eventoImagen} alt={booking.eventoNombre || ''} fill className="object-cover" />
                ) : null}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{booking.eventoNombre}</p>
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Calendar className="h-3 w-3"/>
                    <span>{format(new Date(booking.eventoInicio!), 'dd MMM yyyy', { locale })}</span>
                </div>
            </div>
            {booking.survey ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-3 w-3 mr-1"/>
                    {t('surveys.status_completed')}
                </Badge>
            ) : (
                <Badge variant="outline">
                    <Edit3 className="h-3 w-3 mr-1"/>
                    {t('surveys.status_pending')}
                </Badge>
            )}
        </button>
    );
}

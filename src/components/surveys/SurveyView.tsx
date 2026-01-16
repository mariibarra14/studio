"use client";

import type { Survey } from "@/lib/types";
import { StarRating } from "./StarRating";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

type SurveyViewProps = {
  survey: Survey;
};

export function SurveyView({ survey }: SurveyViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'es' ? require('date-fns/locale/es') : require('date-fns/locale/en-US');

  return (
    <div className="space-y-4">
        <div>
            <h3 className="text-lg font-semibold">{t('surveys.your_rating_title')}</h3>
            <p className="text-sm text-muted-foreground">
                {t('surveys.submitted_on')} {format(new Date(survey.fechaCreacion), "dd 'de' MMMM, yyyy", { locale })}
            </p>
        </div>
        <div className="space-y-1">
            <p className="font-medium">{t('surveys.rating_label')}:</p>
            <StarRating rating={survey.calificacion} readOnly={true} size={28} />
        </div>
        <div className="space-y-1">
            <p className="font-medium">{t('surveys.comment_label_view')}:</p>
            <p className="text-muted-foreground p-4 border bg-muted/50 rounded-md whitespace-pre-wrap">
                {survey.comentario || t('surveys.no_comment_left')}
            </p>
        </div>
    </div>
  );
}

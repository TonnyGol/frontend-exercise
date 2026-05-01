import React from 'react';
import { Files, Upload, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import type { UploadSummary } from '../../core/types';
import '../style/SummaryCards.css';

interface SummaryCardsProps {
  summary: UploadSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const cards = [
    { label: 'Total Files', value: summary.total, icon: Files, variant: 'blue' },
    { label: 'Uploading/Queued', value: summary.queuedOrUploading, icon: Upload, variant: 'orange' },
    { label: 'Processing', value: summary.processing, icon: Loader2, variant: 'yellow' },
    { label: 'Accepted', value: summary.accepted, icon: CheckCircle2, variant: 'green' },
    { label: 'Rejected', value: summary.rejected, icon: XCircle, variant: 'red' },
    { label: 'Failed', value: summary.failed, icon: AlertTriangle, variant: 'gray' },
  ];

  return (
    <div className="summary-grid">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`summary-card summary-card--${card.variant}`}
        >
          <card.icon className="summary-card__icon" />
          <span className="summary-card__value">{card.value}</span>
          <span className="summary-card__label">{card.label}</span>
        </div>
      ))}
    </div>
  );
};
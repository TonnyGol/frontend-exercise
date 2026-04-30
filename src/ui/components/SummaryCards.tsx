import React from 'react';
import { Files, Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { UploadSummary } from '../../core/types';

interface SummaryCardsProps {
  summary: UploadSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const cards = [
    { label: 'Total Files', value: summary.total, icon: Files, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Uploading/Queued', value: summary.queuedOrUploading, icon: Upload, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Processing', value: summary.processing, icon: Loader2, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Accepted', value: summary.accepted, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Rejected', value: summary.rejected + summary.failed, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} rounded-xl p-5 flex flex-col items-center shadow-md hover:shadow-xl transition-shadow duration-200`}
        >
          <card.icon
            className={`w-8 h-8 mb-3 ${card.color} transition-all duration-200 hover:scale-110 hover:opacity-80 cursor-pointer`}
          />
          <span className="text-3xl font-bold">{card.value}</span>
          <span className="text-sm text-gray-600 mt-1">{card.label}</span>
          <br></br>
        </div>
      ))}
    </div>
  );
};
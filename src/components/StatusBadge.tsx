import type { RequestStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

const CLASS_MAP: Record<RequestStatus, string> = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
  completed: 'badge-completed',
  in_progress: 'badge-progress',
  cancelled: 'badge-cancelled',
};

export default function StatusBadge({ status }: { status: RequestStatus | string }) {
  const { t } = useLanguage();
  const key = (status || 'pending') as RequestStatus;
  return <span className={CLASS_MAP[key] || 'badge-pending'}>{t(`status.${key}`)}</span>;
}

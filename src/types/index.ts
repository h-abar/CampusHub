export type VenueType = 'theater' | 'lobby' | 'b2';

export interface ServiceDefinition {
  key: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  enabled: boolean;
  requiresVenue?: boolean;
  icon?: string;
}

export type ServiceType = string;

export interface DateRange {
  date: string;
  startTime: string;
  endTime: string;
}

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface StatusHistory {
  status: RequestStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface ServiceRequest {
  id: string;
  trackingCode: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  requestDate: string;
  eventDates: DateRange[];
  venues?: VenueType[];
  status: RequestStatus;
  statusHistory: StatusHistory[];
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterDepartment: string;
  requesterType: 'internal' | 'external';
  externalEntity?: string;
  additionalNotes?: string;
  adminNotes?: string;
}

export interface College {
  id: string;
  name: string;
  nameEn?: string;
  enabled: boolean;
  departments: Department[];
}

export interface Department {
  id: string;
  name: string;
  nameEn?: string;
  enabled: boolean;
}

export interface ExternalEntity {
  id: string;
  name: string;
  enabled: boolean;
}

export interface ServiceFormData {
  venues?: VenueType[];
  serviceType: ServiceType;
  title: string;
  description: string;
  eventDates: DateRange[];
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterDepartment: string;
  requesterType: 'internal' | 'external';
  externalEntity?: string;
  additionalNotes?: string;
}

export interface SystemSettings {
  services: ServiceDefinition[];
  colleges: College[];
  externalEntities: ExternalEntity[];
  general?: {
    systemName: string;
    contactEmail: string;
    logoUrl: string;
    defaultLanguage: string;
  };
}

export interface VenueInfo {
  id: VenueType;
  nameAr: string;
  nameEn: string;
  capacity: number;
  location: string;
  amenities: string[];
  image?: string;
}

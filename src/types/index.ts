export type UserRole = 'admin' | 'donor' | 'patient' | 'hospital_coordinator'

export interface AuthState {
  access_token: string
  token_type: string
  role: UserRole
  full_name?: string
  email?: string
}

export interface User {
  id: string
  full_name: string
  email: string
  phone: string
  role: UserRole
}

export interface DonorProfile {
  id: string
  user_id: string
  blood_type: string
  age: number
  weight: number
  gender?: string | null
  city: string
  state: string
  pincode?: string | null
  latitude?: number | null
  longitude?: number | null
  hospital_id?: string | null
  hplc_doc_url: string | null
  hplc_unique_id: string
  is_admin_verified: boolean
  donor_type: 'bridge' | 'emergency'
  availability: boolean
  total_donations: number
  last_donated_at: string | null
  notes?: string | null
  created_at?: string
}

export interface Hospital {
  id: string
  name: string
  address: string
  city: string
  state: string
  pincode?: string | null
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  email?: string | null
}

export interface PatientProfile {
  id: string
  user_id: string
  blood_type: string | null
  age: number
  gender?: string | null
  city: string
  state: string
  pincode?: string | null
  hospital_id?: string | null
  latitude?: number | null
  longitude?: number | null
  hplc_doc_url: string | null
  hplc_unique_id: string
  is_admin_verified: boolean
  thalassemia_type?: string | null
  transfusion_interval_days: number
  next_transfusion_date: string | null
  guardian_name?: string | null
  guardian_phone?: string | null
  notes?: string | null
  current_bridge_id: string | null
  created_at?: string
}

export interface TransfusionPlan {
  id: string
  patient_id: string
  blood_type: string
  packets_per_transfusion: number
  interval_days: number
  is_active: boolean
  next_due_date: string | null
}

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'assigned'
  | 'scheduled'
  | 'completed'
  | 'cancelled'

export interface TransfusionRequest {
  id: string
  patient_id: string
  requested_date: string | null
  window_start: string | null
  window_end: string | null
  status: RequestStatus
  assigned_donor_id: string | null
  hospital_id: string | null
  is_auto: boolean
  packets_required?: number
  created_at: string
}

export interface AdminDashboard {
  total_donors: number
  total_patients: number
  pending_requests: number
  pending_verifications: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface EligibilityResult {
  passed: boolean
  fail_reasons: string[]
}

export interface DonorFindResult {
  id: string
  city: string
  state?: string
  total_donations: number
  availability_prediction?: string
  confidence?: number
  distance_km?: number | null
  combined_score?: number | null
}

export const ELIGIBILITY_QUESTIONS = [
  { key: 'weight_adequate', label: 'Do you weigh at least 45 kg?', positive: true },
  { key: 'age_in_range', label: 'Are you between 18 and 65 years old?', positive: true },
  { key: 'has_low_hemoglobin', label: 'Do you have low hemoglobin (<12.5 g/dL)?', positive: false },
  { key: 'donated_recently', label: 'Have you donated blood in the last 90 days?', positive: false },
  { key: 'recent_illness_or_meds', label: 'Have you had illness or taken medication in the last 7 days?', positive: false },
  { key: 'recent_tattoo_piercing', label: 'Have you got a tattoo or piercing in the last 6 months?', positive: false },
  { key: 'recent_surgery_dental', label: 'Have you had surgery or dental work in the last 6 months?', positive: false },
  { key: 'pregnant_or_breastfeeding', label: 'Are you pregnant or breastfeeding?', positive: false },
  { key: 'chronic_disease', label: 'Do you have a chronic disease (diabetes, hypertension)?', positive: false },
  { key: 'blood_disorder', label: 'Do you have any blood disorder?', positive: false },
  { key: 'infectious_disease', label: 'Have you been diagnosed with HIV, Hepatitis B/C, or syphilis?', positive: false },
] as const

export const FAIL_REASON_LABELS: Record<string, string> = {
  weight_adequate: 'Insufficient weight',
  age_in_range: 'Age out of range',
  has_low_hemoglobin: 'Low hemoglobin',
  donated_recently: 'Recent donation',
  recent_illness_or_meds: 'Recent illness/medication',
  recent_tattoo_piercing: 'Recent tattoo/piercing',
  recent_surgery_dental: 'Recent surgery/dental',
  pregnant_or_breastfeeding: 'Pregnant or breastfeeding',
  chronic_disease: 'Chronic disease',
  blood_disorder: 'Blood disorder',
  infectious_disease: 'Infectious disease',
}

import React from 'react';
import {
  Laptop,
  Building2,
  UtensilsCrossed,
  GraduationCap,
  Trophy,
  Calendar,
  Sparkles,
  IndianRupee,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';
import { IssueCategory } from '@/types';

export interface CategoryMeta {
  category: IssueCategory;
  label: string;
  icon: LucideIcon;
  description: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  pillBg: string;
  pillText: string;
  activeRing: string;
}

export const CATEGORY_CONFIG: Record<IssueCategory, CategoryMeta> = {
  'Infra & IT': {
    category: 'Infra & IT',
    label: 'Infra & IT',
    icon: Laptop,
    description: 'Wi-Fi, networking, projectors, AC, electrical & IT lab equipment',
    bgClass: 'bg-blue-50/80 hover:bg-blue-100/80',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200/80',
    pillBg: 'bg-blue-50',
    pillText: 'text-blue-700',
    activeRing: 'ring-blue-600 bg-blue-50 text-blue-800 border-blue-300',
  },
  'Hostel life': {
    category: 'Hostel life',
    label: 'Hostel life',
    icon: Building2,
    description: 'Rooms, washrooms, hot water geysers, housekeeping, common rooms',
    bgClass: 'bg-indigo-50/80 hover:bg-indigo-100/80',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-200/80',
    pillBg: 'bg-indigo-50',
    pillText: 'text-indigo-700',
    activeRing: 'ring-indigo-600 bg-indigo-50 text-indigo-800 border-indigo-300',
  },
  'Mess and food': {
    category: 'Mess and food',
    label: 'Mess & Food',
    icon: UtensilsCrossed,
    description: 'Dining quality, meal hygiene, dining hall operations, special menus',
    bgClass: 'bg-amber-50/80 hover:bg-amber-100/80',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200/80',
    pillBg: 'bg-amber-50',
    pillText: 'text-amber-800',
    activeRing: 'ring-amber-600 bg-amber-50 text-amber-900 border-amber-300',
  },
  'Academics': {
    category: 'Academics',
    label: 'Academics',
    icon: GraduationCap,
    description: 'Classrooms, course materials, exam schedules, library services',
    bgClass: 'bg-emerald-50/80 hover:bg-emerald-100/80',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200/80',
    pillBg: 'bg-emerald-50',
    pillText: 'text-emerald-700',
    activeRing: 'ring-emerald-600 bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  'Sports facilities and events': {
    category: 'Sports facilities and events',
    label: 'Sports Facilities',
    icon: Trophy,
    description: 'Badminton & squash courts, gym equipment, tournaments, grounds',
    bgClass: 'bg-rose-50/80 hover:bg-rose-100/80',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-200/80',
    pillBg: 'bg-rose-50',
    pillText: 'text-rose-700',
    activeRing: 'ring-rose-600 bg-rose-50 text-rose-800 border-rose-300',
  },
  'Events': {
    category: 'Events',
    label: 'Campus Events',
    icon: Calendar,
    description: 'Conclaves, Manfest-Varchasva, guest speaker sessions, logistics',
    bgClass: 'bg-violet-50/80 hover:bg-violet-100/80',
    textClass: 'text-violet-700',
    borderClass: 'border-violet-200/80',
    pillBg: 'bg-violet-50',
    pillText: 'text-violet-700',
    activeRing: 'ring-violet-600 bg-violet-50 text-violet-800 border-violet-300',
  },
  'Cultural': {
    category: 'Cultural',
    label: 'Cultural & Clubs',
    icon: Sparkles,
    description: 'Club activities, music room, campus fests, student initiatives',
    bgClass: 'bg-fuchsia-50/80 hover:bg-fuchsia-100/80',
    textClass: 'text-fuchsia-700',
    borderClass: 'border-fuchsia-200/80',
    pillBg: 'bg-fuchsia-50',
    pillText: 'text-fuchsia-700',
    activeRing: 'ring-fuchsia-600 bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300',
  },
  'Finance and reimbursements': {
    category: 'Finance and reimbursements',
    label: 'Finance & Bills',
    icon: IndianRupee,
    description: 'Committee budgets, student reimbursements, billing queries',
    bgClass: 'bg-teal-50/80 hover:bg-teal-100/80',
    textClass: 'text-teal-700',
    borderClass: 'border-teal-200/80',
    pillBg: 'bg-teal-50',
    pillText: 'text-teal-700',
    activeRing: 'ring-teal-600 bg-teal-50 text-teal-800 border-teal-300',
  },
  'Other / not sure': {
    category: 'Other / not sure',
    label: 'Other Issues',
    icon: HelpCircle,
    description: 'General campus questions, multi-area inquiries, miscellaneous',
    bgClass: 'bg-gray-50/80 hover:bg-gray-100/80',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-200/80',
    pillBg: 'bg-gray-100',
    pillText: 'text-gray-700',
    activeRing: 'ring-gray-600 bg-gray-100 text-gray-800 border-gray-300',
  },
};

export const ALL_CATEGORIES: IssueCategory[] = [
  'Infra & IT',
  'Hostel life',
  'Mess and food',
  'Academics',
  'Sports facilities and events',
  'Events',
  'Cultural',
  'Finance and reimbursements',
  'Other / not sure',
];

export function getCategoryMeta(category: IssueCategory): CategoryMeta {
  return (
    CATEGORY_CONFIG[category] || {
      category,
      label: category,
      icon: HelpCircle,
      description: 'Campus issue category',
      bgClass: 'bg-gray-50 hover:bg-gray-100',
      textClass: 'text-gray-700',
      borderClass: 'border-gray-200',
      pillBg: 'bg-gray-100',
      pillText: 'text-gray-700',
      activeRing: 'ring-gray-600 bg-gray-100 text-gray-800 border-gray-300',
    }
  );
}

export function CategoryBadge({
  category,
  size = 'sm',
  className = '',
}: {
  category: IssueCategory;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;

  const sizeClasses = {
    xs: 'text-[11px] px-2 py-0.5 gap-1',
    sm: 'text-[12px] px-2.5 py-1 gap-1.5',
    md: 'text-[13px] px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${meta.pillBg} ${meta.pillText} ${meta.borderClass} ${sizeClasses[size]} ${className}`}
    >
      <Icon className={`${iconSizes[size]} shrink-0`} />
      <span>{meta.label}</span>
    </span>
  );
}

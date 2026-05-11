import React from 'react';
import {
    Home,
    CalendarDays,
    Users,
    Beer,
    Map,
    Mail,
    MapPin,
    Sparkles,
    Shield,
    User,
    LogOut,
    Menu,
    X,
    ChevronRight,
    TrendingUp,
    Calendar,
    Settings,
    ShieldCheck,
    FileText,
    Gift
} from 'lucide-react';

export const IconMap = {
    Home,
    CalendarDays,
    Users,
    Beer,
    Map,
    Mail,
    MapPin,
    Sparkles,
    Shield,
    User,
    LogOut,
    Menu,
    X,
    ChevronRight,
    TrendingUp,
    Calendar,
    Settings,
    ShieldCheck,
    FileText,
    Gift
} as const;

export type IconName = keyof typeof IconMap;

interface DynamicIconProps extends React.ComponentProps<typeof Home> {
    name: IconName | string;
}



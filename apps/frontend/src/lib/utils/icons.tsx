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

/**
 * A component that renders a Lucide icon based on a string name.
 * Useful for passing icons across the Server-Client boundary in Next.js.
 */
export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
    const IconComponent = IconMap[name as IconName];
    
    if (!IconComponent) {
        // Fallback to a default icon or null if name is invalid
        return <div className="w-1 h-1" />;
    }
    
    return <IconComponent {...props} />;
};

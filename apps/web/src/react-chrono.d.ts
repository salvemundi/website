declare module 'react-chrono' {
  import { ReactNode } from 'react';

  export interface TimelineItemModel {
    title?: string;
    cardTitle?: string;
    cardSubtitle?: string;
    cardDetailedText?: string | string[];
    media?: {
      type: 'IMAGE' | 'VIDEO';
      source: {
        url: string;
      };
    };
    timelineContent?: ReactNode;
  }

  export interface ChronoProps {
    items?: TimelineItemModel[];
    mode?: 'VERTICAL' | 'VERTICAL_ALTERNATING' | 'HORIZONTAL' | 'vertical' | 'horizontal' | 'alternating';
    slideShow?: boolean;
    slideItemDuration?: number;
    cardHeight?: number;
    scrollable?: boolean;
    theme?: {
      primary?: string;
      secondary?: string;
      cardBgColor?: string;
      cardForeColor?: string;
      titleColor?: string;
      titleColorActive?: string;
    };
    children?: ReactNode;
    onItemSelected?: (item: TimelineItemModel) => void;
    activeItemIndex?: number;
    disableNavOnKey?: boolean;
    enableOutline?: boolean;
    hideControls?: boolean;
    cardPositionHorizontal?: 'TOP' | 'BOTTOM';
    useReadMore?: boolean;
    flipLayout?: boolean;
    allowDynamicUpdate?: boolean;
    onScrollEnd?: () => void;
    fontSizes?: {
      cardSubtitle?: string;
      cardText?: string;
      cardTitle?: string;
      title?: string;
    };
    classNames?: {
      card?: string;
      cardMedia?: string;
      cardSubTitle?: string;
      cardText?: string;
      cardTitle?: string;
      controls?: string;
      title?: string;
    };
  }

  export const Chrono: React.FC<ChronoProps>;
}

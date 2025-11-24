import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Define the shape of the props for type safety
interface ActiviteitCardProps {
  description: string;
  image?: string;
  date?: string;
  title: string;
  price?: number;
  isPast?: boolean;
  onSignup?: (data: { title: string; date?: string; description: string; price: number }) => void;
  onShowDetails?: () => void;
  requiresLogin?: boolean;
  isSignedUp?: boolean;
  variant?: 'grid' | 'list';
  committeeName?: string;
}

const ActiviteitCard: React.FC<ActiviteitCardProps> = ({
  description,
  image,
  title,
  date,
  price,
  isPast = false,
  onSignup,
  onShowDetails,
  requiresLogin = false,
  isSignedUp = false,
  variant = 'grid',
  committeeName,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const alreadySignedUp = Boolean(isSignedUp);
  const isListVariant = variant === 'list';

  const handleSignupClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (alreadySignedUp) {
      return;
    }
    
    if (requiresLogin && !isAuthenticated) {
      // Redirect to login page
      navigate('/login');
      return;
    }
    
    // Call the original signup handler
    onSignup?.({ title, date, description, price: price || 0 });
  };

  const safePrice = (Number(price) || 0).toFixed(2);
  const committeeLabel = committeeName || 'Algemene Activiteit';

  const formatDate = (value?: string) => {
    if (!value) return 'Datum volgt';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (isListVariant) {
    return (
      <div
        onClick={onShowDetails}
        className={`w-full rounded-2xl border-2 border-paars/10 bg-white p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${isPast ? 'opacity-75' : ''}`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex-1 min-w-[180px]">
            <p className="text-xs uppercase tracking-wider text-paars/60 font-semibold">
              {committeeLabel}
            </p>
            <h3 className="text-lg font-bold text-paars leading-snug">{title}</h3>
          </div>

          <div className="flex flex-row flex-wrap gap-4 text-right text-paars font-semibold">
            <div className="min-w-[120px]">
              <p className="text-xs text-paars/60 uppercase tracking-wide">Datum</p>
              <p className="text-base">{formatDate(date)}</p>
            </div>
            <div className="min-w-[90px]">
              <p className="text-xs text-paars/60 uppercase tracking-wide">Prijs</p>
              <p className="text-base">€{safePrice}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowDetails?.();
            }}
            className="px-4 py-2 text-sm font-semibold rounded-full border border-paars text-paars hover:bg-paars hover:text-beige transition"
          >
            MEER INFO
          </button>

          {!isPast && (
            <button
              onClick={handleSignupClick}
              className={`${alreadySignedUp ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-paars text-beige hover:bg-opacity-90'} px-4 py-2 text-sm font-semibold rounded-full transition`}
              disabled={alreadySignedUp}
            >
              {alreadySignedUp ? 'AL AANGEMELD' : 'AANMELDEN'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onShowDetails}
      className="bg-paars p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col w-full overflow-hidden cursor-pointer transition-all hover:scale-[1.02] relative h-full"
    >
      {/* Greyed out overlay for past activities */}
      {isPast && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-40 rounded-2xl z-0 pointer-events-none" />
      )}

      {/* Image with rounded corners at the top - always show */}
        <div className="relative z-10">
        <img
          src={image || '/img/placeholder.svg'}
          alt={title}
          className="w-full h-40 sm:h-44 md:h-48 object-cover rounded-xl mb-4"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/img/placeholder.svg';
          }}
        />
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-grow text-white relative z-10">
        {/* Header - Title, Date, and Price */}
        <div className="flex flex-row justify-between items-start mb-2 gap-3 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold text-geel leading-tight pr-2 sm:pr-4 break-words w-full sm:flex-1">
            {title}
          </h1>
          <div className="flex flex-col items-end whitespace-nowrap text-right ml-auto">
            {date && (
              <p className="text-xs sm:text-sm font-semibold text-white">{date}</p>
            )}
            <span className="text-lg font-bold text-white">€{safePrice}</span>
          </div>
        </div>
        
        {/* Description - truncated to 150 characters */}
        <p className="text-white text-sm sm:text-base mb-4 sm:mb-6 flex-grow break-words overflow-hidden">
          {description && description.length > 150 
            ? `${description.substring(0, 150)}...` 
            : description}
        </p>
        
        {/* Footer - Buttons */}
  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-auto w-full">
          {/* Details Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowDetails?.();
            }}
      className="bg-white text-paars font-semibold px-5 py-3 rounded-full shadow-lg hover:bg-opacity-90 w-full sm:w-auto"
          >
            MEER INFO
          </button>
          
          {/* Sign-up Button */}
          {!isPast && (
            <button
              onClick={handleSignupClick}
              className={`${alreadySignedUp ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-geel text-white hover:bg-opacity-80'} font-semibold px-5 py-3 rounded-full shadow-lg w-full sm:w-auto flex items-center justify-center gap-2 transition`}
              disabled={alreadySignedUp}
            >
              {requiresLogin && !isAuthenticated && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {alreadySignedUp ? 'AL AANGEMELD' : 'AANMELDEN'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiviteitCard;

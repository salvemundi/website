import { Trip, TripActivity } from '@salvemundi/validations';

export interface TripPricingResult {
    base: number;
    discount: number;
    actPrice: number;
    total: number;
    deposit: number;
    remaining: number;
    toPayNow: number;
}

export interface ActivitySelection {
    activityId: number;
    options: Record<string, boolean>;
}

/**
 * Calculates the total pricing for a trip registration based on selected activities and member role.
 */
export function calculateTripPricing(
    trip: Trip,
    userRole: string | null | undefined,
    activitySelections: ActivitySelection[],
    allActivities: TripActivity[],
    paymentType: 'deposit' | 'final'
): TripPricingResult {
    const base = Number(trip.base_price || 0);
    const discount = (userRole === 'crew' ? Number(trip.crew_discount || 0) : 0);
    
    const actPrice = activitySelections.reduce((sum, sel) => {
        const activity = allActivities.find(a => a.id === sel.activityId);
        if (!activity) return sum;
        
        let total = Number(activity.price || 0);
        
        // Add sub-option prices if any
        if (activity.options && Array.isArray(activity.options)) {
            activity.options.forEach(opt => {
                const optId = opt.id;
                // Note: options in activity are objects with {id, name, price}
                if (optId && sel.options[optId]) {
                    total += Number(opt.price || 0);
                }
            });
        }
        return sum + total;
    }, 0);

    const total = base - discount + actPrice;
    const deposit = Number(trip.deposit_amount || 0);
    const remaining = total - deposit;
    const toPayNow = paymentType === 'deposit' ? deposit : remaining;

    return {
        base,
        discount,
        actPrice,
        total,
        deposit,
        remaining,
        toPayNow
    };
}

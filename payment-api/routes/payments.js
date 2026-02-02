const express = require('express');
const { COLLECTIONS, FIELDS } = require('../services/collections');
const { getEnvironment } = require('../services/env-utils');

module.exports = function (mollieClient, DIRECTUS_URL, DIRECTUS_API_TOKEN, EMAIL_SERVICE_URL, MEMBERSHIP_API_URL, directusService, notificationService, GRAPH_SYNC_URL) {
    const router = express.Router();

    // QR Token generation function (same as frontend)
    function generateQRToken(signupId, eventId) {
        const rand = Math.random().toString(36).substring(2, 15);
        const time = Date.now().toString(36);
        return `r-${signupId}-${eventId}-${time}-${rand}`;
    }

    router.post('/create', async (req, res) => {
        const traceId = req.headers['x-trace-id'] || `pay-${Math.random().toString(36).substring(7)}`;
        console.warn(`[Payment][${traceId}] Incoming Payment Creation Request`);

        try {
            const { amount, description, redirectUrl, userId, email, registrationId, registrationType, isContribution, firstName, lastName, couponCode, dateOfBirth, phoneNumber, qrToken } = req.body;

            console.warn(`[Payment][${traceId}] Payload:`, JSON.stringify({ amount, description, redirectUrl, userId, email, registrationId, registrationType, isContribution, couponCode, qrToken: qrToken ? 'provided' : 'missing' }));

            if (!amount || !description || !redirectUrl) {
                console.warn(`[Payment][${traceId}] Missing required parameters`);
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            // Start with base amount
            // Log the raw incoming amount and its type to help debug mismatches
            console.warn(`[Payment][${traceId}] Raw incoming amount type: ${typeof amount}, value: ${JSON.stringify(amount)}`);
            let finalAmount = parseFloat(amount);
            let couponId = null;
            let appliedDiscount = null;

            console.warn(`[Payment][${traceId}] Initial Amount: ${finalAmount}`);

            // 1. Automatic Committee Discount Check & Price Enforcement
            if (isContribution) {
                // If this is a guest signup (no userId), check if the email already exists to prevent duplicate accounts.
                if (!userId && email) {
                    const existingUser = await directusService.getUserByEmail(DIRECTUS_URL, DIRECTUS_API_TOKEN, email);
                    if (existingUser) {
                        console.warn(`[Payment][${traceId}] Signup blocked: email ${email} already has an account.`);
                        return res.status(400).json({
                            error: 'Dit e-mailadres is al bij ons bekend als lid. Log in met je @salvemundi.nl account om je lidmaatschap te beheren of te verlengen.'
                        });
                    }
                }

                // Default to standard price
                let standardPrice = 20.00;

                if (userId) {
                    console.warn(`[Payment][${traceId}] Checking committee status for user ${userId}`);
                    const isCommitteeMember = await directusService.checkUserCommittee(DIRECTUS_URL, DIRECTUS_API_TOKEN, userId);
                    if (isCommitteeMember) {
                        standardPrice = 10.00;
                        console.warn(`[Payment][${traceId}] Committee member detected. Base price set to 10.00`);
                    }
                }

                // Enforce the standard price, ignoring Client's 'amount' request for the base value
                finalAmount = standardPrice;
                console.warn(`[Payment][${traceId}] Contribution enforced amount: ${finalAmount}`);
            }

            // --- Server-side safety: if this is a trip final/rest payment, re-calc final amount
            // from authoritative Directus data so the deposit cannot be accidentally subtracted
            // by a client. We detect by registrationType and description containing 'restbetaling'.
            try {
                if (registrationType === 'trip_signup' && description && description.toLowerCase().includes('rest')) {
                    console.warn(`[Payment][${traceId}] Detected trip restpayment request - recalculating authoritative final amount`);
                    // Fetch trip signup and trip data
                    const tripSignup = registrationId ? await directusService.getDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'trip_signups', registrationId, 'id,trip_id,role,deposit_paid,full_payment_paid') : null;
                    if (tripSignup) {
                        const trip = await directusService.getDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'trips', tripSignup.trip_id, 'id,base_price,crew_discount,deposit_amount');
                        if (trip) {
                            // Get selected activities for signup
                            const signupActivities = await directusService.getTripSignupActivities(DIRECTUS_URL, DIRECTUS_API_TOKEN, registrationId);
                            let activitiesTotal = 0;
                            for (const sa of signupActivities) {
                                const act = sa.trip_activity_id;
                                if (!act) continue;

                                // Base price of activity
                                activitiesTotal += Number(act.price) || 0;

                                // Add prices for selected options
                                try {
                                    const opts = sa.selected_options;
                                    const selectedOptions = Array.isArray(opts) ? opts : (typeof opts === 'string' ? JSON.parse(opts) : []);

                                    if (Array.isArray(selectedOptions) && act.options) {
                                        selectedOptions.forEach(optName => {
                                            const optDef = act.options.find(o => o.name === optName);
                                            if (optDef) {
                                                activitiesTotal += Number(optDef.price) || 0;
                                            }
                                        });
                                    }
                                } catch (e) {
                                    console.warn(`[Payment][${traceId}] Failed to parse/process options for activity ${act.id}:`, e.message);
                                }
                            }

                            const base = Number(trip.base_price) || 0;
                            const discount = tripSignup.role === 'crew' ? (Number(trip.crew_discount) || 0) : 0;
                            const deposit = Number(trip.deposit_amount) || 0;
                            const authoritativeTotal = base + activitiesTotal - discount - deposit;
                            finalAmount = Math.max(0, authoritativeTotal);
                            console.warn(`[Payment][${traceId}] Recalculated authoritative amount (with deposit correction): ${finalAmount}`);
                        }
                    }
                }
            } catch (recalcErr) {
                console.error(`[Payment][${traceId}] Error during authoritative amount recalculation:`, recalcErr.message || recalcErr);
                // Continue with original finalAmount if recalc failed
            }

            // 2. Coupon Code Application (Manual)
            if (couponCode) {
                console.warn(`[Payment][${traceId}] Validating coupon code: ${couponCode}`);
                // Use the new signature with traceId
                const coupon = await directusService.getCoupon(DIRECTUS_URL, DIRECTUS_API_TOKEN, couponCode, traceId);

                if (coupon) {
                    console.warn(`[Payment][${traceId}] Coupon found: ${coupon.id}. Checking constraints...`);
                    // Check limits again (double check server side)
                    const now = new Date();
                    let isValid = true;
                    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
                        console.warn(`[Payment][${traceId}] Coupon not started yet.`);
                        isValid = false;
                    }
                    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
                        console.warn(`[Payment][${traceId}] Coupon expired.`);
                        isValid = false;
                    }
                    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
                        console.warn(`[Payment][${traceId}] Usage limit reached.`);
                        isValid = false;
                    }

                    if (isValid) {
                        couponId = coupon.id; // Store for updating usage later

                        // Apply discount
                        if (coupon.discount_type === 'percentage') {
                            const discount = finalAmount * (parseFloat(coupon.discount_value) / 100);
                            finalAmount = finalAmount - discount;
                            console.warn(`[Payment][${traceId}] Applied ${coupon.discount_value}% discount. New Amount: ${finalAmount}`);
                        } else {
                            finalAmount = finalAmount - parseFloat(coupon.discount_value);
                            console.warn(`[Payment][${traceId}] Applied ${coupon.discount_value} fixed discount. New Amount: ${finalAmount}`);
                        }

                        // Ensure no negative amount
                        if (finalAmount < 0) finalAmount = 0;
                    } else {
                        console.warn(`[Payment][${traceId}] Coupon invalid constraints.`);
                    }
                } else {
                    console.warn(`[Payment][${traceId}] Coupon code provided but not found/active.`);
                }
            }

            // Format for Mollie / Transaction
            const formattedAmount = finalAmount.toFixed(2);
            console.warn(`[Payment][${traceId}] Final Transaction Amount: ${formattedAmount}`);

            // Detect environment from request (what the client claims)
            const requestEnvironment = getEnvironment(req);

            // STRICT SERVER-SIDE ENFORCEMENT
            // If the SERVER is not strictly 'production', we NEVER auto-approve.
            // This prevents a dev server from auto-provisioning accounts even if the request claims to be production.
            const serverEnv = process.env.NODE_ENV || 'development';
            let approvalStatus = 'pending';

            if (serverEnv === 'production') {
                // In production, we trust the flow to auto-approve normal signups...
                // UNLESS Manual Approval is triggered via site settings.

                // Fetch settings
                try {
                    const settings = await directusService.getPaymentSettings(DIRECTUS_URL, DIRECTUS_API_TOKEN);
                    if (settings && settings.manual_approval === true) {
                        console.warn(`[Payment][${traceId}] Manual Approval Mode is ACTIVE. Forcing 'pending' status.`);
                        approvalStatus = 'pending';
                    } else {
                        approvalStatus = 'auto_approved';
                    }
                } catch (err) {
                    console.error(`[Payment][${traceId}] Failed to check manual approval settings, defaulting to auto_approved:`, err);
                    approvalStatus = 'auto_approved';
                }
            } else {
                // In dev/test, we FORCE pending.
                if (requestEnvironment === 'production') {
                    console.warn(`[Payment][${traceId}] SECURITY ALERT: Request claimed 'production' but server is '${serverEnv}'. Forcing status to 'pending'.`);
                }
                approvalStatus = 'pending';
            }



            let effectiveEnvironment = requestEnvironment;
            if (serverEnv !== 'production') {
                // Force 'development' tag on data if server is dev
                effectiveEnvironment = 'development';
            }

            const transactionPayload = {
                amount: formattedAmount,
                product_name: description,
                payment_status: 'open',
                email: email || null,
                first_name: firstName || null,
                last_name: lastName || null,
                date_of_birth: dateOfBirth || null,
                registration: registrationType === 'pub_crawl_signup' ? null : (registrationType === 'trip_signup' ? null : (registrationId || null)),
                pub_crawl_signup: registrationType === 'pub_crawl_signup' ? (registrationId || null) : null,
                trip_signup: registrationType === 'trip_signup' ? (registrationId || null) : null,
                environment: effectiveEnvironment,
                approval_status: approvalStatus,
                coupon_code: couponCode || null,
            };

            if (userId) {
                transactionPayload.user_id = userId;
            }

            console.warn(`[Payment][${traceId}] Creating Directus Transaction record...`);
            const transactionRecordId = await directusService.createDirectusTransaction(
                DIRECTUS_URL,
                DIRECTUS_API_TOKEN,
                transactionPayload
            );
            console.warn(`[Payment][${traceId}] Directus Transaction ID: ${transactionRecordId}`);

            // --- ZERO AMOUNT HANDLING ---
            if (finalAmount <= 0) {
                console.warn(`[Payment][${traceId}] Zero amount transaction detected. Skipping Mollie.`);

                // Update Transaction to PAID immediately
                const internalIds = `FREE-${Date.now()}`;

                try {
                    await directusService.updateDirectusTransaction(
                        DIRECTUS_URL,
                        DIRECTUS_API_TOKEN,
                        transactionRecordId,
                        {
                            payment_status: 'paid',
                            transaction_id: internalIds,
                            payment_method: 'voucher'
                        }
                    );
                } catch (err) {
                    console.error(`[Payment][${traceId}] Failed to update zero-amount transaction:`, err);
                    throw err;
                }

                // Increment coupon usage if applicable
                if (couponId) {
                    try {
                        const coupon = await directusService.getCoupon(DIRECTUS_URL, DIRECTUS_API_TOKEN, couponCode, traceId);
                        if (coupon) {
                            await directusService.updateCouponUsage(DIRECTUS_URL, DIRECTUS_API_TOKEN, coupon.id, (coupon.usage_count || 0) + 1);
                            console.warn(`[Payment][${traceId}] Incremented usage for coupon ${coupon.id}`);
                        }
                    } catch (err) {
                        console.error(`[Payment][${traceId}] Failed to increment coupon usage:`, err);
                        // Do not fail the flow for this
                    }
                }

                // Trigger Post-Payment Logic directly
                // (Replicating Webhook Logic partially for paid status)
                try {
                    if (registrationId) {
                        const collection = registrationType === 'pub_crawl_signup' ? 'pub_crawl_signups' : 'event_signups';
                        await directusService.updateDirectusItem(
                            DIRECTUS_URL,
                            DIRECTUS_API_TOKEN,
                            collection,
                            registrationId,
                            { payment_status: 'paid' }
                        );
                    }

                    if (isContribution) {
                        if (userId) {
                            await membershipService.provisionMember(MEMBERSHIP_API_URL, userId);

                            // Update Directus status and expiry immediately for renewals
                            const now = new Date();
                            const expiryDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                            const expiryStr = expiryDate.toISOString().split('T')[0];
                            try {
                                await directusService.updateDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'users', userId, {
                                    membership_status: 'active',
                                    membership_expiry: expiryStr
                                });
                            } catch (err) {
                                console.error(`[Payment][${traceId}] Failed to update Directus user for renewal (Zero Amount):`, err?.message || err);
                            }

                            // Trigger sync for existing user renewal
                            await membershipService.syncUserToDirectus(GRAPH_SYNC_URL, userId);

                            // Send confirmation email for renewal (Zero Amount)
                            const mockMetadata = {
                                firstName, lastName, email, amount: '0.00'
                            };
                            await notificationService.sendConfirmationEmail(
                                DIRECTUS_URL, DIRECTUS_API_TOKEN, EMAIL_SERVICE_URL,
                                mockMetadata, description
                            );
                        } else if (firstName && lastName && email) {
                            // Calculate expiry date (1 year from now)
                            const now = new Date();
                            const expiryDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                            const expiryStr = expiryDate.toISOString().split('T')[0];

                            // Try to create a Directus user so we have the date_of_birth set
                            let directusUser = null;
                            try {
                                directusUser = await directusService.createDirectusUser(DIRECTUS_URL, DIRECTUS_API_TOKEN, {
                                    first_name: firstName,
                                    last_name: lastName,
                                    email: email,
                                    date_of_birth: dateOfBirth || null,
                                    status: 'active',
                                    membership_status: 'active',
                                    membership_expiry: expiryStr
                                });
                                console.warn(`[Payment][${traceId}] Created Directus user ${directusUser.id} for ${email} (Zero Amount)`);
                            } catch (err) {
                                console.error(`[Payment][${traceId}] Failed to create Directus user before membership create (Zero Amount):`, err?.message || err);
                            }

                            const credentials = await membershipService.createMember(
                                MEMBERSHIP_API_URL, firstName, lastName, email
                            );
                            if (credentials) {
                                // Explicitly link the Directus user if we created one
                                if (directusUser && directusUser.id) {
                                    try {
                                        await directusService.updateDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'users', directusUser.id, {
                                            entra_id: credentials.user_id,
                                            external_identifier: credentials.user_id
                                        });
                                        console.warn(`[Payment][${traceId}] Linked Directus user ${directusUser.id} to Entra ID ${credentials.user_id} (Zero Amount)`);
                                    } catch (linkErr) {
                                        console.error(`[Payment][${traceId}] Failed to link user after creation (Zero Amount):`, linkErr.message);
                                    }
                                }

                                // Trigger sync for newly created user to sync membership_expiry to Directus
                                await membershipService.syncUserToDirectus(GRAPH_SYNC_URL, credentials.user_id);

                                await notificationService.sendWelcomeEmail(
                                    EMAIL_SERVICE_URL, email, firstName, credentials
                                );
                            }
                        }
                    } else {
                        if (registrationId) {
                            const mockMetadata = {
                                firstName, lastName, email, registrationId, registrationType, amount: '0.00'
                            };
                            await notificationService.sendConfirmationEmail(
                                DIRECTUS_URL, DIRECTUS_API_TOKEN, EMAIL_SERVICE_URL,
                                mockMetadata, description
                            );
                        }
                    }
                } catch (postErr) {
                    console.error(`[Payment][${traceId}] Post-payment logic error:`, postErr);
                    // Log but continue, critical path (payment) is done
                }

                const successUrl = new URL(redirectUrl);
                successUrl.searchParams.append('status', 'paid');
                successUrl.searchParams.append('transaction_id', transactionRecordId);

                return res.json({
                    checkoutUrl: successUrl.toString(),
                    paymentId: internalIds
                });
            }

            // --- END ZERO AMOUNT HANDLING ---

            // Standard Mollie Flow for > 0
            const metadata = {
                transactionRecordId: transactionRecordId,
                registrationId: registrationId,
                registrationType: registrationType || 'event_signup', // Default to event_signup for safety
                notContribution: isContribution ? "false" : "true",
                email: email,
                amount: formattedAmount,
                userId: userId || null,
                firstName: firstName || null,
                lastName: lastName || null,
                couponId: couponId,
                dateOfBirth: dateOfBirth || null,
                phoneNumber: phoneNumber || null,
                qrToken: qrToken || null // Add QR token to Mollie metadata
            };

            console.warn(`[Payment][${traceId}] Creating Mollie Payment... Value: ${formattedAmount}`);
            console.warn(`[Payment][${traceId}] QR Token in metadata:`, qrToken ? 'YES' : 'NO');

            if (!mollieClient) {
                console.error(`[Payment][${traceId}] Mollie Client not initialized. Check MOLLIE_API_KEY.`);
                throw new Error('Betalingsprovider niet geconfigureerd in deze omgeving.');
            }

            const finalRedirectUrl = new URL(redirectUrl);
            finalRedirectUrl.searchParams.append('transaction_id', transactionRecordId);

            const payment = await mollieClient.payments.create({
                amount: {
                    currency: 'EUR',
                    value: formattedAmount,
                },
                description: description,
                redirectUrl: finalRedirectUrl.toString(),
                webhookUrl: process.env.MOLLIE_WEBHOOK_URL,
                metadata: metadata
            });

            console.warn(`[Payment][${traceId}] Mollie Payment Created: ${payment.id}`);
            // Log what Mollie reports back for the amount and the checkout URL to verify the transmitted value
            try {
                console.warn(`[Payment][${traceId}] Mollie reported amount: ${payment.amount?.value} ${payment.amount?.currency}`);
                console.warn(`[Payment][${traceId}] Mollie checkout URL: ${payment.getCheckoutUrl ? payment.getCheckoutUrl() : payment.checkoutUrl || payment._links?.checkout?.href}`);
            } catch (logErr) {
                console.warn(`[Payment][${traceId}] Could not log full Mollie payment details:`, logErr?.message || logErr);
            }

            await directusService.updateDirectusTransaction(
                DIRECTUS_URL,
                DIRECTUS_API_TOKEN,
                transactionRecordId,
                { transaction_id: payment.id }
            );

            res.json({
                checkoutUrl: payment.getCheckoutUrl(),
                paymentId: payment.id
            });

        } catch (error) {
            console.error(`[Payment][${traceId || 'unknown'}] Create Error:`, error.message);
            // Log full error stack if possible
            if (error.stack) console.error(error.stack);

            res.status(500).json({ error: 'Failed to create payment.', details: error.message });
        }
    });

    router.post('/webhook', async (req, res) => {
        const traceId = `hook-${Math.random().toString(36).substring(7)}`;
        console.warn(`[Webhook][${traceId}] Incoming webhook request`);

        try {
            const paymentId = req.body.id;

            if (!paymentId) {
                console.warn(`[Webhook][${traceId}] Missing payment ID`);
                return res.status(400).send('Missing payment ID.');
            }

            console.warn(`[Webhook][${traceId}] Processing payment: ${paymentId}`);
            const payment = await mollieClient.payments.get(paymentId);
            const { transactionRecordId, registrationId, notContribution, userId, firstName, lastName, email, couponId, dateOfBirth, qrToken } = payment.metadata;

            console.warn(`[Webhook][${traceId}] Metadata:`, JSON.stringify(payment.metadata));
            console.warn(`[Webhook][${traceId}] QR Token in metadata:`, qrToken ? 'YES' : 'NO');

            let internalStatus = 'open';
            if (payment.isPaid()) internalStatus = 'paid';
            else if (payment.isFailed()) internalStatus = 'failed';
            else if (payment.isCanceled()) internalStatus = 'canceled';
            else if (payment.isExpired()) internalStatus = 'expired';

            console.warn(`[Webhook][${traceId}] Mollie Status: ${payment.status} -> Internal: ${internalStatus}`);

            if (transactionRecordId) {
                console.warn(`[Webhook][${traceId}] Updating transaction ${transactionRecordId} to ${internalStatus}`);
                await directusService.updateDirectusTransaction(
                    DIRECTUS_URL,
                    DIRECTUS_API_TOKEN,
                    transactionRecordId,
                    { payment_status: internalStatus }
                );
            } else {
                console.warn(`[Webhook][${traceId}] No transactionRecordId in metadata!`);
            }

            if (payment.isPaid()) {
                // 1. ALWAYS update the registration/signup status if we have a registrationId
                if (registrationId) {
                    let collection = 'event_signups';
                    let updatePayload = { payment_status: 'paid' };

                    if (payment.metadata.registrationType === 'pub_crawl_signup') {
                        collection = COLLECTIONS.PUB_CRAWL_SIGNUPS;

                        // Fetch the signup to get the pub_crawl_event_id and amount_tickets for individual ticket generation
                        try {
                            const signup = await directusService.getDirectusItem(
                                DIRECTUS_URL,
                                DIRECTUS_API_TOKEN,
                                collection,
                                registrationId,
                                '*'
                            );

                            if (signup) {
                                console.warn(`[Webhook][${traceId}] Signup ${registrationId} keys:`, Object.keys(signup).join(', '));
                                console.warn(`[Webhook][${traceId}] Full signup data:`, JSON.stringify(signup));
                            }

                            if (!signup) {
                                const maskedToken = DIRECTUS_API_TOKEN ? `${DIRECTUS_API_TOKEN.substring(0, 4)}...${DIRECTUS_API_TOKEN.slice(-4)}` : 'MISSING';
                                console.error(`[Webhook][${traceId}] ❌ Failed to fetch signup ${registrationId} from ${collection}. Status 403 or not found.`);
                                console.error(`[Webhook][${traceId}] Directus URL: ${DIRECTUS_URL}`);
                                console.error(`[Webhook][${traceId}] Directus Token: ${maskedToken}`);
                                throw new Error(`Could not fetch signup ${registrationId} from ${collection}. Aborting ticket generation to prevent data corruption.`);
                            }

                            const pubCrawlEventId = signup?.pub_crawl_event_id || 0;
                            const amountTickets = signup?.amount_tickets || 1;
                            const nameInitialsRaw = signup?.name_initials;

                            let participants = [];
                            try {
                                if (nameInitialsRaw) {
                                    participants = typeof nameInitialsRaw === 'string' ? JSON.parse(nameInitialsRaw) : nameInitialsRaw;
                                }
                            } catch (e) {
                                console.error(`[Webhook][${traceId}] Failed to parse name_initials:`, e);
                            }

                            // If no participants found or length mismatch, create placeholders
                            if (!Array.isArray(participants) || participants.length === 0) {
                                participants = Array.from({ length: amountTickets }).map((_, i) => ({
                                    name: `Deelnemer ${i + 1}`,
                                    initial: ''
                                }));
                            }

                            console.warn(`[Webhook][${traceId}] Generating ${participants.length} individual tickets for signup ${registrationId}`);

                            try {
                                // Generate and store individual tickets
                                const ticketPromises = participants.map(async (p, index) => {
                                    const qrToken = generateQRToken(`${registrationId}-${index}`, pubCrawlEventId);

                                    return directusService.createDirectusItem(
                                        DIRECTUS_URL,
                                        DIRECTUS_API_TOKEN,
                                        COLLECTIONS.PUB_CRAWL_TICKETS,
                                        {
                                            [FIELDS.TICKETS.SIGNUP_ID]: registrationId,
                                            [FIELDS.TICKETS.NAME]: p.name || `Deelnemer ${index + 1}`,
                                            [FIELDS.TICKETS.INITIAL]: p.initial || '',
                                            [FIELDS.TICKETS.QR_TOKEN]: qrToken,
                                            [FIELDS.TICKETS.CHECKED_IN]: false
                                        }
                                    );
                                });

                                await Promise.all(ticketPromises);
                                console.warn(`[Webhook][${traceId}] ✅ Successfully generated all ${participants.length} tickets`);
                            } catch (ticketErr) {
                                console.error(`[Webhook][${traceId}] ❌ Failed to generate individual tickets, but continuing to mark signup as paid:`, ticketErr.message);
                            }

                            // Update payload for the signup itself
                            updatePayload = {
                                [FIELDS.SIGNUPS.PAYMENT_STATUS]: 'paid'
                            };

                        } catch (err) {
                            console.error(`[Webhook][${traceId}] Failed to process pub_crawl tickets:`, err);
                            throw err; // Important to throw so we don't proceed to mail index if DB fails
                        }
                    } else if (payment.metadata.registrationType === 'trip_signup') {
                        collection = 'trip_signups';
                        // For trip signups, check description to determine if it's deposit or final payment
                        if (payment.description.toLowerCase().includes('aanbetaling')) {
                            updatePayload = {
                                deposit_paid: true,
                                deposit_paid_at: new Date().toISOString()
                            };
                        } else if (payment.description.toLowerCase().includes('restbetaling')) {
                            updatePayload = {
                                full_payment_paid: true,
                                full_payment_paid_at: new Date().toISOString()
                            };
                        }
                    }

                    console.warn(`[Webhook][${traceId}] Updating ${collection} ${registrationId} with payload:`, JSON.stringify(updatePayload));
                    try {
                        await directusService.updateDirectusItem(
                            DIRECTUS_URL,
                            DIRECTUS_API_TOKEN,
                            collection,
                            registrationId,
                            updatePayload
                        );
                        console.warn(`[Webhook][${traceId}] ✅ Successfully updated ${collection} ${registrationId}`);
                    } catch (updateErr) {
                        console.error(`[Webhook][${traceId}] ❌ Failed to update ${collection} ${registrationId}:`, updateErr.message);
                        console.error(`[Webhook][${traceId}] Update payload was:`, JSON.stringify(updatePayload));
                        if (updateErr.response?.data) {
                            console.error(`[Webhook][${traceId}] Directus error response:`, JSON.stringify(updateErr.response.data));
                        }
                        throw updateErr; // Re-throw to prevent email from being sent if update fails
                    }
                } // End if (registrationId)

                // 2. ALWAYS send confirmation email if it's NOT a contribution (normal events/pub-crawl/trip)
                if (notContribution === "true" && registrationId) {
                    console.warn(`[Webhook][${traceId}] Sending non-contribution confirmation email`);

                    // Send trip-specific email for trip signups
                    if (payment.metadata.registrationType === 'trip_signup') {
                        console.warn(`[Webhook][${traceId}] Detected trip_signup, fetching trip data for email...`);
                        try {
                            const tripSignup = await directusService.getDirectusItem(
                                DIRECTUS_URL,
                                DIRECTUS_API_TOKEN,
                                'trip_signups',
                                registrationId,
                                'id,first_name,middle_name,last_name,email,role,trip_id'
                            );
                            console.warn(`[Webhook][${traceId}] Trip signup fetched:`, {
                                id: tripSignup.id,
                                email: tripSignup.email,
                                trip_id: tripSignup.trip_id
                            });

                            const trip = await directusService.getDirectusItem(
                                DIRECTUS_URL,
                                DIRECTUS_API_TOKEN,
                                'trips',
                                tripSignup.trip_id,
                                'id,name,event_date,start_date,end_date,base_price,deposit_amount,crew_discount,is_bus_trip'
                            );
                            console.warn(`[Webhook][${traceId}] Trip fetched:`, {
                                id: trip.id,
                                name: trip.name
                            });

                            const paymentType = payment.description.toLowerCase().includes('aanbetaling') ? 'deposit' : 'final';
                            console.warn(`[Webhook][${traceId}] Payment type detected: ${paymentType}`);
                            console.warn(`[Webhook][${traceId}] Calling sendTripPaymentConfirmation...`);

                            await notificationService.sendTripPaymentConfirmation(
                                EMAIL_SERVICE_URL,
                                tripSignup,
                                trip,
                                paymentType
                            );
                            console.warn(`[Webhook][${traceId}] ✅ Trip payment confirmation email sent successfully!`);
                        } catch (err) {
                            console.error(`[Webhook][${traceId}] ❌ Failed to send trip payment confirmation:`, err);
                            console.error(`[Webhook][${traceId}] Error details:`, err.message, err.stack);
                        }
                    } else if (payment.metadata.registrationType !== 'pub_crawl_signup') {
                        console.warn(`[Webhook][${traceId}] Not a trip_signup, sending regular confirmation email`);
                        // Regular confirmation email for events
                        await notificationService.sendConfirmationEmail(
                            DIRECTUS_URL,
                            DIRECTUS_API_TOKEN,
                            EMAIL_SERVICE_URL,
                            payment.metadata,
                            payment.description
                        );
                    } else {
                        console.warn(`[Webhook][${traceId}] Skipping generic confirmation email for pub_crawl_signup (tickets will be sent separately)`);
                    }
                }

                // 3. Check approval status ONLY for membership provisioning
                if (transactionRecordId) {
                    const transaction = await directusService.getTransaction(
                        DIRECTUS_URL,
                        DIRECTUS_API_TOKEN,
                        transactionRecordId
                    );

                    console.warn(`[Webhook][${traceId}] Transaction fetched:`, JSON.stringify(transaction));

                    if (transaction &&
                        transaction.approval_status !== 'approved' &&
                        transaction.approval_status !== 'auto_approved') {
                        console.warn(`[Webhook][${traceId}] Payment paid but approval pending/rejected. Status: ${transaction.approval_status}. Stopping auto-provisioning.`);
                        return res.status(200).send('Payment recorded, status updated, but approval pending for provisioning');
                    }
                }

                // 4. Provisioning logic (only reached if approved/auto-approved)
                if (notContribution === "false") {
                    if (userId) {
                        await membershipService.provisionMember(MEMBERSHIP_API_URL, userId);

                        // Update Directus status and expiry immediately for renewals
                        const now = new Date();
                        const expiryDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                        const expiryStr = expiryDate.toISOString().split('T')[0];
                        try {
                            await directusService.updateDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'users', userId, {
                                membership_status: 'active',
                                membership_expiry: expiryStr
                            });
                        } catch (err) {
                            console.error(`[Webhook][${traceId}] Failed to update Directus user for renewal:`, err?.message || err);
                        }

                        // Trigger sync for existing user renewal
                        await membershipService.syncUserToDirectus(GRAPH_SYNC_URL, userId);

                        // Always send confirmation for paid renewals
                        await notificationService.sendConfirmationEmail(
                            DIRECTUS_URL,
                            DIRECTUS_API_TOKEN,
                            EMAIL_SERVICE_URL,
                            payment.metadata,
                            payment.description
                        );

                        // Also increment coupon usage if applicable
                        if (couponId) {
                            // Coupon increment logic skipped for now
                        }
                    } else if (firstName && lastName && email) {
                        // Calculate expiry date (1 year from now)
                        const now = new Date();
                        const expiryDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                        const expiryStr = expiryDate.toISOString().split('T')[0];

                        // Try to create a Directus user so we have the date_of_birth set
                        let directusUser = null;
                        try {
                            directusUser = await directusService.createDirectusUser(DIRECTUS_URL, DIRECTUS_API_TOKEN, {
                                first_name: firstName,
                                last_name: lastName,
                                email: email,
                                date_of_birth: dateOfBirth || null,
                                status: 'active',
                                membership_status: 'active',
                                membership_expiry: expiryStr
                            });
                            console.warn(`[Payment][${traceId}] Created Directus user ${directusUser?.id} for ${email}`);
                        } catch (err) {
                            console.error(`[Payment][${traceId}] Failed to create Directus user before membership create:`, err?.message || err);
                        }

                        const credentials = await membershipService.createMember(
                            MEMBERSHIP_API_URL, firstName, lastName, email
                        );

                        if (credentials) {
                            // Explicitly link the Directus user if we just created one
                            if (directusUser && directusUser.id) {
                                try {
                                    await directusService.updateDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'users', directusUser.id, {
                                        entra_id: credentials.user_id,
                                        external_identifier: credentials.user_id
                                    });
                                    console.warn(`[Payment][${traceId}] Linked Directus user ${directusUser.id} to Entra ID ${credentials.user_id}`);
                                } catch (linkErr) {
                                    console.error(`[Payment][${traceId}] Failed to link user after creation:`, linkErr.message);
                                }
                            }

                            // Trigger sync for newly created user to sync membership_expiry to Directus
                            await membershipService.syncUserToDirectus(GRAPH_SYNC_URL, credentials.user_id);

                            await notificationService.sendWelcomeEmail(
                                EMAIL_SERVICE_URL, email, firstName, credentials
                            );
                        }
                    }
                } else {
                    if (registrationId) {
                        await notificationService.sendConfirmationEmail(
                            DIRECTUS_URL,
                            DIRECTUS_API_TOKEN,
                            EMAIL_SERVICE_URL,
                            payment.metadata,
                            payment.description
                        );
                    }
                }
            }
            res.status(200).send('OK');

        } catch (error) {
            console.error(`[Webhook][${traceId || 'err'}] Error:`, error.message);
            if (error.stack) console.error(error.stack);
            res.status(200).send('Webhook processed with errors');
        }
    });

    return router;
};
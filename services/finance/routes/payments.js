const express = require('express');
const axios = require('axios');
const { COLLECTIONS, FIELDS } = require('../services/collections');
const { getEnvironment } = require('../services/env-utils');

module.exports = function (mollieClient, DIRECTUS_URL, DIRECTUS_API_TOKEN, EMAIL_SERVICE_URL, MEMBERSHIP_API_URL, directusService, notificationService, GRAPH_SYNC_URL, membershipService, ADMIN_API_URL) {
    const router = express.Router();

    // QR Token generation function (same as frontend)
    function generateQRToken(signupId, eventId) {
        const rand = Math.random().toString(36).substring(2, 15);
        const time = Date.now().toString(36);
        return `r-${signupId}-${eventId}-${time}-${rand}`;
    }

    async function delegateProvisioning(traceId, data) {
        if (!ADMIN_API_URL) {
            console.error(`[Payment][${traceId}] ❌ ADMIN_API_URL not configured! Cannot delegate provisioning.`);
            throw new Error('Provisioning failed: Admin API not reachable');
        }

        try {
            console.warn(`[Payment][${traceId}] 👑 Delegating provisioning to Admin API...`);
            const response = await axios.post(`${ADMIN_API_URL}/api/internal/provision-member`, data, {
                headers: {
                    'x-api-key': process.env.INTERNAL_API_KEY,
                    'Content-Type': 'application/json',
                    'x-trace-id': traceId
                },
                timeout: 30000
            });
            console.warn(`[Payment][${traceId}] ✅ Admin API provisioning successful:`, response.data.message);
            return response.data;
        } catch (error) {
            console.error(`[Payment][${traceId}] ❌ Admin API delegation failed:`, error.response?.data || error.message);
            throw error;
        }
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

            // Open Redirect Protection
            try {
                const redirectObj = new URL(redirectUrl, 'https://salvemundi.nl'); // second arg allows relative URLs to parse
                const allowedDomains = ['salvemundi.nl', 'www.salvemundi.nl', 'dev.salvemundi.nl', 'preprod.salvemundi.nl', 'localhost'];

                // Check if the hostname is allowed (if it's an absolute URL)
                // If it was relative, the hostname will be the base (salvemundi.nl), which is allowed.
                // We also check protocol to be http/https
                if (!allowedDomains.some(d => redirectObj.hostname === d || redirectObj.hostname.endsWith('.' + d))) {
                    console.error(`[Payment][${traceId}] 🚨 Blocked Open Redirect attempt: ${redirectUrl}`);
                    return res.status(400).json({ error: 'Invalid redirect URL. Must be a @salvemundi.nl domain.' });
                }
            } catch (err) {
                console.error(`[Payment][${traceId}] 🚨 Invalid redirect URL format: ${redirectUrl}`);
                return res.status(400).json({ error: 'Invalid redirect URL format' });
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
                    let isValid = true;
                    console.warn(`[Payment][${traceId}] Coupon found: ${coupon.id}. Checking constraints...`);
                    // 1. Check if manually active
                    const isManuallyActive = String(coupon.is_active) === 'true';

                    if (!isManuallyActive) {
                        console.warn(`[Payment][${traceId}] Coupon is manually deactivated.`);
                        isValid = false;
                    }

                    // 2. Check limits and dates
                    const now = new Date();
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

            let productType = 'attention_required';
            if (isContribution) {
                productType = userId ? 'membership_renewal' : 'membership_new';
            } else if (registrationType === 'pub_crawl_signup') {
                productType = 'pub_crawl';
            } else if (registrationType === 'trip_signup') {
                productType = 'trip';
            } else if (registrationType === 'event_signup') {
                productType = 'event';
            }

            if (productType === 'attention_required') {
                console.warn(`[Payment][${traceId}] 🚨 CRITICAL: Could not determine product_type for registrationType: ${registrationType}, isContribution: ${isContribution}`);
            }

            const transactionPayload = {
                amount: formattedAmount,
                product_name: description,
                payment_status: 'open',
                email: email || null,
                first_name: firstName || null,
                last_name: lastName || null,
                registration: registrationType === 'pub_crawl_signup' ? null : (registrationType === 'trip_signup' ? null : (registrationId || null)),
                pub_crawl_signup: registrationType === 'pub_crawl_signup' ? (registrationId || null) : null,
                trip_signup: registrationType === 'trip_signup' ? (registrationId || null) : null,
                environment: effectiveEnvironment,
                approval_status: approvalStatus,
                coupon_code: couponCode || null,
                product_type: productType,
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
                        await delegateProvisioning(traceId, {
                            userId,
                            firstName,
                            lastName,
                            email,
                            dateOfBirth,
                            phoneNumber,
                            description
                        });
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

    /**
     * Idempotent & Fail-Safe Mollie Webhook Handler
     * Enforces Zero Trust boundaries and ensures reliable provisioning.
     */
    router.post('/webhook', async (req, res) => {
        const mollieId = req.body.id;

        if (!mollieId) {
            console.warn('⚠️ Webhook received without Mollie ID');
            return res.status(400).send('Missing ID');
        }

        console.log(`Webhook received for ${mollieId}`);

        try {
            // 1. Idempotency Check (Crucial)
            // We find the transaction by its Mollie ID in Directus
            const existingTransaction = await directusService.getTransactionByMollieId(
                DIRECTUS_URL,
                DIRECTUS_API_TOKEN,
                mollieId
            );

            if (existingTransaction && (existingTransaction.payment_status === 'paid' || existingTransaction.payment_status === 'completed')) {
                console.log(`Transaction ${mollieId} already marked as '${existingTransaction.payment_status}'. Skipping processing.`);
                return res.status(200).send('OK'); // Already processed
            }

            // 2. Status Sync from Mollie
            if (!mollieClient) {
                throw new Error('Mollie Client not initialized');
            }
            const payment = await mollieClient.payments.get(mollieId);
            const { transactionRecordId, registrationId, registrationType, notContribution, userId, firstName, lastName, email } = payment.metadata;

            console.log(`Mollie status for ${mollieId}: ${payment.status}`);

            // 3. Processing (If Paid)
            if (payment.isPaid()) {
                // Step A: Update Directus Transaction status to 'paid'
                if (transactionRecordId) {
                    console.log(`Updating transaction ${transactionRecordId} to 'paid'`);
                    await directusService.updateDirectusTransaction(
                        DIRECTUS_URL,
                        DIRECTUS_API_TOKEN,
                        transactionRecordId,
                        { payment_status: 'paid' }
                    );
                }

                // Update the related registration if applicable
                if (registrationId && registrationType) {
                    const collection = registrationType === 'pub_crawl_signup' ? COLLECTIONS.PUB_CRAWL_SIGNUPS : (registrationType === 'trip_signup' ? 'trip_signups' : 'event_signups');

                    let updatePayload = { payment_status: 'paid' };
                    if (registrationType === 'trip_signup') {
                        // Trip signups have segmented payment fields
                        const isAanbetaling = payment.description.toLowerCase().includes('aanbetaling');
                        updatePayload = isAanbetaling ?
                            { deposit_paid: true, deposit_paid_at: new Date().toISOString() } :
                            { full_payment_paid: true, full_payment_paid_at: new Date().toISOString() };
                    }

                    console.log(`Updating ${collection}/${registrationId} to 'paid'`);
                    await directusService.updateDirectusItem(
                        DIRECTUS_URL,
                        DIRECTUS_API_TOKEN,
                        collection,
                        registrationId,
                        updatePayload
                    );
                }

                // Step B: Membership Provisioning (If contribution)
                if (notContribution === "false" || !registrationId) {
                    console.log(`Triggering provisioning for User ID: ${userId || 'Guest'}`);

                    if (userId) {
                        // Regular flow: Extend membership and sync existing Azure user to Directus
                        await membershipService.provisionMember(
                            MEMBERSHIP_API_URL,
                            userId,
                            req.id
                        );
                        // Trigger sync to Directus (via Identity Service)
                        if (GRAPH_SYNC_URL) {
                            await membershipService.syncUserToDirectus(GRAPH_SYNC_URL, userId, req.id);
                        }
                    } else {
                        // Guest flow: Create new user in Azure AD first, then sync
                        console.log(`Guest payment recognized for ${email}. Creating Azure account...`);
                        try {
                            const newUser = await membershipService.createMember(
                                MEMBERSHIP_API_URL,
                                firstName,
                                lastName,
                                email,
                                phoneNumber,
                                dateOfBirth,
                                req.id
                            );

                            console.log(`Azure Account created for guest: ${newUser.user_id}. triggering initial sync...`);

                            // Trigger sync to Directus (to create the Directus user record)
                            if (GRAPH_SYNC_URL) {
                                await membershipService.syncUserToDirectus(GRAPH_SYNC_URL, newUser.user_id, req.id);
                            }

                            // Update transaction in Directus with the new user_id
                            if (transactionRecordId) {
                                await directusService.updateDirectusTransaction(
                                    DIRECTUS_URL,
                                    DIRECTUS_API_TOKEN,
                                    transactionRecordId,
                                    { user_id: newUser.user_id }
                                );
                            }
                        } catch (guestErr) {
                            console.error(`FAILED to provision guest user ${email}:`, guestErr.message);
                            // We don't fail the whole webhook but we log it
                        }
                    }
                }

                // Step C: Send Confirmation Email
                if (registrationId && registrationType !== 'pub_crawl_signup') {
                    console.log(`Sending confirmation email for ${registrationType}`);
                    try {
                        await notificationService.sendConfirmationEmail(
                            DIRECTUS_URL,
                            DIRECTUS_API_TOKEN,
                            EMAIL_SERVICE_URL,
                            payment.metadata,
                            payment.description
                        );
                    } catch (emailErr) {
                        console.warn(`Non-blocking error: Failed to send confirmation email: ${emailErr.message}`);
                        // Email is secondary, we don't fail the webhook for this
                    }
                }
            } else {
                // Update non-paid statuses (canceled, expired, failed)
                const statusMap = {
                    canceled: 'canceled',
                    failed: 'failed',
                    expired: 'expired',
                    open: 'open'
                };
                const internalStatus = statusMap[payment.status] || 'open';

                if (transactionRecordId && internalStatus !== 'open') {
                    await directusService.updateDirectusTransaction(
                        DIRECTUS_URL,
                        DIRECTUS_API_TOKEN,
                        transactionRecordId,
                        { payment_status: internalStatus }
                    );
                }
            }

            return res.status(200).send('OK');

        } catch (error) {
            // Fail-Safe: Returning 500 forces Mollie to retry the webhook later
            console.error(`CRITICAL FAILURE processing webhook for ${mollieId}: ${error.message}`);
            if (error.stack) console.error(error.stack);

            return res.status(500).send('Webhook failed - retry requested');
        }
    });

    return router;
};
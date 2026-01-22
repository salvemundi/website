const express = require('express');
const membershipService = require('../services/membership-service');
const { getEnvironment } = require('../services/env-utils');

module.exports = function (mollieClient, DIRECTUS_URL, DIRECTUS_API_TOKEN, EMAIL_SERVICE_URL, MEMBERSHIP_API_URL, directusService, notificationService, GRAPH_SYNC_URL) {
    const router = express.Router();

    router.post('/create', async (req, res) => {
        const traceId = req.headers['x-trace-id'] || `pay-${Math.random().toString(36).substring(7)}`;
        console.warn(`[Payment][${traceId}] Incoming Payment Creation Request`);

        try {
            const { amount, description, redirectUrl, userId, email, registrationId, registrationType, isContribution, firstName, lastName, couponCode, dateOfBirth, qrToken } = req.body;

            console.warn(`[Payment][${traceId}] Payload:`, JSON.stringify({ amount, description, redirectUrl, userId, email, registrationId, registrationType, isContribution, couponCode, qrToken: qrToken ? 'provided' : 'missing' }));

            if (!amount || !description || !redirectUrl) {
                console.warn(`[Payment][${traceId}] Missing required parameters`);
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            // Start with base amount
            let finalAmount = parseFloat(amount);
            let couponId = null;
            let appliedDiscount = null;

            console.warn(`[Payment][${traceId}] Initial Amount: ${finalAmount}`);

            // 1. Automatic Committee Discount Check
            // 1. Automatic Committee Discount Check & Price Enforcement
            if (isContribution) {
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
                            const credentials = await membershipService.createMember(
                                MEMBERSHIP_API_URL, firstName, lastName, email
                            );
                            if (credentials) {
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
                        collection = 'pub_crawl_signups';
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
                }

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
                                'id,name,event_date,base_price,deposit_amount,crew_discount,is_bus_trip'
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
                    } else {
                        console.warn(`[Webhook][${traceId}] Not a trip_signup, sending regular confirmation email`);
                        // Regular confirmation email for events/pub-crawls
                        await notificationService.sendConfirmationEmail(
                            DIRECTUS_URL,
                            DIRECTUS_API_TOKEN,
                            EMAIL_SERVICE_URL,
                            payment.metadata,
                            payment.description
                        );
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
                        // Try to create a Directus user so we have the date_of_birth set
                        try {
                            await directusService.createDirectusUser(DIRECTUS_URL, DIRECTUS_API_TOKEN, {
                                first_name: firstName,
                                last_name: lastName,
                                email: email,
                                date_of_birth: dateOfBirth || null,
                                status: 'active'
                            });
                            console.warn(`[Payment][${traceId}] Created Directus user for ${email}`);
                        } catch (err) {
                            console.error(`[Payment][${traceId}] Failed to create Directus user before membership create:`, err?.message || err);
                        }

                        const credentials = await membershipService.createMember(
                            MEMBERSHIP_API_URL, firstName, lastName, email
                        );

                        if (credentials) {
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
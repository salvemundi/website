const express = require('express');
const membershipService = require('../services/membership-service');
const { getEnvironment } = require('../services/env-utils');

module.exports = function (mollieClient, DIRECTUS_URL, DIRECTUS_API_TOKEN, EMAIL_SERVICE_URL, MEMBERSHIP_API_URL, directusService, notificationService) {
    const router = express.Router();

    router.post('/create', async (req, res) => {
        const traceId = req.headers['x-trace-id'] || `pay-${Math.random().toString(36).substring(7)}`;
        console.warn(`[Payment][${traceId}] Incoming Payment Creation Request`);

        try {
            const { amount, description, redirectUrl, userId, email, registrationId, isContribution, firstName, lastName, couponCode } = req.body;

            console.warn(`[Payment][${traceId}] Payload:`, JSON.stringify({ amount, description, redirectUrl, userId, email, isContribution, couponCode }));

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
            if (userId && isContribution) {
                console.warn(`[Payment][${traceId}] Checking committee status for user ${userId}`);
                const isCommitteeMember = await directusService.checkUserCommittee(DIRECTUS_URL, DIRECTUS_API_TOKEN, userId);
                if (isCommitteeMember) {
                    // Force logic: if committee member, price is 10.
                    if (finalAmount > 10.00) {
                        finalAmount = 10.00;
                        appliedDiscount = 'Committee Discount';
                        console.warn(`[Payment][${traceId}] Committee discount applied. New Amount: ${finalAmount}`);
                    }
                }
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
                // In production, we trust the flow to auto-approve normal signups
                approvalStatus = 'auto_approved';
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
                registration: registrationId || null,
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
                        await directusService.updateDirectusRegistration(
                            DIRECTUS_URL,
                            DIRECTUS_API_TOKEN,
                            registrationId,
                            { payment_status: 'paid' }
                        );
                    }

                    if (isContribution) {
                        if (userId) {
                            await membershipService.provisionMember(MEMBERSHIP_API_URL, userId);
                        } else if (firstName && lastName && email) {
                            const credentials = await membershipService.createMember(
                                MEMBERSHIP_API_URL, firstName, lastName, email
                            );
                            if (credentials) {
                                await notificationService.sendWelcomeEmail(
                                    EMAIL_SERVICE_URL, email, firstName, credentials
                                );
                            }
                        }
                    } else {
                        if (registrationId) {
                            const mockMetadata = {
                                firstName, lastName, email, registrationId
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
                notContribution: isContribution ? "false" : "true",
                email: email,
                userId: userId || null,
                firstName: firstName || null,
                lastName: lastName || null,
                couponId: couponId
            };

            console.warn(`[Payment][${traceId}] Creating Mollie Payment... Value: ${formattedAmount}`);
            const payment = await mollieClient.payments.create({
                amount: {
                    currency: 'EUR',
                    value: formattedAmount,
                },
                description: description,
                redirectUrl: redirectUrl,
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
            const { transactionRecordId, registrationId, notContribution, userId, firstName, lastName, email, couponId } = payment.metadata;

            console.warn(`[Webhook][${traceId}] Metadata:`, JSON.stringify(payment.metadata));

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
                // Check approval status before proceeding with account creation
                if (transactionRecordId) {
                    const transaction = await directusService.getTransaction(
                        DIRECTUS_URL,
                        DIRECTUS_API_TOKEN,
                        transactionRecordId
                    );

                    console.warn(`[Webhook][${traceId}] Transaction fetched:`, JSON.stringify(transaction));

                    // Only proceed if approved (or auto-approved)
                    if (transaction &&
                        transaction.approval_status !== 'approved' &&
                        transaction.approval_status !== 'auto_approved') {
                        console.warn(`[Webhook][${traceId}] Payment paid but approval pending/rejected. Status: ${transaction.approval_status}. Stopping auto-provisioning.`);
                        return res.status(200).send('Payment recorded, awaiting approval');
                    }
                }

                if (registrationId) {
                    await directusService.updateDirectusRegistration(
                        DIRECTUS_URL,
                        DIRECTUS_API_TOKEN,
                        registrationId,
                        { payment_status: 'paid' }
                    );
                }

                if (notContribution === "false") {
                    if (userId) {
                        await membershipService.provisionMember(MEMBERSHIP_API_URL, userId);

                        if (registrationId) {
                            await notificationService.sendConfirmationEmail(
                                DIRECTUS_URL,
                                DIRECTUS_API_TOKEN,
                                EMAIL_SERVICE_URL,
                                payment.metadata,
                                payment.description
                            );
                        }

                        // Also increment coupon usage if applicable
                        if (couponId) {
                            // Coupon increment logic skipped for now
                        }
                    } else if (firstName && lastName && email) {
                        const credentials = await membershipService.createMember(
                            MEMBERSHIP_API_URL, firstName, lastName, email
                        );

                        if (credentials) {
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
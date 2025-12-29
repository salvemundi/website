const express = require('express');
const membershipService = require('../services/membership-service');
const { getEnvironment } = require('../services/env-utils');

module.exports = function (mollieClient, DIRECTUS_URL, DIRECTUS_API_TOKEN, EMAIL_SERVICE_URL, MEMBERSHIP_API_URL, directusService, notificationService) {
    const router = express.Router();

    router.post('/create', async (req, res) => {
        try {
            const { amount, description, redirectUrl, userId, email, registrationId, isContribution, firstName, lastName } = req.body;

            if (!amount || !description || !redirectUrl) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            // Detect environment
            const environment = getEnvironment(req);
            const approvalStatus = environment === 'development' ? 'pending' : 'auto_approved';

            const transactionPayload = {
                amount: amount,
                product_name: description,
                payment_status: 'open',
                email: email || null,
                registration: registrationId || null,
                environment: environment,
                approval_status: approvalStatus
            };

            if (userId) {
                transactionPayload.user_id = userId;
            }

            const transactionRecordId = await directusService.createDirectusTransaction(
                DIRECTUS_URL,
                DIRECTUS_API_TOKEN,
                transactionPayload
            );

            const metadata = {
                transactionRecordId: transactionRecordId,
                registrationId: registrationId,
                notContribution: isContribution ? "false" : "true",
                email: email,
                userId: userId || null,
                firstName: firstName || null,
                lastName: lastName || null
            };

            const payment = await mollieClient.payments.create({
                amount: {
                    currency: 'EUR',
                    value: parseFloat(amount).toFixed(2),
                },
                description: description,
                redirectUrl: redirectUrl,
                webhookUrl: process.env.MOLLIE_WEBHOOK_URL,
                metadata: metadata
            });

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
            console.error('Create Error:', error.message);
            res.status(500).json({ error: 'Failed to create payment.' });
        }
    });

    router.post('/webhook', async (req, res) => {
        try {
            const paymentId = req.body.id;

            if (!paymentId) {
                return res.status(400).send('Missing payment ID.');
            }

            const payment = await mollieClient.payments.get(paymentId);
            const { transactionRecordId, registrationId, notContribution, userId, firstName, lastName, email } = payment.metadata;

            let internalStatus = 'open';
            if (payment.isPaid()) internalStatus = 'paid';
            else if (payment.isFailed()) internalStatus = 'failed';
            else if (payment.isCanceled()) internalStatus = 'canceled';
            else if (payment.isExpired()) internalStatus = 'expired';

            if (transactionRecordId) {
                await directusService.updateDirectusTransaction(
                    DIRECTUS_URL,
                    DIRECTUS_API_TOKEN,
                    transactionRecordId,
                    { payment_status: internalStatus }
                );
            }


            if (payment.isPaid()) {
                // Check approval status before proceeding with account creation
                if (transactionRecordId) {
                    const transaction = await directusService.getTransaction(
                        DIRECTUS_URL,
                        DIRECTUS_API_TOKEN,
                        transactionRecordId
                    );

                    // Only proceed if approved (or auto-approved)
                    if (transaction &&
                        transaction.approval_status !== 'approved' &&
                        transaction.approval_status !== 'auto_approved') {
                        console.log(`[Webhook] Payment ${paymentId} paid but approval pending. Transaction: ${transactionRecordId}, Status: ${transaction.approval_status}`);
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
            console.error('Webhook Error:', error.message);
            res.status(200).send('Webhook processed with errors');
        }
    });

    return router;
};
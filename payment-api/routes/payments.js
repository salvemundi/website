// payment-api/routes/payments.js

const express = require('express');

/**
 * Functie om de Express Router te initialiseren met alle benodigde services.
 */
module.exports = function (mollieClient, DIRECTUS_URL, DIRECTUS_API_TOKEN, EMAIL_SERVICE_URL, directusService, notificationService) {
    const router = express.Router();

    /**
     * Route: POST /api/payments/create
     */
    router.post('/create', async (req, res) => {
        console.log(`\n--- NEW PAYMENT REQUEST ---`);

        try {
            const { amount, description, redirectUrl, userId, email, registrationId, isContribution } = req.body;

            if (!amount || !description || !redirectUrl) {
                console.error("❌ Missing parameters");
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            // 1. Directus Transaction
            const transactionPayload = {
                amount: amount,
                product_name: description,
                payment_status: 'open',
                email: email || null,
                registration: registrationId || null
            };

            if (userId) {
                console.log(`Linking transaction to user ID: ${userId}`);
                transactionPayload.user_id = userId; 
            }

            console.log("1. Creating Directus Transaction...");
            const transactionRecordId = await directusService.createDirectusTransaction(
                DIRECTUS_URL, 
                DIRECTUS_API_TOKEN, 
                transactionPayload
            );
            console.log(`✅ Directus Transaction Created. ID: ${transactionRecordId}`);

            // 2. Mollie
            const metadata = {
                transactionRecordId: transactionRecordId,
                registrationId: registrationId,
                notContribution: isContribution ? "false" : "true",
                email: email
            };

            console.log("2. Requesting Payment from Mollie...");
            const payment = await mollieClient.payments.create({
                amount: {
                    currency: 'EUR',
                    value: parseFloat(amount).toFixed(2),
                },
                description: description,
                redirectUrl: redirectUrl,
                webhookUrl: process.env.MOLLIE_WEBHOOK_URL, // Gebruik direct env var voor Mollie webhook
                metadata: metadata
            });
            console.log(`✅ Mollie Payment Created. ID: ${payment.id}`);

            // 3. Update Directus
            console.log("3. Updating Directus with Mollie ID...");
            await directusService.updateDirectusTransaction(
                DIRECTUS_URL, 
                DIRECTUS_API_TOKEN, 
                transactionRecordId, 
                { transaction_id: payment.id }
            );
            console.log("✅ Transaction Updated.");

            res.json({
                checkoutUrl: payment.getCheckoutUrl(),
                paymentId: payment.id
            });

        } catch (error) {
            console.error('❌ [PaymentAPI] Create Error:', error.message);
            if (error.response) {
                console.error('Directus/Axios Error Data:', JSON.stringify(error.response.data, null, 2));
            }
            res.status(500).json({ error: 'Failed to create payment.' });
        }
    });

    /**
     * Route: POST /api/payments/webhook
     */
    router.post('/webhook', async (req, res) => {
        try {
            const paymentId = req.body.id;

            if (!paymentId) {
                return res.status(400).send('Missing payment ID.');
            }

            const payment = await mollieClient.payments.get(paymentId);
            const { transactionRecordId, registrationId } = payment.metadata;

            let internalStatus = 'open';
            if (payment.isPaid()) internalStatus = 'paid';
            else if (payment.isFailed()) internalStatus = 'failed';
            else if (payment.isCanceled()) internalStatus = 'canceled';
            else if (payment.isExpired()) internalStatus = 'expired';

            console.log(`Mollie Status: ${payment.status} -> Internal: ${internalStatus}`);

            if (transactionRecordId) {
                await directusService.updateDirectusTransaction(
                    DIRECTUS_URL, 
                    DIRECTUS_API_TOKEN, 
                    transactionRecordId, 
                    { payment_status: internalStatus }
                );
            }

            if (payment.isPaid() && registrationId) {
                console.log(`Updating Registration ${registrationId} -> paid`);
                await directusService.updateDirectusRegistration(
                    DIRECTUS_URL, 
                    DIRECTUS_API_TOKEN, 
                    registrationId, 
                    { payment_status: 'paid' }
                );

                // Verstuurt de mail via de Notification Service
                await notificationService.sendConfirmationEmail(
                    DIRECTUS_URL, 
                    DIRECTUS_API_TOKEN, 
                    EMAIL_SERVICE_URL,
                    payment.metadata, 
                    payment.description
                );
            }

            res.status(200).send('OK');

        } catch (error) {
            console.error('❌ [PaymentAPI] Webhook Error:', error.message);
            res.status(200).send('Webhook processed with errors');
        }
    });

    // Eindresultaat: de geconfigureerde router
    return router;
};
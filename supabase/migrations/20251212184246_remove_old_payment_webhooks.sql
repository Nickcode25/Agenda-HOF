-- Remove webhook tables from unused payment gateways
-- Mercado Pago and PagBank were replaced by Stripe

DROP TABLE IF EXISTS mercadopago_webhooks CASCADE;
DROP TABLE IF EXISTS pagbank_webhooks CASCADE;

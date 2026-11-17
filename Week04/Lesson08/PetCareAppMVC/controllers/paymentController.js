const serviceModel = require('../models/mockServices');
const MockProvider = require('../services/mockPaymentProvider');

// Prepare payment details (amount always comes from the catalogue)
function preparePayment(req, res) {
  const service = serviceModel.getServiceById(req.params.serviceId);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  res.status(200).json({
    serviceId: service.id,
    serviceName: service.name,
    amount: service.price,
    currency: 'sgd',
    status: 'READY_FOR_PAYMENT'
  });
}

async function createMockPayment(req, res) {
  // The catalogue array isn't exported, so look the service up via the model (same as preparePayment)
  const service = serviceModel.getServiceById(req.params.serviceId);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const paymentRequest = {
    amount: service.price,
    currency: 'sgd',
    merchantReference: 'SERVICE-' + service.id,
    description: service.name,
    testStatus: req.body?.testStatus
  };

  // call mock provider
  const providerResult = await MockProvider.createPayment(paymentRequest);

  const bookingStatusByPayment = {
    APPROVED: 'CONFIRMED',
    PENDING: 'AWAITING_PAYMENT',
    DECLINED: 'PAYMENT_FAILED'
  };

  return res.json({
    serviceId: service.id,
    providerPaymentId: providerResult.providerPaymentId,
    merchantReference: providerResult.merchantReference,
    paymentStatus: providerResult.status,
    bookingStatus: bookingStatusByPayment[providerResult.status]
  });
}

module.exports = {
  preparePayment,
  createMockPayment
};

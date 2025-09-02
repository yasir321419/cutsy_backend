require('dotenv').config();

const { NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const { attachPaymentMethodToCustomer, hasPaymentMethod, getPaymentMethods, createPaymentIntent } = require("../../utils/stripeApis");

// stripe init (keep in one place)
const stripe = require('stripe')(process.env.STRIPE_KEY, {
  apiVersion: '2023-10-16',
});

const addPaymentMethod = async (req, res, next) => {
  try {
    const { customerId, id, deviceToken, firstName } = req.user;


    const eKey = await stripe.ephemeralKeys.create(
      { customer: customerId },                              // <-- correct key name
      { apiVersion: stripe.getApiField('version') }
    );

    // Add card only (no charge)
    const si = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      // metadata,
    });

    return res.status(200).json({
      mode: 'setup',
      clientSecret: si.client_secret,
      customer: customerId,
      ephemeralKey: eKey.secret,
    });

  } catch (error) {
    next(error)
  }
}


// Controller to check if the user has payment methods
const showPaymentMethods = async (req, res, next) => {
  try {
    const { customerId } = req.user;  // Get customer ID from the user session or token

    const paymentMethodsExist = await hasPaymentMethod(customerId); // Check if payment methods exist

    handlerOk(res, 200, paymentMethodsExist, "payment method found successfully");

  } catch (error) {
    next(error);
  }
};

module.exports = {
  addPaymentMethod,
  showPaymentMethods
}
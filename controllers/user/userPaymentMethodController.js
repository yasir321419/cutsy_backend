const { NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const { attachPaymentMethodToCustomer, hasPaymentMethod, getPaymentMethods } = require("../../utils/stripeApis");

const addPaymentMethod = async (req, res, next) => {
  try {
    const { customerId } = req.user;
    const { paymentMethodId } = req.body;

    // Call the function to attach the payment method to the customer and set it as default
    const paymentMethod = await attachPaymentMethodToCustomer(paymentMethodId, customerId);

    handlerOk(res, 200, paymentMethod, "payment method added successfully");

  } catch (error) {
    next(error)
  }
}


// Controller to check if the user has payment methods
const showPaymentMethods = async (req, res, next) => {
  try {
    const { customerId } = req.user;  // Get customer ID from the user session or token

    const paymentMethodsExist = await hasPaymentMethod(customerId); // Check if payment methods exist

    if (paymentMethodsExist) {
      const paymentMethods = await getPaymentMethods(customerId); // Get the payment methods
      handlerOk(res, 200, paymentMethods, "Payment methods retrieved successfully");
    } else {
      throw new NotFoundError("No payment methods found for this customer")
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addPaymentMethod,
  showPaymentMethods
}
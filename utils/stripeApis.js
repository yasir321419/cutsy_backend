require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);

//create customer id

const createCustomer = async (email) => {
  try {
    const customer = await stripe.customers.create({
      email,
    });

    return customer;
  } catch (error) {
    console.error("Error creating customer with card:", error);
    throw error;
  }
};

//create connected account

const createConnectedAccount = async (email) => {
  try {
    const account = await stripe.accounts.create({
      type: "custom",
      country: "US",
      email,
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
    });
    return account.id;
  } catch (error) {
    console.log("error in creating connected account:" + error.message);
  }
};

//verify connected account

const verifyConnectedAccount = async (accountId) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      // refresh_url: "https://api.healingpaws.tech/api/v1/reauth",
      // return_url: `https://api.healingpaws.tech/api/v1/success/${accountId}`,
      refresh_url: "http://localhost:4000/api/v1/reauth",
      return_url: `http://localhost:4000/api/v1/success/${accountId}`,
      type: "account_onboarding",
    });
    return accountLink.url;
  } catch (error) {
    throw new Error("Error verifying connected account: " + error.message);
  }
};

//accept terms and condition for external account

const acceptTermsCondition = async (accountId) => {
  const date = Math.floor(new Date().getTime() / 1000);
  console.log(date);
  const account = await stripe.accounts.update(accountId, {
    tos_acceptance: {
      date,
      ip: "8.8.8.8",
    },
  });
  return account;
};

//get account details

const getAccountDetail = async (accountId) => {
  const account = await stripe.accounts.retrieve(accountId);
  return account;
};

//create external bank account

const createExternalBankAccount = async ({
  account_id,
  account_number,
  routing_number,
}) => {
  try {
    let external_account;
    if (routing_number) {
      external_account = {
        external_account: {
          object: "bank_account",
          account_number,
          routing_number,
          country: "US",
          currency: "usd",
        },
      };
    } else {
      external_account = {
        external_account: {
          object: "bank_account",
          account_number,
          country: "US",
          currency: "usd",
        },
      };
    }

    const externalAccount = await stripe.accounts.createExternalAccount(
      account_id,
      external_account
    );
    return externalAccount;
  } catch (error) {
    throw new Error("Failed to create external account: " + error.message);
  }
};

//get external bank account

const getAllBankDetail = async (accountId) => {
  const externalAccounts = await stripe.accounts.listExternalAccounts(
    accountId,
    {
      object: "bank_account",
    }
  );
  return externalAccounts;
};

//create payout

const createPayout = async ({ amount, destination, accountId }) => {
  try {
    const payout = await stripe.payouts.create(
      {
        amount,
        currency: "usd",
        destination, // Correctly specify the destination as a bank account
      },
      {
        stripeAccount: accountId,
      }
    );
    return payout;
  } catch (error) {
    throw new Error(error.message);
  }
};

//get balance

const getBalance = async ({ accountId }) => {
  const balance = await stripe.balance.retrieve({
    stripeAccount: accountId,
  });
  return balance;
};

const getAdminBalance = async () => {
  const balance = await stripe.balance.retrieve({
    // stripeAccount: accountId,
  });
  return balance;
};


//get debit and credit transaction

const getBalanceTransaction = async ({ accountId }) => {
  const balanceTransactions = await stripe.refunds.list({
    stripeAccount: accountId,
  });
  return balanceTransactions;
};

//create payment intent

const createPaymentIntent = async ({
  amount,
  customer,
  metadata,  // New metadata parameter
}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // already in cents
      currency: "usd",
      customer,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never", // avoids return_url requirement
      },
      metadata,
    });

    // DO NOT confirm here — let the client confirm using the client_secret
    return paymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
};


//transfer amount into another account

const transferAmountInAccount = async ({
  amount,
  // metadata,
  connectedAccountId,
}) => {
  const transfer = await stripe.transfers.create({
    amount,
    currency: "usd",
    destination: connectedAccountId,
    // metadata,
  });

  return transfer;
};

//refund amount

const refundAmount = async ({ amount, transferId }) => {
  const transferReversal = await stripe.transfers.createReversal(
    transferId,
    {
      amount,
    }
  );

  return transferReversal;
};

//has payment method

// Function to check if the customer has payment methods attached
const hasPaymentMethod = async (customerId) => {
  try {
    // List payment methods for the customer
    const list = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
    return list.data.map(pm => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
    }));

  } catch (error) {
    console.error("Error retrieving payment methods:", error);
    return { success: false, message: "Failed to fetch payment methods" }; // Return error message
  }
};





// Function to attach payment method to customer and set it as default
const attachPaymentMethodToCustomer = async (paymentMethodId, customerId) => {
  try {
    // Attach the new payment method to the customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Update the customer to set this as the default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    return paymentMethod;  // Return the payment method for further processing (optional)
  } catch (error) {
    throw new Error(`Failed to attach payment method: ${error.message}`);
  }
};

// Function to get the balance transactions for a connected account (barber's account)
const getBalanceTransactions = async (barberAccountId) => {
  try {
    // Define options object for balance transactions retrieval
    const options = {
      limit: 10, // Limit the number of transactions to retrieve
      stripeAccount: barberAccountId, // ID of the connected account
    };

    // Retrieve the balance transactions for the connected account
    const transactions = await stripe.balanceTransactions.list(options);

    return transactions.data; // Return the array of balance transactions
  } catch (error) {
    console.error("Error retrieving balance transactions:", error);
    throw new Error("Unable to retrieve balance transactions");
  }
};


module.exports = {
  createCustomer,
  createConnectedAccount,
  verifyConnectedAccount,
  acceptTermsCondition,
  getAccountDetail,
  createExternalBankAccount,
  getAllBankDetail,
  createPayout,
  getBalance,
  getBalanceTransaction,
  createPaymentIntent,
  transferAmountInAccount,
  refundAmount,
  hasPaymentMethod,
  attachPaymentMethodToCustomer,
  getBalanceTransactions,
  getAdminBalance
}

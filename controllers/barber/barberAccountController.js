const prisma = require("../../config/prismaConfig");
const { ValidationError, NotFoundError, ConflictError, BadRequestError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const sendNotification = require("../../utils/notification");
const { createExternalBankAccount, getAllBankDetail, verifyConnectedAccount, getBalance, createPayout, getBalanceTransactions } = require("../../utils/stripeApis");

const addbarberBusinessAccount = async (req, res, next) => {
  try {
    const { barberAccountId, name, deviceToken } = req.user;
    const { accountNumber, routingNumber } = req.body;

    const externalAccount = await createExternalBankAccount({
      account_id: barberAccountId,
      account_number: accountNumber,
      routing_number: routingNumber,
    });

    if (!externalAccount) {
      throw new ValidationError("external account not create")
    }

    // await sendNotification(
    //   id,
    //   deviceToken,
    //   `Hi ${name}, you have successfully set up your business account.`
    // );


    handlerOk(res, 200, externalAccount, "external account created successfully")

  } catch (error) {
    next(error)
  }
}

const showbarberBusinessAccount = async (req, res, next) => {
  try {
    const { barberAccountId } = req.user;

    const externalAccount = await getAllBankDetail(barberAccountId);

    console.log(externalAccount, "externalaccount");

    const verifyAccountUrl = await verifyConnectedAccount(barberAccountId);

    if (!verifyAccountUrl) {
      throw new ValidationError("account not verified")
    }

    if (externalAccount.data.length === 0) {

      throw new NotFoundError("bussiness account not found")
    }

    handlerOk(res, 200, externalAccount, "bussiness account found successfully")
  } catch (error) {
    next(error)
  }
}

const verificationBarberBusinessAccount = async (req, res, next) => {
  try {
    const htmlContent = {
      subject: "Cutsy - Business Account Verification",
      html: `
        <div style="padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;">
          <div style="z-index:1; position: relative;">
            <header style="padding-bottom: 20px">
              <div class="logo" style="text-align:center;">
              </div>
            </header>
            <main style="padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;">
              <h1 style="color: #fd6835; font-size: 30px; font-weight: 700;">Welcome To Healing Paws</h1>
              <p style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;">Hi,</p>
              <p style="font-size: 20px; text-align: left; font-weight: 500;">Thank you for Verification with Stripe</p>
              <h2 style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #fd6835; margin-top: 20px; margin-bottom: 20px;">Your Business Account Verification Successfully</h2>
              <p style="font-size: 20px;">Regards,</p>
              <p style="font-size: 20px;">Dev Team</p>
            </main>
          </div>
        </div>
      `,
    };

    // Send the HTML content using handlerOk (you can pass it as a response)
    handlerOk(res, 200, htmlContent, "Business Account Verification Email Sent Successfully");
  } catch (error) {
    next(error);
  }
}

const checkBarberBalance = async (req, res, next) => {
  try {

    const { barberAccountId } = req.user;

    const balance = await getBalance({ accountId: barberAccountId });

    if (!balance) {
      throw NotFoundError("barber balance not found")
    }
    // Convert cents to dollars and format amount
    function formatAmount(amountInCents) {
      const amountInDollars = amountInCents / 100;
      return `${amountInDollars.toFixed(2)}`;
    }

    const availableBalance = formatAmount(balance.available[0].amount);
    const pendingBalance = formatAmount(balance.pending[0].amount);

    handlerOk(res, 200, { availableBalance: availableBalance, pendingBalance: pendingBalance }, "Balance found successfully")

  } catch (error) {
    next(error)
  }
}

const withDrawAmountBarber = async (req, res, next) => {
  try {
    const { amount, destination } = req.body;
    const { id, barberAccountId, name, deviceToken } = req.user;

    // Convert amount to cents if it's in dollars
    const amountInCents = amount * 100;

    if (amountInCents <= 0) {
      throw new BadRequestError("invalid amount");
    }

    // Retrieve balance

    const balance = await getBalance({ accountId: barberAccountId });

    if (!balance) {
      throw NotFoundError("Barber balance not found")
    }

    // Calculate total available balance

    const availableBalance = balance.instant_available[0].amount;

    if (amountInCents > availableBalance) {
      throw new BadRequestError("Insufficient balance");
    }

    const payout = await createPayout({
      amount: amountInCents,
      destination, // Use the dynamic external account ID
      accountId: barberAccountId, // Use the handler's account ID
    });

    if (!payout) {
      throw new ValidationError("Payout request failed")
    }

    const deductamountinwallet = await prisma.barberWallet.update({
      where: {
        barberId: id
      },
      data: {
        balance: {
          decrement: amount
        }
      }
    });

    if (!deductamountinwallet) {
      throw new ValidationError("barber wallet not update")
    }

    // await sendNotification(
    //   id,
    //   deviceToken,
    //   `Hi ${name}, you have successfully withdrawn ${amount}.`
    // );


    handlerOk(res, 200, payout, "payout successfully")

  } catch (error) {
    next(error)
  }
}

const showAllBarberTransactions = async (req, res, next) => {
  try {
    const { barberAccountId } = req.user;

    // Retrieve the balance transactions for the barber's connected account

    const transactions = await getBalanceTransactions(barberAccountId);

    // Filter the transactions to only include payouts (withdrawals)

    const transferTransactions = transactions.filter((transaction) => {
      return transaction.type === "payout";
    });

    handlerOk(res, 200, transferTransactions, "Bank transactions retrieved successfully")


  } catch (error) {
    next(error)
  }
}


module.exports = {
  addbarberBusinessAccount,
  showbarberBusinessAccount,
  verificationBarberBusinessAccount,
  checkBarberBalance,
  withDrawAmountBarber,
  showAllBarberTransactions
}
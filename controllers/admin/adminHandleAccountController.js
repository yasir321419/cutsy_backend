const prisma = require("../../config/prismaConfig");
const { BadRequestError, NotFoundError, ValidationError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const { transferAmountInAccount, getAdminBalance } = require("../../utils/stripeApis");

const showAllPaymentRecieved = async (req, res, next) => {
  try {
    const findallpayment = await prisma.payment.findMany({});

    if (findallpayment.length === 0) {
      throw new NotFoundError("payment not found")
    }

    handlerOk(res, 200, findallpayment, "payment found succesfully")
  } catch (error) {
    next(error)
  }
}


const transerAmountToBarberAccount = async (req, res, next) => {
  try {

    const { barberId, amount } = req.body; // Barber's Stripe Account ID\


    const findbarber = await prisma.barber.findUnique({ where: { id: barberId } });

    if (!findbarber) {
      throw new NotFoundError("barber not found")
    }

    // Deduct commission (5% in this case)
    const commission = amount * 0.05;  // 5% commission
    const amountAfterCommission = amount - commission;

    // Convert amount to cents
    const amountInCents = Math.round(amountAfterCommission * 100);


    if (amountInCents <= 0) {
      throw new BadRequestError('Invalid amount to transfer');
    }

    // Fetch the balance of the Admin account (you don’t need `adminAccountId` as it’s your main account)

    const balance = await getAdminBalance()

    const availableBalance = balance.available[0].amount;

    // Check if Admin has sufficient funds to transfer
    if (amountInCents > availableBalance) {
      throw new BadRequestError('Insufficient balance to transfer');
    }

    // Proceed with transferring the funds from Admin to Barber
    const transfer = await transferAmountInAccount(amountInCents, findbarber.barberAccountId);

    const barberwallet = await prisma.barberWallet.upsert({
      where: {
        barberId: barberId
      },
      update: {
        balance: {
          increment: amountAfterCommission,
        }
      },
      create: {
        barberId: barberId,
        balance: amountAfterCommission
      }
    });

    if (!barberwallet) {
      throw new ValidationError("barber wallet not update")
    }

    handlerOk(res, 200, transfer, 'Amount transferred successfully to barber');

  } catch (error) {
    next(error)
  }
}

module.exports = {
  showAllPaymentRecieved,
  transerAmountToBarberAccount
}


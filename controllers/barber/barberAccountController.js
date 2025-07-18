const { ValidationError, NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const { createExternalBankAccount, getAllBankDetail, verifyConnectedAccount } = require("../../utils/stripeApis");

const addbarberBusinessAccount = async (req, res, next) => {
  try {
    const { barberAccountId } = req.user;
    const { accountNumber, routingNumber } = req.body;

    const externalAccount = await createExternalBankAccount({
      account_id: barberAccountId,
      account_number: accountNumber,
      routing_number: routingNumber,
    });

    if (!externalAccount) {
      throw new ValidationError("external account not create")
    }

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
};



module.exports = {
  addbarberBusinessAccount,
  showbarberBusinessAccount,
  verificationBarberBusinessAccount
}
const generateOtpExpiry = (minutes = 2) => {
  return new Date(Date.now() + minutes * 120 * 1000);
};

module.exports = generateOtpExpiry;

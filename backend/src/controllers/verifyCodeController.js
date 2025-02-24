const { sendVerification } = require('../services/cognitoService');

exports.sendVerifyCode = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await sendVerification(name);
    res.status(200).json({ message: 'ok'});
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
};

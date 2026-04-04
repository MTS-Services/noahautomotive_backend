const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return typeof password === "string" && password.length >= 6;
};

const validatePhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s\-().]{7,20}$/;
  return phoneRegex.test(phone);
};

module.exports = { validateEmail, validatePassword, validatePhoneNumber };

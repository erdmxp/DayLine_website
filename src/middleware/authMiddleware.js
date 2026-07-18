const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).send('Нужно авторизоваться');
  }

  next();
};

const requirePageAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect(302, '/autorisation.html');
  }

  next();
};

module.exports = {
  requireAuth,
  requirePageAuth
};

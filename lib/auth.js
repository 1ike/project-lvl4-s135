export default (ctx, next) => {
  ctx.assert(ctx.session.userId, 401, 'Only for registered users');
  return next();
};

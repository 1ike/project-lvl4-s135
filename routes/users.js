import buildFormObj from '../lib/formObjectBuilder';
import auth from '../lib/auth';
import { User } from '../models';

export default (router) => {
  router
    .get('users', '/users', async (ctx) => {
      const page = +ctx.query.page;

      const limitByPage = 10;
      const res = await User.findWithPagination(ctx, page || 1, limitByPage);

      ctx.render('users', { res });
    })
    .get('newUser', '/users/new', (ctx) => {
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })
    .get('user', '/users/:id', auth, async (ctx) => {
      const { currentUser } = ctx.state;
      ctx.render('users/user', { f: buildFormObj(currentUser) });
    })
    .post('users', '/users', async (ctx) => {
      const { form } = ctx.request.body;
      const user = User.build(form);
      try {
        await user.save();
        ctx.flash.set('User has been created');
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    })
    .put('users', '/users', async (ctx) => {
      const { currentUser } = ctx.state;
      ctx.assert(currentUser, 403, "Don't mess with me!");
      const { form } = ctx.request.body;
      try {
        await currentUser.update(form);
        ctx.flash.set('User has been updated');
        ctx.redirect(router.url('root'));
      } catch (e) {
        const user = User.build(form);
        ctx.render('users/user', { f: buildFormObj(user, e) });
      }
    })
    .delete('users', '/users', async (ctx) => {
      const { currentUser } = ctx.state;
      ctx.assert(currentUser, 403, "Don't mess with me!");
      try {
        await currentUser.destroy();
        ctx.session = null;
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.flash.set('User has not been deleted. You can try again.');
        ctx.render('users/user', { f: buildFormObj(currentUser) });
      }
    });
};

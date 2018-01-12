import buildFormObj from '../lib/formObjectBuilder';
import { User } from '../models';

export default (router) => {
  router
    .get('users', '/users', async (ctx) => {
      const page = +ctx.query.page;
      const url = +ctx.query.page;

      if ('page' in ctx.query && (!Number.isInteger(page) || page < 1)) {
        ctx.redirect(ctx.path);
      }

      const LIMIT_BY_PAGE = 10;

      const res = await User.findWithPagination(ctx, page || 1, LIMIT_BY_PAGE);

      console.log(res.page);
      console.log(res.count);
      console.log(ctx.path);
      ctx.render('users', { res });
    })
    .get('newUser', '/users/new', (ctx) => {
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })
    .get('user', '/users/:id', async (ctx) => {
      const currentUser = ctx.state.currentUser;
      if (!currentUser || +ctx.params.id !== currentUser.id) {
        ctx.redirect('/users');
      }
      ctx.render('users/user', { f: buildFormObj(currentUser) });
    })
    .post('users', '/users', async (ctx) => {
      const form = ctx.request.body.form;
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
      const form = ctx.request.body.form;
      try {
        await ctx.state.currentUser.update(form);
        ctx.flash.set('User has been updated');
        ctx.redirect(router.url('root'));
      } catch (e) {
        console.log(e);
        const user = User.build(form);
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    })
    .delete('users', '/users', async (ctx) => {
      const currentUser = ctx.state.currentUser;
      try {
        await currentUser.destroy();
        ctx.session.userId = undefined;
        ctx.flash.set('User has been deleted');
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.flash.set('User has not been deleted. You can try again.');
        ctx.render('users/user', { f: buildFormObj(currentUser) });
      }
    });
};

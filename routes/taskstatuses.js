import buildFormObj from '../lib/formObjectBuilder';
import auth from '../lib/auth';
import { TaskStatus } from '../models';

export default (router) => {
  router
    .get('taskstatuses', '/taskstatuses', async (ctx) => {
      const statuses = await TaskStatus.findAll();
      ctx.render('taskstatuses', { statuses });
    })
    .get('newTaskStatus', '/taskstatuses/new', (ctx) => {
      const status = TaskStatus.build();
      ctx.render('taskstatuses/new', { f: buildFormObj(status) });
    })
    .get('taskstatus', '/taskstatuses/:id', async (ctx) => {
      const status = await TaskStatus.findById(ctx.params.id);
      ctx.assert(status, 404);
      ctx.render('taskstatuses/taskstatus', { f: buildFormObj(status) });
    })
    .post('taskstatuses', '/taskstatuses', auth, async (ctx) => {
      const { form } = ctx.request.body;
      const status = TaskStatus.build(form);
      try {
        await status.save();
        ctx.flash.set('TaskStatus has been created');
        ctx.redirect(router.url('taskstatuses'));
      } catch (e) {
        ctx.render('taskstatuses/new', { f: buildFormObj(status, e) });
      }
    })
    .put('taskstatus', '/taskstatuses/:id', auth, async (ctx) => {
      const { form } = ctx.request.body;
      const status = await TaskStatus.findById(ctx.params.id);
      const { id, name } = status;
      try {
        await status.update(form);
        ctx.flash.set('TaskStatus has been updated');
        ctx.redirect(router.url('taskstatuses'));
      } catch (e) {
        const taskstatus = { ...TaskStatus.build(form), id, _name: name };
        ctx.render('taskstatuses/taskstatus', { f: buildFormObj(taskstatus, e) });
      }
    })
    .delete('taskstatus', '/taskstatuses/:id', auth, async (ctx) => {
      const status = await TaskStatus.findById(ctx.params.id);
      try {
        await status.destroy();
        ctx.flash.set('TaskStatus has been deleted.');
        ctx.redirect(router.url('taskstatuses'));
      } catch (e) {
        ctx.flash.set('TaskStatus has not been deleted. You can try again.');
        ctx.render('taskstatuses/taskstatus', { f: buildFormObj(status) });
      }
    });
};

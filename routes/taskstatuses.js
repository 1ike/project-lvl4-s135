import buildFormObj from '../lib/formObjectBuilder';
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
      status._id = status.id;
      status._name = status.name;
      ctx.render('taskstatuses/taskstatus', { f: buildFormObj(status) });
    })
    .post('taskstatuses', '/taskstatuses', async (ctx) => {
      ctx.assert(ctx.session.userId, 403, 'Only for registered users');
      const { form } = ctx.request.body;
      const taskstatus = TaskStatus.build(form);
      try {
        await taskstatus.save();
        ctx.flash.set('TaskStatus has been created');
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.render('taskstatuses/new', { f: buildFormObj(taskstatus, e) });
      }
    })
    .put('taskstatuses', '/taskstatuses', async (ctx) => {
      ctx.assert(ctx.session.userId, 403, 'Only for registered users');
      const { form } = ctx.request.body;
      const status = await TaskStatus.findById(form._id);
      try {
        await status.update(form);
        ctx.flash.set('TaskStatus has been updated');
        ctx.redirect(router.url('root'));
      } catch (e) {
        const taskstatus = TaskStatus.build(form);
        taskstatus._id = form._id;
        taskstatus._name = form._name;
        ctx.render('taskstatuses/taskstatus', { f: buildFormObj(taskstatus, e) });
      }
    })
    .delete('taskstatuses', '/taskstatuses', async (ctx) => {
      ctx.assert(ctx.session.userId, 403, 'Only for registered users');
      const { form } = ctx.request.body;
      const status = await TaskStatus.findById(form._id);
      try {
        await status.destroy();
        ctx.flash.set('TaskStatus has been deleted.');
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.flash.set('TaskStatus has not been deleted. You can try again.');
        ctx.render('taskstatuses/taskstatus', { f: buildFormObj(status) });
      }
    });
};

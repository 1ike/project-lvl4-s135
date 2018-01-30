import _ from 'lodash';

import buildFormObj from '../lib/formObjectBuilder';
import auth from '../lib/auth';
import { Task, TaskStatus, User, Tag } from '../models';


const authorizeForTask = async (ctx, next) => {
  ctx.assert(ctx.session.userId, 401, 'Only for registered users');
  const task = await Task.findById(ctx.params.id);
  ctx.assert(ctx.session.userId === task.creatorId, 403, 'Only for Creators');
  return next();
};


const setTags = async (task, tagsList) => {
  const trimmedTags = tagsList.split(',')
    .map((tag) => {
      const trimmed = _.trim(tag);
      return _.words(trimmed).join(' ');
    })
    .filter(_.identity);
  if (trimmedTags.length) {
    const addedTagsPromises = trimmedTags.map(async (tag) => {
      const result = await Tag.findOne({
        where: {
          name: tag,
        },
      });
      return result ? task.addTag(result) : task.createTag({ name: tag });
    });
    await Promise.all(addedTagsPromises);
  }
  return trimmedTags;
};


const cleanOldTags = async (task, trimmedTags) => {
  const previousTags = (await task.getTags()).map(tag => tag.name);
  const oldTags = _.difference(previousTags, trimmedTags);

  const removedTagsPromises = oldTags.map(async (tag) => {
    const oldTag = await Tag.findOne({
      where: {
        name: tag,
      },
    });
    const tasks = await oldTag.getTasks();
    return tasks.length ? task.removeTag(oldTag) : oldTag.destroy();
  });

  return Promise.all(removedTagsPromises);
};


const prepareForms = (ctx) => {
  const { form } = ctx.request.body;
  const { tagsList } = form;

  const buildingForm = {
    name: form.name,
    description: form.description,
    statusId: form.statusId,
    assignedToId: form.assignedToId,
    creatorId: ctx.state.currentUser.id,
  };

  return { form, buildingForm, tagsList };
};


const getRollbackForm = async (task, form) => ({
  ...form,
  id: task.id,
  statuses: await TaskStatus.findAll(),
  users: await User.findAll(),
});


const getAllTaskInfo = async (task) => {
  const status = await TaskStatus.findById(task.statusId);
  const creator = await User.findById(task.creatorId);
  const assignedTo = await User.findById(task.assignedToId);
  const tags = await task.getTags();
  return {
    task, status, creator, assignedTo, tags,
  };
};


export default (router) => {
  router
    .get('tasks', '/tasks', async (ctx) => {
      const page = +ctx.query.page;

      const limitByPage = 10;
      const res = await Task.findWithPagination(ctx, page || 1, limitByPage);
      const promises = res.rows.map(getAllTaskInfo);
      const rows = await Promise.all(promises);

      ctx.render('tasks', {
        res: { ...res, rows },
      });
    })
    .get('newTask', '/tasks/new', auth, async (ctx) => {
      const statuses = await TaskStatus.findAll();
      const statusNew = statuses.filter(status => status.name === 'new');
      if (statusNew.length === 0) {
        ctx.flash.set('Task Status "new" must be created before creating Task');
        ctx.redirect(router.url('newTaskStatus'));
      } else {
        const users = await User.findAll();

        const task = {
          statusIdDefault: statusNew[0].id,
          statuses,
          users,
        };
        ctx.render('tasks/new', { f: buildFormObj(task) });
      }
    })
    .get('task', '/tasks/:id', authorizeForTask, async (ctx) => {
      const task = await Task.findById(ctx.params.id);
      ctx.assert(task, 404);

      const {
        status, creator, assignedTo, tags,
      } = await getAllTaskInfo(task);

      const form = {
        id: task.id,
        name: task.name,
        description: task.description,
        statusId: status.id,
        creatorId: creator.id,
        assignedToId: assignedTo.id,
        tagsList: tags.map(tag => tag.name).join(', '),
        statuses: await TaskStatus.findAll(),
        users: await User.findAll(),
      };

      ctx.render('tasks/task', { f: buildFormObj(form) });
    })
    .post('newTask', '/tasks/new', auth, async (ctx) => {
      const { form, buildingForm, tagsList } = prepareForms(ctx);

      const task = Task.build(buildingForm);
      try {
        await task.save();

        await setTags(task, tagsList);

        ctx.flash.set('Task has been created');
        ctx.redirect(router.url('tasks'));
      } catch (e) {
        const rollbackForm = getRollbackForm(task, form);
        ctx.render('tasks/new', { f: buildFormObj(rollbackForm, e) });
      }
    })
    .put('task', '/tasks/:id', authorizeForTask, async (ctx) => {
      const { form, buildingForm, tagsList } = prepareForms(ctx);

      const task = await Task.findById(ctx.params.id);
      try {
        await task.update(buildingForm);

        const trimmedTags = await setTags(task, tagsList);
        await cleanOldTags(task, trimmedTags);

        ctx.flash.set('Task has been updated');
        ctx.redirect(router.url('tasks'));
      } catch (e) {
        const rollbackForm = getRollbackForm(task, form);
        ctx.render('tasks/task', { f: buildFormObj(rollbackForm, e) });
      }
    })
    .delete('task', '/tasks/:id', authorizeForTask, async (ctx) => {
      const task = await Task.findById(ctx.params.id);
      await task.destroy();
      ctx.flash.set(`Task "${task.name}" (id: ${task.id}) has been deleted.`);
      ctx.redirect(router.url('tasks'));
    });
};

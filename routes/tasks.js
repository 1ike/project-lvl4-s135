import _ from 'lodash';

import buildFormObj from '../lib/formObjectBuilder';
import auth from '../lib/auth';
import { Task, TaskStatus, User, Tag } from '../models';


const authorizeForTask = async (ctx, next) => {
  ctx.assert(ctx.session.userId, 401, 'Only for registered users');
  const task = await Task.findById(ctx.params.id);
  ctx.assert(ctx.session.userId = task.creatorId, 403, 'Only for Creators');
  return next();
};


const createOrUpdateTask = async (ctx, router, needToCreate) => {
  const { form } = ctx.request.body;
  const { statusId, assignedToId, tagsList } = form;

  let status;
  if (statusId) {
    status = await TaskStatus.findById(statusId);
    ctx.assert(status, 422, 'No such Task Status');
  }
  let user;
  if (assignedToId) {
    user = await User.findById(assignedToId);
    ctx.assert(user, 422, 'No such User');
  }

  const buildingForm = { ...form, creatorId: ctx.state.currentUser.id };
  delete buildingForm.tagsList;
  const task = needToCreate ? Task.build(buildingForm) : await Task.findById(ctx.params.id);
  try {
    if (needToCreate) {
      await task.save();
    } else {
      await task.update(buildingForm);
    }

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
    if (!needToCreate) {
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
      await Promise.all(removedTagsPromises);
    }

    const msg = needToCreate ? 'created' : 'updated';
    ctx.flash.set(`Task has been ${msg}`);
    ctx.redirect(router.url('tasks'));
  } catch (e) {
    console.log(e);
    const rollbackForm = {
      ...form,
      id: task.id,
      statuses: await TaskStatus.findAll(),
      users: await User.findAll(),
    };
    const template = needToCreate ? 'tasks/new' : 'tasks/task';
    ctx.render(template, { f: buildFormObj(rollbackForm, e) });
  }
};


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

      const LIMIT_BY_PAGE = 10;
      const res = await Task.findWithPagination(ctx, page || 1, LIMIT_BY_PAGE);
      const promises = res.rows.map(getAllTaskInfo);
      const rows = await Promise.all(promises);

      ctx.render('tasks', {
        res: { ...res, rows },
      });
    })
    .get('newTask', '/tasks/new', authorizeForTask, async (ctx) => {
      const statuses = await TaskStatus.findAll();
      const statusNew = statuses.filter(status => status.name === 'new');
      if (!statusNew.length) {
        ctx.flash.set('Task Status "new" must be created before creating Task');
        ctx.redirect(router.url('newTaskStatus'));
      }

      const users = await User.findAll();

      const task = {
        statusIdDefault: statusNew[0].id,
        statuses,
        users,
      };
      ctx.render('tasks/new', { f: buildFormObj(task) });
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
      await createOrUpdateTask(ctx, router, true);
    })
    .put('task', '/tasks/:id', authorizeForTask, async (ctx) => {
      await createOrUpdateTask(ctx, router);
    })
    .delete('task', '/tasks/:id', authorizeForTask, async (ctx) => {
      const task = await Task.findById(ctx.params.id);
      await task.destroy();
      ctx.flash.set(`Task "${task.name}" (id: ${task.id}) has been deleted.`);
      ctx.redirect(router.url('tasks'));
    });
};

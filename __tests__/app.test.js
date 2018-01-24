import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import { User, TaskStatus, Task, sequelize } from '../models';
import fakeUsers from '../lib/fakeUsers';

import app from '..';


const { queryInterface } = sequelize;

const getAssets = (server) => {
  const postForm = async (url, data, cookies = '') => request.agent(server)
    .post(url)
    .type('form')
    .set('Cookie', cookies)
    .send(data);

  const sessionURL = '/session';

  const prepareUsers = async () => {
    const NUMBER = 3;
    const USER_ID = 2;

    const usersWithPasswordField = fakeUsers(NUMBER);
    const userForSacrifice = usersWithPasswordField[USER_ID - 1];
    const userEmail = userForSacrifice.email;
    const userPassword = userForSacrifice.password;
    const sessionForm = {
      email: userEmail,
      password: userPassword,
    };

    const users = usersWithPasswordField.map((user) => {
      delete user.password;
      return user;
    });

    await queryInterface.bulkInsert('Users', users, {});
    // await sequelize.query("INSERT INTO `Users` (`firstName`,`lastName`,`email`,`passwordDigest`,`createdAt`,`updatedAt`) VALUES ('Haylie','Cole','Vilma_Kihn@gmail.com','PBw8evB88PcTPIW','2017-08-05 18:55:27.357 +00:00','2017-09-09 06:13:50.810 +00:00'),('Jerel','Torp','Reid_Wilkinson87@yahoo.com','dF_CqSCV_v3EZgR','2017-12-02 19:14:58.675 +00:00','2018-01-02 02:30:06.152 +00:00'),('Jazmyn','King','Godfrey_Wuckert68@yahoo.com','CxDkIdRkktRAkPT','2017-10-12 19:34:06.382 +00:00','2017-02-24 02:29:02.682 +00:00')");
    const dbRes1 = await User.count();

    expect(dbRes1).toBe(NUMBER);


    const res1 = await postForm(sessionURL, { form: { email: '', password: '' } });

    expect(res1).toHaveHTTPStatus(200);


    const res2 = await postForm(sessionURL, { form: sessionForm });

    expect(res2).toHaveHTTPStatus(302);

    const responseCokies = res2.header['set-cookie'][0];
    const sid = responseCokies.match(/koa.sid=([^;]*)/i)[1];
    const sig = responseCokies.match(/koa.sid.sig=([^;]*)/i)[1];
    const cookies = `koa.sid.sig=${sig}; koa.sid=${sid}`;

    return {
      NUMBER,
      USER_ID,
      cookies,
      user: userForSacrifice,
      userPassword,
    };
  };

  return { postForm, prepareUsers };
};

describe('Guest requests', () => {
  let server;

  beforeAll(() => {
    jasmine.addMatchers(matchers);
    return sequelize.sync({ force: true });
  });

  beforeEach(() => {
    server = app().listen();
  });


  it('Home: GET 200', async () => {
    const res = await request.agent(server)
      .get('/');
    expect(res).toHaveHTTPStatus(200);
  });

  it('Sign In: GET 200', async () => {
    const res = await request.agent(server)
      .get('/session/new');
    expect(res).toHaveHTTPStatus(200);
  });

  it('Sign Up: GET 200', async () => {
    const res = await request.agent(server)
      .get('/users/new');
    expect(res).toHaveHTTPStatus(200);
  });

  it('Users: GET 200', async () => {
    const res = await request.agent(server)
      .get('/users');
    expect(res).toHaveHTTPStatus(200);
  });

  it('Task Statuses: GET 200', async () => {
    const res = await request.agent(server)
      .get('/taskstatuses');
    expect(res).toHaveHTTPStatus(200);
  });

  it('Tasks: GET 200', async () => {
    const res = await request.agent(server)
      .get('/tasks');
    expect(res).toHaveHTTPStatus(200);
  });

  it('GET 404', async () => {
    const res = await request.agent(server)
      .get('/wrong-path');
    expect(res).toHaveHTTPStatus(404);
  });


  afterEach((done) => {
    server.close();
    done();
  });
});


describe('Users CRUD', () => {
  let server;
  let postForm;
  let prepareUsers;
  const usersURL = '/users';

  beforeAll(() => {
    jasmine.addMatchers(matchers);
  });

  beforeEach(async () => {
    server = app().listen();
    const assets = getAssets(server);
    postForm = assets.postForm;
    prepareUsers = assets.prepareUsers;

    return sequelize.sync({ force: true });
  });


  it('Users: Add uniq user', async () => {
    const user = fakeUsers()[0];
    const url = '/users';

    const res1 = await postForm(url, { form: user });

    expect(res1).toHaveHTTPStatus(302);

    const res2 = await postForm(url, { form: user });

    expect(res2).toHaveHTTPStatus(200);

    const dbRes = await User.count();

    expect(dbRes).toBe(1);
  });


  it('Users: Sign In and Delete user', async () => {
    const assets = await prepareUsers();

    const {
      NUMBER,
      USER_ID,
      cookies,
    } = assets;

    const res1 = await request.agent(server)
      .get(`/users/${USER_ID}`)
      .set('Cookie', cookies);

    expect(res1).toHaveHTTPStatus(200);


    const res2 = await postForm(usersURL, { _method: 'delete' });
    const dbRes2 = await User.count();

    expect(res2).toHaveHTTPStatus(403);
    expect(dbRes2).toBe(NUMBER);


    const res3 = await postForm(usersURL, { _method: 'delete' }, cookies);
    const dbRes3 = await User.count();

    expect(res3).toHaveHTTPStatus(302);
    expect(dbRes3).toBe(NUMBER - 1);
  });


  it('Users: Update and Sign Out user', async () => {
    const assets = await prepareUsers();

    const {
      USER_ID,
      cookies,
      user,
      userPassword,
    } = assets;

    user.password = userPassword;

    const res1 = await postForm(usersURL, { _method: 'put' });

    expect(res1).toHaveHTTPStatus(403);


    const newName = `${user.firtsName}test`;
    const res2 = await postForm(
      usersURL,
      { form: { ...user, firstName: newName }, _method: 'put' },
      cookies,
    );
    const dbRes2 = await User.findById(USER_ID);

    expect(res2).toHaveHTTPStatus(302);
    expect(dbRes2.firstName).toBe(newName);


    await postForm('/session', { _method: 'delete' }, cookies);
    const res3 = await postForm(usersURL, { _method: 'delete' }, cookies);

    expect(res3).toHaveHTTPStatus(403);
  });


  afterEach((done) => {
    server.close();
    done();
  });
});


describe('Task Statuses CRUD', () => {
  let server;
  let postForm;
  let prepareUsers;
  const usersURL = '/users';

  beforeAll(() => {
    jasmine.addMatchers(matchers);
  });

  beforeEach(async () => {
    server = app().listen();
    const assets = getAssets(server);
    postForm = assets.postForm;
    prepareUsers = assets.prepareUsers;

    return sequelize.sync({ force: true });
  });


  it('Task Statuses: Add uniq', async () => {
    const { cookies } = await prepareUsers();
    const status = { name: 'new' };
    const url = '/taskstatuses';

    const res1 = await postForm(url, { form: status });

    expect(res1).toHaveHTTPStatus(401);

    const res2 = await postForm(url, { form: status }, cookies);

    expect(res2).toHaveHTTPStatus(302);

    const res3 = await postForm(url, { form: status }, cookies);

    expect(res3).toHaveHTTPStatus(200);

    const dbRes = await TaskStatus.count();

    expect(dbRes).toBe(1);
  });


  it('Task Statuses: Delete', async () => {
    const { cookies } = await prepareUsers();
    const status = { name: 'new' };
    const url = '/taskstatuses';
    const statusURL = '/taskstatuses/1';

    await postForm(url, { form: status }, cookies);

    const dbRes1 = await TaskStatus.count();

    expect(dbRes1).toBe(1);


    const res2 = await postForm(statusURL, { _method: 'delete' });
    const dbRes2 = await TaskStatus.count();

    expect(res2).toHaveHTTPStatus(401);
    expect(dbRes2).toBe(1);


    const res3 = await postForm(statusURL, { _method: 'delete' }, cookies);
    const dbRes3 = await TaskStatus.count();

    expect(res3).toHaveHTTPStatus(302);
    expect(dbRes3).toBe(0);
  });


  it('Task Statuses: Update', async () => {
    const { cookies } = await prepareUsers();
    const status = { name: 'new' };
    const url = '/taskstatuses';
    const statusURL = '/taskstatuses/1';

    await postForm(url, { form: status }, cookies);

    const dbRes1 = await TaskStatus.count();

    expect(dbRes1).toBe(1);


    const res1 = await postForm(statusURL, { _method: 'put' });

    expect(res1).toHaveHTTPStatus(401);


    const newName = 'test';
    const res2 = await postForm(
      statusURL,
      { form: { name: newName }, _method: 'put' },
      cookies,
    );
    const dbRes2 = await TaskStatus.findById(1);

    expect(res2).toHaveHTTPStatus(302);
    expect(dbRes2.name).toBe(newName);
  });


  afterEach((done) => {
    server.close();
    done();
  });
});


describe('Tasks CRUD', () => {
  let server;
  let postForm;
  let prepareUsers;
  const usersURL = '/users';

  beforeAll(() => {
    jasmine.addMatchers(matchers);
  });

  beforeEach(async () => {
    server = app().listen();
    const assets = getAssets(server);
    postForm = assets.postForm;
    prepareUsers = assets.prepareUsers;

    return sequelize.sync({ force: true });
  });


  it('Tasks: Add, Update, Delete', async () => {
    // Add
    const { cookies } = await prepareUsers();
    await postForm('/taskstatuses', { form: { name: 'new' } }, cookies);

    const task = {
      name: 'new',
      statusId: 1,
      assignedToId: 3,
      tagsList: 'ggg, hhh',
    };
    const url = '/tasks/new';

    const res1 = await postForm(url, { form: task });

    expect(res1).toHaveHTTPStatus(401);

    const res2 = await postForm(url, { form: task }, cookies);

    expect(res2).toHaveHTTPStatus(302);

    const dbRes = await TaskStatus.count();

    expect(dbRes).toBe(1);


    // Update
    const taskURL = '/tasks/1';


    const res3 = await postForm(taskURL, { _method: 'put' });

    expect(res3).toHaveHTTPStatus(401);


    const newTagsList = 'ggg';
    const res4 = await postForm(
      taskURL,
      { form: { ...task, tagsList: newTagsList }, _method: 'put' },
      cookies,
    );
    const dbRes4 = await Task.findById(1);
    const tags = (await dbRes4.getTags()).map(tag => tag.name).join(', ');

    expect(res4).toHaveHTTPStatus(302);
    expect(tags).toBe(newTagsList);


    // Delete
    const res5 = await postForm(taskURL, { _method: 'delete' });
    const dbRes5 = await Task.count();

    expect(res5).toHaveHTTPStatus(401);
    expect(dbRes5).toBe(1);


    const res6 = await postForm(taskURL, { _method: 'delete' }, cookies);
    const dbRes6 = await Task.count();

    expect(res6).toHaveHTTPStatus(302);
    expect(dbRes6).toBe(0);
  });


  afterEach((done) => {
    server.close();
    done();
  });
});

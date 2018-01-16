import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import { User, sequelize } from '../models';
import fakeUsers from '../lib/fakeUsers';

import app from '..';


const { queryInterface } = sequelize;


describe('requests', () => {
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
  const usersURL = '/users';
  const sessionURL = '/session';

  const postForm = async (url, form, cookies = '') => request.agent(server)
    .post(url)
    .type('form')
    .set('Cookie', cookies)
    .send(form);

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


    const res1 = await postForm(sessionURL, {});

    expect(res1).toHaveHTTPStatus(200);


    const res2 = await postForm(sessionURL, sessionForm);

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


  beforeAll(() => {
    jasmine.addMatchers(matchers);
  });

  beforeEach(() => {
    server = app().listen();
    return sequelize.sync({ force: true });
  });


  it('Users: Add uniq user', async () => {
    const user = fakeUsers()[0];
    console.log(user);
    const url = '/users';

    const res1 = await postForm(url, user);

    expect(res1).toHaveHTTPStatus(302);

    const res2 = await postForm(url, user);

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
      { ...user, firstName: newName, _method: 'put' },
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

// @flow

import 'babel-polyfill';

import path from 'path';
import Koa from 'koa';
import Pug from 'koa-pug';
import Router from 'koa-router';
import koaLogger from 'koa-logger';
import serve from 'koa-static';
import middleware from 'koa-webpack';
import bodyParser from 'koa-bodyparser';
import session from 'koa-generic-session';
import flash from 'koa-flash-simple';
import _ from 'lodash';
import methodOverride from 'koa-methodoverride';
import Rollbar from 'rollbar';
import dotenv from 'dotenv';

import getWebpackConfig from './webpack.config.babel';
import addRoutes from './routes';
import container from './container';
import { User } from './models';


dotenv.config();

export default () => {
  const app = new Koa();

  const rollbar = new Rollbar(process.env.ROLLBAR_KEY);
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        rollbar.error(err, ctx.request);
      }
      ctx.throw(err);
    }
  });

  app.keys = [process.env.APP_KEY];
  app.use(session(app));
  app.use(flash());
  app.use(async (ctx, next) => {
    ctx.state = {
      flash: ctx.flash,
      isSignedIn: () => ctx.session.userId !== undefined,
      currentUser: await User.findById(ctx.session.userId),
      currentURL: ctx.url,
    };
    await next();
  });
  app.use(bodyParser());
  app.use(methodOverride((req) => {
    // return req?.body?._method;
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      return req.body._method; // eslint-disable-line
    }
    return null;
  }));
  app.use(serve(path.join(__dirname, '..', 'public')));

  if (process.env.NODE_ENV !== 'test') {
    app.use(middleware({
      config: getWebpackConfig(),
    }));
  }

  app.use(koaLogger());

  const router = new Router();
  addRoutes(router, container);
  app.use(router.allowedMethods());
  app.use(router.routes());

  const isDevelopment = process.env.NODE_ENV === 'development';
  const pug = new Pug({
    viewPath: path.join(__dirname, 'views'),
    debug: isDevelopment,
    pretty: isDevelopment,
    compileDebug: isDevelopment,
    noCache: isDevelopment,
    locals: [],
    basedir: path.join(__dirname, 'views'),
    helperPath: [
      { _ },
      { urlFor: (...args) => router.url(...args) },
    ],
  });
  pug.use(app);

  return app;
};

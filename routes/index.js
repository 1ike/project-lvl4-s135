import welcome from './welcome';
import users from './users';
import sessions from './sessions';
import taskStatuses from './taskstatuses';

const controllers = [welcome, users, sessions, taskStatuses];

export default (router, container) => controllers.forEach(f => f(router, container));

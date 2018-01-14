const fakeUsers = require('../lib/fakeUsers');

const NUMBER = 55;

const users = fakeUsers(NUMBER).map((user) => {
  delete user.password;
  return user;
});

/* const users = [{
  firstName: 'a',
  lastName: 'a',
  email: 'a@aaa.aa',
  passwordDigest: 'a',
  createdAt: faker.date.past(),
  updatedAt: faker.date.past(),
}]; */
// console.log(users);


module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.bulkInsert('Users', users, {}),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('Users', null, {}),
};

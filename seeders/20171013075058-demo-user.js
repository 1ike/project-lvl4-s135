

const faker = require('faker');

const NUMBER = 50;

const fakeUsers = (number, acc) => {
  if (number === 0) return acc;

  return fakeUsers(number - 1, [...acc, {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    passwordDigest: faker.internet.password(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  }]);
};

const users = fakeUsers(NUMBER, []);
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

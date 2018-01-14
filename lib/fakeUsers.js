const faker = require('faker');
const { encrypt } = require('../lib/secure');

const fakeUsers = (number = 1, acc = []) => {
  if (number === 0) return acc;

  const password = faker.internet.password();

  return fakeUsers(number - 1, [...acc, {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    password,
    passwordDigest: encrypt(password),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  }]);
};

module.exports = fakeUsers;

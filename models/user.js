import { encrypt } from '../lib/secure';

export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      // unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordDigest: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.VIRTUAL,
      set: function(value) {
        this.setDataValue('passwordDigest', encrypt(value));
        this.setDataValue('password', value);
        return value;
      },
      validate: {
        len: [1, +Infinity],
      },
    },
    fullName: {
      type: DataTypes.VIRTUAL,
      get: function() {
        return `${this.firstName} ${this.lastName}`;
      },
    },
  }, {
    classMethods: {
      associate(models) {
        // associations can be defined here
      },
    },
/*     getterMethods: {
      fullName: function() {
        return `${this.firstName} ${this.lastName}`;
      },
    }, */
  });
  return User;
};

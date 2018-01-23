

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../config/config.js`)[env];
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    dialect: config.dialect,
    host: config.host,
    port: config.port,
    storage: config.storage,
  },
);


fs
  .readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.User.hasMany(db.Task, { foreignKey: 'creatorId', as: 'Creator' });

db.User.hasMany(db.Task, { foreignKey: 'assignedToId', as: 'AssignedTo' });

db.TaskStatus.hasMany(db.Task, { foreignKey: 'statusId', as: 'Status' });

db.Task.belongsToMany(db.Tag, { through: 'TagTask' });
db.Tag.belongsToMany(db.Task, { through: 'TagTask' });

sequelize.sync();

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

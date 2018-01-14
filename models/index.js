

let fs = require('fs');
let path = require('path');
let Sequelize = require('sequelize');

let basename = path.basename(__filename);
let env = process.env.NODE_ENV || 'development';
let config = require(`${__dirname  }/../config/config.js`)[env];
let db = {};

let sequelize = new Sequelize(
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
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    let model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

import findWithPagination from '../lib/findWithPagination';

export default (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    name: {
      allowNull: false,
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'Task name must not be empty',
        },
      },
    },
    description: {
      type: DataTypes.STRING,
    },
    statusId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'Status must not be empty',
        },
      },
    },
    creatorId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'Creator must not be empty',
        },
      },
    },
    assignedToId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'assignedTo must not be empty',
        },
      },
    },
  });

  Task.findWithPagination = findWithPagination;

  return Task;
};

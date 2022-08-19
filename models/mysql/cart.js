const Sequelize = require('sequelize');

const sequelize = require('../../util/mysql/database');

const Cart = sequelize.define('cart',{
  id:{
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  }
})

module.exports = Cart;
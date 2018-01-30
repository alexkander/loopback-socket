'use strict';

const Promise = require('bluebird');

module.exports = function(app) {

  const ds = app.dataSources.permanent;
  
  return new Promise((resolve) => {
    if(ds.connected) {
      resolve();
    } else {
      ds.once('connected', resolve);
    }
  })
  .then(() => {
    return new Promise((resolve) => {
      return ds.automigrate(resolve);
    });
  })
  .then(() => {
    return app.models.MyUser.create([
      {
        email: 'arondn2@gmail.com',
        password: '123456',
      },
    ]);
  })
  .then(() => {
    return app.models.MyModel.create([
      { name: 'Veda Gottesman', type: '4' },
      { name: 'Yetta Suhar', type: '3' },
      { name: 'Thomas Barninger', type: '1' },
      { name: 'Gustavo Mcilroy', type: '4' },
      { name: 'Karri Cottrill', type: '2' },
      { name: 'Rachel Atthowe', type: '2' },
      { name: 'Theresia Widder', type: '3' },
      { name: 'Darrick Mbamalu', type: '1' },
      { name: 'Raymon Lovvorn', type: '4' },
      { name: 'Toshiko Laravie', type: '1' },
      { name: 'Carlee Dejoie', type: '3' },
      { name: 'Shanti Germond', type: '3' },
      { name: 'Martina Mente', type: '1' },
      { name: 'Lyndsey Almeida', type: '2' },
      { name: 'Odis Keaty', type: '1' },
      { name: 'Vincent Forshee', type: '1' },
      { name: 'Duane Fleurissaint', type: '3' },
      { name: 'Mattie Keasley', type: '4' },
      { name: 'Marshall Benard', type: '3' },
      { name: 'Ashley Horelick', type: '4' },
      { name: 'Arianna Schrier', type: '1' },
      { name: 'Chong Bartkowski', type: '2' },
      { name: 'Stella Rusek', type: '4' },
      { name: 'Dixie Devos', type: '2' },
      { name: 'Floyd Munce', type: '4' },
      { name: 'Golden Robare', type: '2' },
      { name: 'Logan Wuitschick', type: '2' },
      { name: 'Seth Roses', type: '4' },
      { name: 'Vania Bandasak', type: '1' },
    ]);
  });

};

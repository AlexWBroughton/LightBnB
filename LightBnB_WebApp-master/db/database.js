const properties = require("./json/properties.json");
const users = require("./json/users.json");

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const values = [guest_id,limit];
  return pool
    .query(`SELECT reservations.*, properties.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;`, values)
    .then((result) => { 
      console.log('hello ' + result);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Properties

/*

*/

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {

  const queryParams = [];
  let whereBool = false;

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `WHERE properties.owner_id =  $${queryParams.length} 
    `;
    whereBool = true;
  }
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    if (whereBool === true){
      queryString += `AND properties.city LIKE $${queryParams.length} 
      `;
    }
    else{
      queryString += `WHERE properties.city LIKE $${queryParams.length} 
      `;
      whereBool = true;
    }
  }
  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night *100}`);
    if (whereBool === true){
      queryString += `AND properties.cost_per_night >= $${queryParams.length} 
      `;
    }else{
      queryString += `WHERE properties.cost_per_night >= $${queryParams.length} 
      `;
      whereBool = true;
    }
  }
  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night *100}`);
    if (whereBool === true){
      queryString += `AND properties.cost_per_night <= $${queryParams.length} 
      `;
    }else{
      queryString += `WHERE properties.cost_per_night <= $${queryParams.length} 
      `;
      whereBool = true;
    }
  }
  queryString += `GROUP BY properties.id
  `;

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length}
    `;
  }

  queryParams.push(limit);
  queryString += `ORDER BY properties.cost_per_night
  LIMIT $${queryParams.length};`;
  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
};


/*
SELECT properties.id, title, cost_per_night, avg(property_reviews.rating) as average_rating
FROM properties
LEFT JOIN property_reviews ON properties.id = property_id
WHERE city LIKE '%ancouv%'
GROUP BY properties.id
HAVING avg(property_reviews.rating) >= 4
ORDER BY cost_per_night
LIMIT 10;

*/



/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = (email) => {
  return pool
  .query('SELECT * FROM users WHERE email = $1;',[email])
  .then(result=> result.rows[0])
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = (id) =>{
  return pool
  .query('SELECT * FROM users WHERE id = $1;',[id])
  .then((result) => {
    console.log('hello ' + result.rows[0].email);
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = (user) => {

  return pool
  .query('INSERT INTO users(name,email,password) VALUES ($1,$2,$3) RETURNING *;',[user.name,user.email,user.password])
  .then((result) => {
    console.log(result.rows);
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });

};

//getUserWithEmail("asherpoole@gmx.com");
getUserWithId(4);


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};

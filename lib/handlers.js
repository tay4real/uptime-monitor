/*
 * Request handlers
 *
 */

// Dependencies
const _data = require('./data')
const helpers = require('./helpers')

// Define the handlers
const handlers = {};

// Users
handlers.users = function(data, callback){
  let acceptbleMethods = ['post', 'get', 'put', 'delete']

  if(acceptbleMethods.indexOf(data.method) > -1){
    handlers._users[data.method](data, callback)
  }else{
    callback(405)
  }
}


// Container for the users submethods
handlers._users = {}

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback){
  // Check that all required fields are filled out
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false 

  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false 

  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false 

  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false 

  const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false 

  console.log(firstName, lastName, phone, tosAgreement)
  
  if(firstName && lastName && phone && tosAgreement){
    // make sure that the user doesn't already exist
    _data.read('users', phone, function(err, data){
        if(err){
          // Hash the password
          const hashedPassword = helpers.hash(password)

          // Create the user object
          if(hashedPassword){
            const userObject = {
              'firstName': firstName,
              'lastname': lastName,
              'phone': phone,
              'hashedPassword': hashedPassword,
              'tosAgreement': true
            }
  
            // Store the user
            _data.create('users', phone, userObject, function(err){
              if(!err){
                callback(200)
              }else{
                callback(500, {'Error': 'Could not create the new user'})
              }
            })
          }else{
            callback(500, {'Error': 'Could not hash the user\'s password'})
          }
          
        }else{
          // User already exist
          callback(400, {'Error': 'A user with that phone number already exists'})
        }
    })
  }else{
    callback(400, {'Error' : 'Missing required fields'})
  }
}

// Users - get
// Required data - phone
// @TODO Only let authenticated users access their own objects, don't let them access anyone elses
handlers._users.get = function(data, callback){
  // Check that the phone number provided is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){
    // Lookup the user
    _data.read('users', phone, function(err, data){
      if(!err && data){
        // Remove the hashed password from the object before returning it to the requester
        delete data.hashedPassword;
        callback(200, data)
      }else{
        callback(404)
      }
    })
  }else{
    callback(400, {'Error': "Missing Required Field"})
  }
}

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let authenticated users update their own object. Don't let them update anyone elses
handlers._users.put = function(data, callback){
  // Check for the required field
  const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

  // Check for the optional fields
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false 
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false 
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false 

  // err if phone is invalid
  if(phone){
    // Error if nothing is sent to update
    if(firstName || lastName || password){
      // lookup user
      _data.read('users', phone, function(err, userData){
        if(!err && userData){
          // Update the neccesary fields
          if(firstName){
            userData.firstName = firstName
          }

          if(lastName){
            userData.lastName = lastName
          }

          if(password){
            userData.hashedPassword = helpers.hash(password)
          }

          // store the new updates
          _data.update('users', phone, userData, function(err){
            if(!err){
              callback(200)
            }else{
              console.log(err)
              callback(500, {'Error': ''}) // used 500 instead of 400 because literally, there is nothing wrong with the user's request, it is an error on the server
            }
          })
        }else{
          callback(400, {'Error': 'The specified user does not exist'})
        }
      })
    }else{
      callback(400, {'Error': 'Missing fields to update'})
    }
  }else{
    callback(400, {'Error': "Missing required field"})
  }
}

// Users - delete
// Required field: phone
// @TODO only let authenticated usrs delete their own objects, not anyone elses
// @TODO cleanup (delete) any other files associated with this user
handlers._users.delete = function(data, callback){
  // check if phone number is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){
    // Lookup the user
    _data.read('users', phone, function(err, data){
      if(!err && data){
       _data.delete('users', phone, function(err){
        if(!err){
          callback(200)
        }else{
          callback(500, {'Error': 'Could not delete the spacified user'})
        }
       })
      }else{
        callback(400, {'Error': 'Could not find the specified user'})
      }
    })
  }else{
    callback(400, {'Error': "Missing Required Field"})
  }
}

// Not found handler
handlers.notfound = function(data, callback){
  callback(404)
}

// Ping handler
handlers.ping = function(data, callback){
  callback(200);
}


// Export the module
module.exports = handlers;
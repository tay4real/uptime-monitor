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
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false; 
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false ;
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false ;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false; 
  const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false ;

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
handlers._users.get = function(data, callback){
  // Check that the phone number provided is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

  
  if(phone){
    //  Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false

    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
      if(tokenIsValid){
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
        callback(403, {'Error': 'Missing required token in header or token is invalid'})
      }
    })   
  }else{
    callback(400, {'Error': "Missing Required Field"})
  }
}

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
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

      //  Get the token from the headers
      const token = typeof(data.headers.token) === 'string' ? data.headers.token : false

       // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
      if(tokenIsValid){
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
        callback(403, {'Error': 'Missing required token in header or token is invalid'})
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

// @TODO cleanup (delete) any other files associated with this user
handlers._users.delete = function(data, callback){
  // check if phone number is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){

     //  Get the token from the headers
     const token = typeof(data.headers.token) === 'string' ? data.headers.token : false

     // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
    if(tokenIsValid){
      // Lookup the user
      _data.read('users', phone, function(err, data){
        if(!err && data){
        _data.delete('users', phone, function(err){
          if(!err){
            callback(200)
          }else{
            callback(500, {'Error': 'Could not delete the specified user'})
          }
        })
        }else{
          callback(400, {'Error': 'Could not find the specified user'})
        }
      })
    }else{
      callback(403, {'Error': 'Missing required token in header or token is invalid'})
    }
  })
   
  }else{
    callback(400, {'Error': "Missing Required Field"})
  }
}



// Tokens
handlers.tokens = function(data, callback){
  let acceptbleMethods = ['post', 'get', 'put', 'delete']

  if(acceptbleMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data, callback)
  }else{
    callback(405)
  }
}

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data, callback){
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false 
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false 

  if(phone && password){
    // lookup the user who matches that phone number
    _data.read('users', phone, function(err, userData){
      if(!err && userData){
        // hash the sent password and compare it to the password saved in the user Object
        const hashedPassword = helpers.hash(password);

        if(hashedPassword === userData.hashedPassword){
          // if valid, create a user token with a random name, set expiration date 1 hour in the future
          const tokenId = helpers.createRandomString(20);

          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            'phone': phone,
            'id': tokenId,
            'expires': expires
          }

          // Store the tokens
          _data.create('tokens', tokenId, tokenObject, function(err){
            if(!err){
              callback(200, tokenObject)
            }else{
              callback(500, {'Error': 'Could not create the new token'})
            }
          })
        }else{
          callback(400, {'Error': 'Password did not match the specified user\'s stored password'})
        }
      }else{
        callback(400, {'Error': 'Could not find the specified user'})
      }
    })
  }else{
    callback(400, {'Error': 'Missing required fields'})
  }
}

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function(data, callback){
   // Check that the id is valid
   const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
   if(id){
     // Lookup the token
     _data.read('tokens', id, function(err, tokenData){
       if(!err && tokenData){
         callback(200, tokenData)
       }else{
         callback(404)
       }
     })
   }else{
     callback(400, {'Error': "Missing Required Field"})
   }
}

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function(data, callback){
  const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false; 
  const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend === true ? true: false; 

  if(id && extend){
    // lookup the token
    _data.read("tokens", id, function(err, tokenData){
      if(!err && tokenData){
        // Check to make sure the token isn't aleadt expired
        if(tokenData.expires > Date.now()){
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updates
          _data.update('tokens', id, tokenData, function(err){
            if(!err){
              callback(200)
            }else{
              callback(500, {'Error': 'Could not update the token\'s expiration'})
            }
          })
        }else{
          callback(400, {'Error': 'The token is expired and cannot be extended'})
        }
      }else{
        callback(400, {'Error': 'Specified token does not exist'})
      }
    })
  }else{
    callback(400, {'Error': 'Missing required field(s) or field(s) are invalid'})
  }

}

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data, callback){
  // check if the id is valid
  const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the user
    _data.read('tokens', id, function(err, data){
      if(!err && data){
       _data.delete('tokens', id, function(err){
        if(!err){
          callback(200)
        }else{
          callback(500, {'Error': 'Could not delete the specified token'})
        }
       })
      }else{
        callback(400, {'Error': 'Could not find the specified token'})
      }
    })
  }else{
    callback(400, {'Error': "Missing Required Field"})
  }
}

// Verify if a given id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback){
  // lookup the token
  _data.read("tokens", id, function(err, tokenData){
    if(!err && tokenData){
      // check that the token is for the given user and has not expired
      if(tokenData.phone === phone && tokenData.expires > Date.now()){
        callback(true)
      }else{
        callback(false)
      }
    }else{
      callback(false)
    }
  })
}


// Ping handler
handlers.ping = function(data, callback){
  callback(200);
}

// Not found handler
handlers.notfound = function(data, callback){
  callback(404)
}


// Export the module
module.exports = handlers;
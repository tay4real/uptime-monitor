/*
 * Helpers for various tasks
 *
 */

// Dependencies
const crypto = require('crypto')
const config = require('./config')

// Container for all the helpers
const helpers = {}


// Create a SHA256 hash
helpers.hash = function(str){
  if(typeof(str) === 'string' && str.length > 0){
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex')
    return hash;
  }else{
    return false;
  }
}

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
  try {
    const obj = JSON.parse(str)
    return obj
  } catch (e) {
    return {}
  }
}

// Create a string of alphanumeric characters of a given length
helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;

  if(strLength){
    // define all possible characters that could go into a string
    const possibleCharcaters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // start the final string
    let str = '';
    for(i=1; i <= strLength; i++){
      // Get a random character from the possibleCharacters srting
      let randomCharacter = possibleCharcaters.charAt(Math.floor(Math.random() * possibleCharcaters.length))
      // Append this character to the final string
      str += randomCharacter;
    }

    // return the final string
    return str;
  }else{
    return false;
  }
}




// Export the module
module.exports = helpers;
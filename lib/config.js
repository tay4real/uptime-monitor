/*
 * Create and export configuration variables
 * 
 */
 
// Conatiner for all the environments

const environments = {}

// Staging (default) environment
environments.staging ={
  'httpPort': 3000,
  'httpsPort': 3001,
  'envname': 'staging',
  'hashingSecret': 'thisIsASecret'
};

// Production environment
environments.production ={
  'httpPort': 5000,
  'httpsPort': 5001,
  'envname': 'production',
  'hashingSecret': 'thisIsAlsoASecret'
};


// Determine which environment was passed as a command-lin argument
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : ''

// Check that the current environment is one of the environments above, if not, default to staging
const environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging

// Export the modules
module.exports = environmentToExport;

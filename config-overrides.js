const multipleEntry = require('react-app-rewire-multiple-entry')([
    {
      entry: 'src/index_vote.js',
      template: 'public/vote.html',
      outPath: '/vote.html'
    }
  ]);
  
  module.exports = {
    webpack: function(config, env) {
      multipleEntry.addMultiEntry(config);
      return config;
    }
  };
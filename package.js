Package.describe({
  name: 'streemo:meteor-react-state-tree',
  version: '0.0.6',
  // Brief, one-line summary of the package.
  summary: 'Easy global scopable reactive state for Meteor, useful in React.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/Streemo/meteor-react-state-tree.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.2.4');
  api.use(['ecmascript','mongo'], 'client')
  api.addFiles('utils.js',"client")
  api.mainModule('State.js', 'client');
});

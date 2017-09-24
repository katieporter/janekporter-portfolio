const Prismic = require('prismic-javascript');
const PrismicDOM = require('prismic-dom');
const request = require('request');
const Cookies = require('cookies');
const PrismicConfig = require('./prismic-configuration');
const Onboarding = require('./onboarding');
const app = require('./config');

const PORT = app.get('port');

app.listen(PORT, () => {
  Onboarding.trigger();
  process.stdout.write(`Point your browser to: http://localhost:${PORT}\n`);
});

// Middleware to inject prismic context
app.use((req, res, next) => {
  res.locals.ctx = {
    endpoint: PrismicConfig.apiEndpoint,
    linkResolver: PrismicConfig.linkResolver,
  };
  // add PrismicDOM in locals to access them in templates.
  res.locals.PrismicDOM = PrismicDOM;
  Prismic.api(PrismicConfig.apiEndpoint, {
    accessToken: PrismicConfig.accessToken,
    req,
  }).then((api) => {
    req.prismic = { api };
    next();
  }).catch((error) => {
    next(error.message);
  });
});

/**
* Route for homepage
*/
app.get(['/', '/projects'], (req, res) =>

  // Query the homepage
  req.prismic.api.getSingle("home").then(home => {

    // If a document is returned...
    if(home) {

      var queryOptions = {
        page: req.params.p || '1',
        orderings: '[my.project.date desc]'
      };

      // Query the projects
      return req.prismic.api.query(
        prismic.Predicates.at("document.type", "project"),
        queryOptions
      ).then(function(response) {

        // Render the homepage
        res.render('home', {
          home,
          projects: response.results
        });
      });

    } else {
      // If a home document is not returned, give an error
      res.status(404).send('Not found');
    }
  })
);

app.get('/project/:uid', (req, res, next) => {
  // We store the param uid in a variable
  const uid = req.params.uid;
  // We are using the function to get a document by its uid
  req.prismic.api.getByUID('project', uid)
  .then((pageContent) => {
     if (pageContent) {
       // pageContent is a document, or null if there is no match
       res.render('project', {
       // Where 'project' is the name of your pug template file (project.pug)
        pageContent,
       });
     } else {
       res.status(404).send('404 not found');
     }
  })
  .catch((error) => {
    next(`error when retriving page ${error.message}`);
  });
});

/*
 * Prismic documentation to build your project with prismic
 */
app.get('/help', (req, res) => {
  const repoRegexp = /^(https?:\/\/([-\w]+)\.[a-z]+\.(io|dev))\/api(\/v2)?$/;
  const [_, repoURL, name, extension, apiVersion] = PrismicConfig.apiEndpoint.match(repoRegexp);
  const host = req.headers.host;
  const isConfigured = name !== 'your-repo-name';
  res.render('help', { isConfigured, repoURL, name, host });
});

/*
 * Preconfigured prismic preview
 */
app.get('/preview', (req, res) => {
  const token = req.query.token;
  if (token) {
    req.prismic.api.previewSession(token, PrismicConfig.linkResolver, '/')
    .then((url) => {
      const cookies = new Cookies(req, res);
      cookies.set(Prismic.previewCookie, token, { maxAge: 30 * 60 * 1000, path: '/', httpOnly: false });
      res.redirect(302, url);
    }).catch((err) => {
      res.status(500).send(`Error 500 in preview: ${err.message}`);
    });
  } else {
    res.send(400, 'Missing token from querystring');
  }
});

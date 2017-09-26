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

/*
 * Homepage route
 */
app.get('/', (req, res, next) => {
  req.prismic.api.getSingle("home")
  .then((pageContent) => {
    if (pageContent) {
      var queryOptions = {
        page: req.params.p || '1',
        orderings: '[my.project.date desc]'
      };

      // Query the projects
      return req.prismic.api.query(
        Prismic.Predicates.at("document.type", "project"),
        queryOptions
      ).then(function(response) {

        // Render the homepage
        res.render('home', {
          pageContent,
          projects: response.results
        });
      });
    } else {
      res.status(404).send('Could not find a home document. Make sure you create and publish a home document in your repository.');
    }
  })
  .catch((error) => {
    next(`error when retriving page ${error.message}`);
  });
});

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

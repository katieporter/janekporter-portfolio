var dest = 'public';
var src = 'src';

module.exports = {
  browserSync: {
    proxy: "http://localhost:3000",
    port: 5000,
    files: "public/**/*.*"
  },
  sass: {
    src: [src + "/stylesheets/**/*.{sass,scss}"],
    dest: dest + '/stylesheets',
    settings: {
      indentedSyntax: true, // Enable .sass syntax!
      imagePath: '/images', // Used by the image-url helper
      includePaths: ['node_modules/modularscale-sass/stylesheets', 'node_modules/flexboxgrid-sass']
    }
  },
  images: {
    src: src + "/images/**",
    dest: dest + "/images"
  },
  public: {
    src: src + "/public/**",
    dest: dest
  },
  production: {
    cssSrc: dest + '/*.css',
    jsSrc: dest + '/*.js',
    dest: dest
  }
};

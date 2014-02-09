# node-modules-dustify

_Dustify: the dustjs template compiler_

Compile [dustjs-linkedin](https://github.com/linkedin/dustjs) templates into static HTML or precompile into javascript.

## Installation

	$ npm install dustify

## Usage

### Console

```
USAGE

dustify [options]

OPTIONS

Name             Description                        Example
--src            A dustjs file or a directory       --src path/to/src
                 containing dustjs files. Can be
                 set multiple times.
--build          The directory to save compiled     --build path/to/build
                 or precompiled dustjs files.
--requireBase    The directory relative to which    --requireBase path/to/src
                 paths to dustjs partials and
                 blocks are resolved.
--precompile     Precompile the dustjs templates    --precompile
                 to javascript instead of
                 compiling to HTML.
--tplData        Data passed to templates when      --tplData.name Bob
                 compiling. Not used when           --tplData.age 28
                 --precompile flag is set. Can
                 be set multiple times.
--inputExt       The file extension used for the    --inputExt .tmpl
                 source dustjs templates. Can be
                 set multiple times. Include the
                 leading period. Defaults to
                 '.dust' and '.tpl'.
--outputExt      The file extension compiled or     --outputExt .htm
                 precompiled templates are saved
                 as. Include the leading period.
                 Defaults to '.js' when
                 --precompile flag is set and
                 '.html' otherwise.
--version        Display version.                   --version
--help           Display this help screen.          --help
```

### Programmatically

```javascript
var dustify = require("dustify");
dustify(OPTIONS,function(err){
	if (err) {
		// an error has occurred
		throw err;
	} else {
		// dustjs templates successfully (pre)compiled
	}
});
```

`OPTIONS` is an object which accepts the same keys as the console options described above.

## Tests [![Build Status](https://travis-ci.org/theakman2/node-modules-dustify.png?branch=master)](https://travis-ci.org/theakman2/node-modules-dustify)

	$ npm test
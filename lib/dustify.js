var path = require("path");

var fs = require("fs-extra");
var dust = require("dustjs-recursivenodecompiler");
var async = require("async");

var EXTNAME_REGEX = /\.[^.]*$/;

var VCS_EXTENSIONS = ['.git', '.svn', '.hg', '.bzr'];
var TEMPLATE_EXTENSIONS = [".dust",".tpl"];

function noop() {}

function getExtName(p) {
	var match = EXTNAME_REGEX.exec(p);
	if (match) {
		return match[0];
	}
	return "";
}

function sharedStart(arr) {
	var a = arr.slice(0).sort();
	var word1 = a[0];
	var word2 = a[a.length - 1];
	var i = 0;
	var len = word1.length;
	while (word1.charAt(i) == word2.charAt(i)) {
		++i;
		if (i >= len) {
			break;
		}
	}
	return word1.substring(0, i);
}

function sharedDir(arr) {
	var common = sharedStart(arr);
	for (var i = 0, len = arr.length; i < len; ++i) {
		if (common === arr[i]) {
			return path.dirname(common);
		}
	}
	return common;
}

module.exports = function(opts, done) {
	if (!opts.src) {
		done(new Error("opts.src must be defined"));
		return;
	}
	
	if (!opts.build || typeof opts.build !== "string") {
		done(new Error("opts.build must be defined and a string"));
		return;
	}
	
	var _files = Array.isArray(opts.src) ? opts.src : [ opts.src ];
	var build = path.resolve(opts.build);
	
	var templateExtensions;
	if (typeof opts.inputExt === "string") {
		templateExtensions = [opts.inputExt];
	} else if (Array.isArray(opts.inputExt)) {
		templateExtensions = opts.inputExt;
	} else {
		templateExtensions = TEMPLATE_EXTENSIONS;
	}
	
	if (opts.outputExt && typeof opts.outputExt === "string") {
		var outputFileExtension = opts.outputExt;
	} else {
		var outputFileExtension = ".html";
	}
	
	if (outputFileExtension[0] !== ".") {
		outputFileExtension = "." + outputFileExtension;
	}
	
	var templateData = opts.tplData || {};
	
	var i = _files.length;
	var resolvedFiles = new Array(i);
	
	while (i--) {
		if (typeof _files[i] !== "string") {
			done(new Error("opts.src must be a string or an array of strings"));
			return;
		}
		resolvedFiles[i] = path.resolve(_files[i]);
	}
	
	function getFilesToProcess(files, arr, cb) {
		async.each(files, function(file, cb2) {
			var ext = getExtName(file);
			if (VCS_EXTENSIONS.indexOf(ext) > -1) {
				cb2(null);
				return;
			}
			if (typeof opts.exclude === "function" && opts.exclude(file)) {
				cb2(null);
				return;
			}
			fs.stat(file,function(err,stats){
				if (err) {
					cb2(err);
					return;
				}
				if (stats.isDirectory()) {
					fs.readdir(file, function(err, subFiles) {
						if (err) {
							cb2(err);
							return;
						}
						var newFiles = subFiles.map(function(subFile) {
							return path.join(file, subFile);
						});
						getFilesToProcess(newFiles, arr, cb2);
					});
				} else {
					if (templateExtensions.indexOf(ext) > -1) {
						arr.push(file);
					}
					cb2(null);
				}
			});
		}, function(err) {
			if (err) {
				cb(err);
				return;
			}
			cb(null, arr);
		});
	}
	var ret = {};
	getFilesToProcess(resolvedFiles, [], function(err, filesToProcess) {
		if (err || !filesToProcess.length) {
			done(err,ret);
			return;
		}
		var common = sharedDir(filesToProcess);
		async.each(filesToProcess, function(file, cb2) {
			fs.readFile(file, function(err, contents) {
				if (err) {
					cb2(err);
					return;
				}
				var contents = contents.toString();
				function dustDone(err2,out) {
					if (err2) {
						cb2(err2);
						return;
					}
					var output = path.join(build, file.replace(common, ""));
					output = output.replace(EXTNAME_REGEX,outputFileExtension);
					if (!getExtName(output)) {
						output += outputFileExtension;
					}
					ret[file] = output;
					fs.outputFile(output, out, cb2);
				}
				var compiledMap = dust.compileMap(contents,file);
				var compiled = dust.compiledMapToString(compiledMap);
				dust.loadSource(compiled); // this is very hacky
				dust.render(compiledMap[file].registeredAs,templateData,dustDone);
			});
		}, function(e){
			done(e,ret);
		});
	});
};
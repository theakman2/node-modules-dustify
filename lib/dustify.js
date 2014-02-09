var path = require("path");

var fs = require("fs-extra");
var dust = require("dustjs-linkedin");
var async = require("async");

var EXTNAME_REGEX = /\.[^.]*$/;

var VCS_EXTENSIONS = ['.git', '.svn', '.hg', '.bzr'];
var TEMPLATE_EXTENSIONS = [".dust",".tpl"];

function noop() {
}

function getExtName(p) {
	var match = EXTNAME_REGEX.exec(p);
	if (match) {
		return match[0];
	}
	return "";
}

function sharedStart(array) {
	var A = array.slice(0).sort(), word1 = A[0], word2 = A[A.length - 1], i = 0;
	while (word1.charAt(i) == word2.charAt(i)) {
		++i;
	}
	return word1.substring(0, i);
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
		var outputFileExtension = opts.precompile ? ".js" : ".html";
	}
	
	if (outputFileExtension[0] !== ".") {
		outputFileExtension = "." + outputFileExtension;
	}
	
	var templateData = opts.tplData || {};
	if (opts.requireBase && typeof opts.requireBase === "string") {
		var requireBase = path.resolve(opts.requireBase);
	} else {
		var requireBase = null;
	}
	var _fileCache = {};
	
	var i = _files.length;
	var resolvedFiles = new Array(i);
	
	while (i--) {
		if (typeof _files[i] !== "string") {
			done(new Error("opts.src must be a string or an array of strings"));
			return;
		}
		resolvedFiles[i] = path.resolve(_files[i]);
	}
	
	function onLoad(name, cb) {
		var p = path.join(requireBase, name);
		if (_fileCache.hasOwnProperty(p)) {
			cb(null, _fileCache[p]);
			return;
		}
		fs.readFile(p, function(err, c) {
			if (err) {
				cb(err);
				return;
			}
			_fileCache[p] = c.toString();
			cb(null, _fileCache[p]);
		});
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
	
	getFilesToProcess(resolvedFiles, [], function(err, filesToProcess) {
		if (err || !filesToProcess.length) {
			done(err,filesToProcess);
			return;
		}
		var common = sharedStart(filesToProcess);
		async.each(filesToProcess, function(file, cb2) {
			fs.readFile(file, function(err, contents) {
				if (err) {
					cb2(err);
					return;
				}
				if (requireBase) {
					dust.onLoad = onLoad;
				}
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
					fs.outputFile(output, out, cb2);
				}
				if (opts.precompile) {
					var compiled;
					try {
						compiled = dust.compile(
							contents.toString(),
							path.basename(file,getExtName(file))
						);
					} catch(e) {
						dustDone(e);
						return;
					}
					dustDone(null,compiled);
				} else {
					dust.renderSource(contents.toString(), templateData, dustDone);
				}
			});
		}, function(e){
			done(e,filesToProcess);
		});
	});
};
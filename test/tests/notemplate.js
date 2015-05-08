var path = require("path");

var fs = require("fs-extra");

var test = require("tap").test;

var dustjstmpl = require("../../lib/dustjs-tmpl.js");

var re = /dummy$/;

test("notemplate", function(t) {
	var opts = {
		src : path.join(__dirname,"..","src","notemplate","pages"),
		build : path.join(__dirname,"..","public","notemplate"),
		exclude:function(file) {
			return re.test(file);
		},
		tplData : {
			name : "bob"
		}
	};
	fs.remove(opts.build,function(err){
		if (err) {
			t.fail("error when attempting to remove build directory " + err);
			t.end();
			return;
		}
		dustjstmpl(opts, function(err,processedFiles) {
			if (err) {
				t.fail("dustjs-tmpl errored: " + err);
				t.end();
				return;
			}
			t.pass("dustjs-tmpl did not error");
			t.equivalent(processedFiles,{},"0 files should have been processed");
			fs.readdir(opts.build,function(err){
				if (err && (err.code === "ENOENT")) {
					t.ok("build directory wasn't created");
				} else {
					t.fail("build directory was created when it shouldn't have been");
				}
				t.end();
			});
		});
	});
});
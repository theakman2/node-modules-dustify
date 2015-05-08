var path = require("path");

var fs = require("fs-extra");

var test = require("tap").test;

var dustjstmpl = require("../../lib/dustjs-tmpl.js");

test("manytemplates", function(t) {
	var opts = {
		src : path.join(__dirname,"..","src","manytemplates","pages"),
		build : path.join(__dirname,"..","public","manytemplates"),
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
			
			var processed = {};
			processed[path.join(__dirname,"..","src","manytemplates","pages","page1.tpl")] = path.join(__dirname,"..","public","manytemplates","page1.html");
			processed[path.join(__dirname,"..","src","manytemplates","pages","page2.dust")] = path.join(__dirname,"..","public","manytemplates","page2.html");
			processed[path.join(__dirname,"..","src","manytemplates","pages","sub","page3.dust")] = path.join(__dirname,"..","public","manytemplates","sub","page3.html");
			
			t.equivalent(processedFiles,processed,"3 files should have been processed");
			fs.readdir(opts.build,function(err,files){
				if (err) {
					t.fail("could not read contents of build directory");
					t.end();
					return;
				}
				var shouldBe = ["sub","page1.html","page2.html"].sort();
				t.equivalent(files.sort(),shouldBe,"contents of build directory should be " + shouldBe);
				fs.readFile(opts.build + "/page1.html",function(err,contents){
					if (err) {
						t.fail("error reading contents of " + opts.build + "/page1.html");
						t.end();
						return;
					}
					t.strictEqual(
						contents.toString(),
						"My name is bob and foo and page1top.",
						"contents of page1.html"
					);
					fs.readFile(opts.build + "/sub/page3.html",function(err,contents){
						if (err) {
							t.fail("error reading contents of " + opts.build + "/sub/page3.html");
							t.end();
							return;
						}
						t.strictEqual(
							contents.toString(),
							"My name is bob and foo and page3top.",
							"contents of page3.html"
						);
						fs.readFile(opts.build + "/page2.html",function(err,contents){
							if (err) {
								t.fail("error reading contents of " + opts.build + "/page2.html");
								t.end();
								return;
							}
							t.strictEqual(
								contents.toString(),
								"My name is bob and foo and page2top.",
								"contents of page2.html"
							);
							t.end();
						});
					});
				});
			});
		});
	});
});
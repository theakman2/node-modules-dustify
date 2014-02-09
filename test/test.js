var fs = require("fs-extra");

var test = require("tap").test;

var dustify = require("../lib/dustify.js");

test("dustify compile", function(t) {
	var opts = {
		src : __dirname + "/src/pages",
		build : __dirname + "/public",
		requireBase : __dirname + "/src",
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
		dustify(opts, function(err,processedFiles) {
			if (err) {
				t.fail("dustify errored: " + err);
				t.end();
				return;
			}
			t.pass("dustify did not error");
			t.strictEqual(processedFiles.length,3,"3 files should have been processed");
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

test("dustify precompile", function(t) {
	var opts = {
		src : __dirname + "/src/pages",
		build : __dirname + "/build",
		requireBase : __dirname + "/src",
		precompile: true,
		exclude:function(p){
			return /page1\.tpl$/.test(p);
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
		dustify(opts, function(err,processedFiles) {
			if (err) {
				t.fail("dustify errored: " + err);
				t.end();
				return;
			}
			t.pass("dustify did not error");
			t.strictEqual(processedFiles.length,2,"2 files should have been processed");
			fs.readdir(opts.build,function(err,files){
				if (err) {
					t.fail("could not read contents of build directory");
					t.end();
					return;
				}
				var shouldBe = ["sub","page2.js"].sort();
				t.equivalent(files.sort(),shouldBe,"contents of build directory should be " + shouldBe);
				fs.readdir(opts.build + "/sub",function(err,files){
					if (err) {
						t.fail("could not read contents of build/sub directory");
						t.end();
						return;
					}
					t.equivalent(files,["page3.js"],"build/sub directory should contain only page3.js");
					t.end();
				});
			});
		});
	});
});

test("dustify no files", function(t) {
	var opts = {
		src : __dirname + "/src/pages",
		build : __dirname + "/build",
		requireBase : __dirname + "/src",
		precompile: true,
		inputExt:".foo",
		tplData : {
			name : "bob"
		}
	};
	dustify(opts, function(err,processedFiles) {
		if (err) {
			t.fail("dustify errored: " + err);
			t.end();
			return;
		}
		t.pass("dustify did not error");
		t.strictEqual(processedFiles.length,0,"no files should have been processed");
		t.end();
	});
});
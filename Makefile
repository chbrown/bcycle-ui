BIN = node_modules/.bin

all: build/bundle.js build/bundle.min.js site.css favicon.ico

$(BIN)/browserify $(BIN)/watchify:
	npm install

.INTERMEDIATE: favicon-16.png favicon-32.png
favicon-%.png: logo.png
	convert $<[0] -resize $*x$* $@
favicon.ico: favicon-16.png favicon-32.png
	convert $^ $@

%.css: %.less
	lessc $< | cleancss --keep-line-breaks --skip-advanced -o $@

%.min.js: %.js
	closure-compiler --angular_pass --language_in ECMASCRIPT5 --warning_level QUIET $< >$@

build/bundle.js: app.js $(BIN)/browserify
	mkdir -p $(@D)
	$(BIN)/browserify -t babelify -t browserify-ngannotate $< -o $@

dev: $(BIN)/watchify
	$(BIN)/watchify -t babelify app.js -o build/bundle.js -v

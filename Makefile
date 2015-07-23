BIN = node_modules/.bin

all: build/bundle.js build/bundle.min.js site.css favicon.ico

$(BIN)/watsh $(BIN)/browserify $(BIN)/watchify $(BIN)/lessc $(BIN)/cleancss:
	npm install

.INTERMEDIATE: favicon-16.png favicon-32.png
favicon-%.png: logo.png
	convert $<[0] -resize $*x$* $@
favicon.ico: favicon-16.png favicon-32.png
	convert $^ $@

%.css: %.less $(BIN)/lessc $(BIN)/cleancss
	$(BIN)/lessc $< | $(BIN)/cleancss --keep-line-breaks --skip-advanced -o $@

%.min.js: %.js
	closure-compiler --angular_pass --language_in ECMASCRIPT5 --warning_level QUIET $< >$@

build/bundle.js: app.js $(BIN)/browserify
	mkdir -p $(@D)
	$(BIN)/browserify -t babelify -t browserify-ngannotate $< -o $@

dev: $(BIN)/watsh $(BIN)/watchify
	(\
   $(BIN)/watsh 'make site.css' site.less & \
   $(BIN)/watchify -t babelify -t browserify-ngannotate app.js -o build/bundle.js -v & \
   wait)

import * as assert from 'assert/strict';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

const languagesJSPath = path.resolve(import.meta.dirname, '..', 'lib', 'languages.cjs');
const typeDefinitionsPath = path.resolve(import.meta.dirname, '..', 'index.d.ts');

const response = await fetch('https://translate.google.com/');
assert.ok(response.ok);

const html = await response.text();
const dataArrayString = await html.match(
	/AF_initDataCallback\({key: 'ds:3', hash: '.', data:(?<data>\[\[[^;]*\]\]), sideChannel: {}}\);/
);
assert.notEqual(dataArrayString, null);

const dataArray = JSON.parse(dataArrayString.groups.data);
const langs = dataArray[0];

// TS DEFINITIONS INJECTION
// Object
(function (){
	const tsFileString = readFileSync(typeDefinitionsPath, {encoding: 'utf-8'});

	const tsTargetStart = 'declare enum languages {\n';
	let tsInjection = tsTargetStart;
	for (const lang of langs) {
		tsInjection += `	"${lang[0]}" = "${lang[1]}",\n`;
	}

	const tsFirstHalf = tsFileString.slice(0, tsFileString.indexOf(tsTargetStart));

	const tsTargetEnd = '}';
	let tsEndHalf = tsFileString.slice(tsFileString.indexOf(tsTargetStart));
	tsEndHalf = tsEndHalf.slice(tsEndHalf.indexOf(tsTargetEnd));

	writeFileSync( typeDefinitionsPath, tsFirstHalf + tsInjection + tsEndHalf );
})();

// Constant enum of languages
(function (){
	const tsFileString = readFileSync(typeDefinitionsPath, {encoding: 'utf-8'});

	const tsTargetStart = '	export const enum languages {\n';
	let tsInjection = tsTargetStart;
	for (const lang of langs) {
		tsInjection += `		"${lang[0]}" = "${lang[1]}",\n`;
	}

	const tsFirstHalf = tsFileString.slice(0, tsFileString.indexOf(tsTargetStart));

	const tsTargetEnd = '	}';
	let tsEndHalf = tsFileString.slice(tsFileString.indexOf(tsTargetStart));
	tsEndHalf = tsEndHalf.slice(tsEndHalf.indexOf(tsTargetEnd));

	writeFileSync( typeDefinitionsPath, tsFirstHalf + tsInjection + tsEndHalf );
})();

// JS FILE INJECTION

langs.splice(1, 0, ['auto', 'Automatic']);

function addBackCompatLang(target, backCompat) {
	langs.splice(
		langs.findIndex( l => l[0] == target),
		0,
		backCompat
	);
}

addBackCompatLang('iw', ['he', 'Hebrew']);
addBackCompatLang('pt', ['pt', 'Portuguese']);
addBackCompatLang('pa', ['pa', 'Punjabi']);

const languagesJSString = readFileSync(languagesJSPath, {encoding: 'utf-8'});

const jsTargetStart = 'const langs = {\n';
let jsLanguagesInjection = jsTargetStart;
for (const lang of langs) {
	jsLanguagesInjection += `    '${lang[0]}': '${lang[1]}',\n`;
}

const jsFirstHalf = languagesJSString.slice(0, languagesJSString.indexOf(jsTargetStart));

const jsTargetEnd = '};';
let jsEndHalf = languagesJSString.slice(languagesJSString.indexOf(jsTargetStart));
jsEndHalf = jsEndHalf.slice(jsEndHalf.indexOf(jsTargetEnd));

writeFileSync( languagesJSPath, jsFirstHalf + jsLanguagesInjection + jsEndHalf );
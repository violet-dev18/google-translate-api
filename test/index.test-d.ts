import { expectAssignable, expectType } from 'tsd';
import translateDefaultImport, { translate, Translator, googleTranslateApi, speak, singleTranslate, batchTranslate, isSupported, getCode, languages } from '..';

// Expect assignable since the default import is a function with properties, i.e. `translateDefaultImport('text to translate', { to: 'nl' })` and `translateDefaultImport.isSupported('nl')` both work
expectAssignable<typeof translate>(translateDefaultImport)
// expectType<typeof translateDefaultImport.translate>(translate) // While this would be valid in the JS, it is not a
// breaking issue

expectType<Promise<googleTranslateApi.TranslationResponse>>(translate('abc'));
expectType<Promise<googleTranslateApi.TranslationResponse[]>>(translate(['a', {text: 'b', to: 'nl'}, 'c']));
expectType<Promise<{a: googleTranslateApi.TranslationResponse, b: googleTranslateApi.TranslationResponse}>>(translate({a: 'test', b: {text: 'b', to: 'nl'}}));

const translator = new Translator();
expectType<Promise<googleTranslateApi.TranslationResponse>>(translator.translate('abc'));
expectType<Promise<googleTranslateApi.TranslationResponse[]>>(translator.translate(['a', {text: 'b', to: 'nl'}, 'c']));
expectType<Promise<{a: googleTranslateApi.TranslationResponse, b: googleTranslateApi.TranslationResponse}>>(translator.translate({a: 'test', b: {text: 'b', to: 'nl'}}));

expectType<Promise<string>>(speak('abc'));
expectType<Promise<string[]>>(speak(['a', {text: 'b', to: 'nl'}, 'c']))
expectType<Promise<{a: string, b: string}>>(speak({a: 'test', b: {text: 'b', to: 'nl'}}));

expectType<Promise<googleTranslateApi.TranslationResponse>>(singleTranslate('abc'));

expectType<Promise<googleTranslateApi.TranslationResponse>>(batchTranslate('abc'));
expectType<Promise<googleTranslateApi.TranslationResponse[]>>(batchTranslate(['a', {text: 'b', to: 'nl'}, 'c']));
expectType<Promise<{a: googleTranslateApi.TranslationResponse, b: googleTranslateApi.TranslationResponse}>>(batchTranslate({a: 'test', b: {text: 'b', to: 'nl'}}));

expectType<boolean>(isSupported('en'));
expectType<string | null>(getCode('en'));
expectAssignable<Record<string, string>>(languages);
expectType<googleTranslateApi.languages.en>(googleTranslateApi.languages.en);

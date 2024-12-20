import assert from 'assert';
import { batchTranslate } from '../index.cjs';

describe('batchTranslate()', function () {
	this.timeout(5000);
	this.retries(10);

	it('should translate with defaults', async () => {
		const res = await batchTranslate('vertaler', {});

		assert.equal(res.text, 'translator');
		assert.equal(res.from.language.iso, 'nl');
		assert.equal(res.from.text.autoCorrected, false);
		assert.equal(res.from.text.value, '');
		assert.equal(res.from.text.didYouMean, false);
		assert(res.raw);
	});

	xit('should translate correct word expecting didYouMean and autoCorrected false', async () => {
		const res = await batchTranslate('El gato.', {from: 'es', to: 'en'});

		assert.equal(res.text, 'The cat.');
		assert.equal(res.from.language.didYouMean, false);
		assert.equal(res.from.language.iso, 'es');
		assert.equal(res.from.text.autoCorrected, false);
		assert.equal(res.from.text.value, '');
		assert.equal(res.from.text.didYouMean, false);
		assert(res.raw);
	});

	// This test will fail, the batch translate sometimes autocorrects even when not requested- 
	// unless the X-Goog-BatchExecute-BGR header is passed
	// see https://github.com/AidanWelch/google-translate-api/issues/18
	xit('should translate mispelled expecting not autocorrected', async () => {
		const res = await batchTranslate('I spea Dutch!', {from: 'en', to: 'nl'});
		
		assert(res.from.text.didYouMean);
		assert.equal(res.from.text.autoCorrected, false);
		assert.equal(res.from.text.value, 'I [speak] Dutch!');
		assert(res.from.text.didYouMean);
		assert.equal(res.text, 'Ik spreek Nederlands!');
	});

	it('should translate via custom tld', async () => {
		const res = await batchTranslate('vertaler', {tld: 'hk'});

		assert.equal(res.text, 'translator');
	});

	it('should pass request options', async () => {
		const abortController = new AbortController();
		const requestOptions = {
			signal: abortController.signal
		};
		abortController.abort();
		await assert.rejects(batchTranslate('vertaler', {requestOptions}), 'AbortError');
	});

	it('should translate array input', async () => {
		const res = await batchTranslate(['dog', 'cat'], {from: 'en', to: 'es'});

		assert.equal(res.length, 2);
		assert.equal(res[0].text, 'perra');
		assert.equal(res[1].text, 'gata');
	});

	it('should translate object input', async () => {
		const res = await batchTranslate({dog: 'dog', cat: 'cat'}, {from: 'en', to: 'es'});

		assert.equal(res.dog.text, 'perra');
		assert.equal(res.cat.text, 'gata');
	});

	it('should translate on some empty input', async () => {
		const res = await batchTranslate({dog: 'dog', empty: ''}, {from: 'en', to: 'es'});

		assert.equal(res.dog.text, 'perra');
		assert.equal(res.empty.text, '');
	});

	it('should translate on just empty input', async () => {
		const res = await batchTranslate([''], {from: 'en', to: 'es'});

		assert.equal(res[0].text, '');
	});

	it('should option query translate different languages', async () => {
		const res = await batchTranslate([{text: 'dog', to: 'ar'}, 'cat'], {from: 'en', to: 'es'});
	
		assert.equal(res[0].text, 'كلب');
		assert.equal(res[1].text, 'gata');
	});

	it('should translate large batch', async () => {
		const maxErrors = 50;
		const sources = [];
		const targets = [];
		for (let i = 0; i < 100; i++) {
			const mod = i % 3;
			if (mod === 0) {
				sources.push('uno');
				targets.push('one');
			} else if (mod === 1) {
				sources.push('dos');
				targets.push('two');
			} else {
				sources.push('tres');
				targets.push('three');
			}
		}

		const res = await batchTranslate(sources, {from: 'es', to: 'en', rejectOnPartialFail: false});

		let errors = 0;
		const translations = res.map((translation, index) => {
			if (translation !== null) {
				return translation.text;
			}
			if (errors >= maxErrors) {
				assert.fail(`exceeded ${maxErrors} translation fails`);
			}
			errors++;
			return targets[index];
		});

		assert.deepEqual(translations, targets);
	});

	it('should default to English on some incorrect iso forced', async () => {
		const resTo = await batchTranslate('This is a test', {to: 'testing', from: 'en', forceTo: true});

		assert.equal(resTo.text, 'This is a test');

		const resFrom = await batchTranslate('Tohle je zkouška', {to: 'en', from: 'anotherone', forceFrom: true});

		assert.equal(resFrom.text, 'Tohle je zkouška');
	});

	it('should error on other incorrect isos forced', async () => {
		await assert.rejects(batchTranslate('This is a test', {to: 'abc', from: 'en', forceTo: true}));
		await assert.rejects(batchTranslate('This is a test', {to: 'en', from: 'ii', forceFrom: true}));
	});

	it('should reject on incorrect iso not forced', async () => {
		await assert.rejects(batchTranslate('This is a test', {to: 'abc', from: 'en'}));
		await assert.rejects(batchTranslate('This is a test', {to: 'en', from: 'ii'}));
	});

	xit('should give pronunciation', async () => {
		const res = await batchTranslate('translator', {from: 'auto', to: 'zh-CN'});

		// here can be 2 variants: 'Yì zhě', 'Fānyì'
		assert.match(res.pronunciation, /^(Yì zhě)|(Fānyì)|(Fānyì)$/);
	});

	it('should translate some english text setting the source language as portuguese', async () => {
		const res = await batchTranslate('happy', {from: 'pt', to: 'nl'});

		assert(res.from.language.didYouMean);
		assert.equal(res.from.language.iso, 'en');
	});

	it('should translate several sentences with spaces (#73)', async () => {
		const res = await batchTranslate(
			'translator, translator. translator! translator? translator,translator.translator!translator?',
			{from: 'auto', to: 'nl'}
		);
		assert(
			res.text === 'vertaler, vertaler. vertaler! vertaler? vertaler,vertaler.vertaler!vertaler?' ||
			res.text === 'vertaler, vertaler. vertaler! vertaler? Vertaler, vertaler.translator! Vertaler?',
			res.text
		);
	});

	it('should reject on partial fail true', async () => {
		const sources = [];
		const targets = [];
		for (let i = 0; i < 1000; i++) {
			const mod = i % 3;
			if (mod === 0) {
				sources.push('uno');
				targets.push('one');
			} else if (mod === 1) {
				sources.push('dos');
				targets.push('two');
			} else {
				sources.push('tres');
				targets.push('three');
			}
		}

		try {
			const res = await batchTranslate(sources, {from: 'es', to: 'en', rejectOnPartialFail: true});
			const translations = res.map((translation) => {
				if (translation === null) {
					assert.fail('Set translation to `null` instead of rejecting on partial fail');
				}
				return translation.text;
			});
			assert.deepEqual(translations, targets);
		} catch (e) {
			assert(e.message.includes('Partial Translation Request Fail'), 'Fail error: ' + e.message);
		}
	});
});
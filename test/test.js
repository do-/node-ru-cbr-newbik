const assert = require ('assert')
const {RuCBRNewBikReader} = require ('../')

async function main () {

	const reader = await RuCBRNewBikReader.fromFile ('./test/20220119ED01OSBR.zip', {})
	
	let n = 0; for await (r of reader) if (r.regn == 316) {

		assert.strictEqual (r.account, '30101810845250000245')	
	
	}

}

main ()

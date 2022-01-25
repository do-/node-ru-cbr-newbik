const  assert              = require ('assert')
const {Transform}          = require ('stream')
const  zip                 = require ('unzippo')
const  iconv               = require ('iconv-lite')
const {XMLReader, XMLNode} = require ('xml-toolkit')

const namespaceURI = 'urn:cbr-ru:ed:v2.0', localName = 'BICDirectoryEntry'

const EMPTY_ACC = [{}]

const filterElements = e => {

	if (e.namespaceURI !== namespaceURI) throw new Error ('Unknown namespace URI: ' + e.namespaceURI + ', expected: ' + namespaceURI)

	return e.localName === localName

}

const RuCBRNewBikReader = class extends Transform {

	constructor (options = {}) {

		options.objectMode = true
		
		super (options)

		this.filterParticipantInfo = options.filterParticipantInfo
		this.filterAccounts = options.filterAccounts
		
		const {getName} = options
		
		this.k = {
			bic: getName ('BIC'),
			pif: getName ('ParticipantInfo'),
			acc: getName ('Accounts'),
		}
		
	}
	
	getAccounts (node) {

		let a = node [this.k.acc]

		if (!a) return EMPTY_ACC
		
		if (!Array.isArray (a)) a = [a]
		
		a = a.filter (this.filterAccounts)
		
		if (a.length === 0) return EMPTY_ACC
		
		return a
	
	}
	
	_transform (node, encoding, callback) {
	
		const pif = node [this.k.pif]
	
		if (this.filterParticipantInfo (pif)) {

			const bic = node [this.k.bic]
			
			for (const a of this.getAccounts (node)) {
			
			this.push ({

				[this.k.bic]: bic, 

				...pif, 

				...a,

			})}

		}
		
		callback ()
	
	}

}

RuCBRNewBikReader.fromFile = async function (fn, options = {}) {

	if (!('lowercase' in options)) options.lowercase = true
	assert (options.lowercase === true || options.lowercase === false, 'options.lowercase must be boolean, not ' + typeof options.lowercase)

	if (!('filterParticipantInfo' in options)) {	
		const K = options.lowercase ? 'pttype' : 'PtType'
		options.filterParticipantInfo = e => {
			switch (e [K]) {
				case '20':
				case '30':
					return true
				default:
					return false
			}
		}
	}
	assert (typeof options.filterParticipantInfo === 'function', 'options.filterParticipantInfo must be a function')

	if (!('filterAccounts' in options)) {	
		const K = options.lowercase ? 'regulationaccounttype' : 'RegulationAccountType'
		options.filterAccounts = e => e [K] === 'CRSA'
	}
	assert (typeof options.filterAccounts === 'function', 'options.filterAccounts must be a function')

	const getName = options.lowercase ? s => s.toLowerCase () : s => s

	const dir = await zip.list (fn)
	
	const names = Object.keys (dir), {length} = names; if (length !== 1) throw new Error ('Expected 1 entry, found' + length)

	const is1251 = await zip.open (fn, names [0])	
	
	const is = is1251.pipe (iconv.decodeStream ('win1251'))
	is1251.on ('error', e => is.destroy (e))
	
	const nodes = new XMLReader ({filterElements,	map: XMLNode.toObject ({getName})}).process (is)
	is.on ('error', e => nodes.destroy (e))
	
	const lines = nodes.pipe (new RuCBRNewBikReader ({...options, getName}))
	nodes.on ('error', e => lines.destroy (e))

	return lines

}

module.exports = RuCBRNewBikReader
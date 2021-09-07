require('dotenv').config()

const algoliasearch = require('algoliasearch')
const rules = require('modele-social')
const getSimulationData = require('../../source/pages/Simulateurs/metadata-src')

const { ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY } = process.env

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY)

const rulesIndex = client.initIndex('rules')
const simulateursIndex = client.initIndex('simulateurs')

const formatRulesToAlgolia = (rules) => {
	const ruleEntries = Object.entries(rules)
	return ruleEntries
		.map(([n, rule]) => {
			if (rule) {
				const path = n.split(' . ')
				const ruleName = `${path[path.length - 1]} ${
					rule.icônes ? ' ' + rule.icônes : ''
				}`
				const namespace = path.length === 1 ? [] : path.slice(0, -1)
				return {
					objectID: n,
					path,
					ruleName,
					namespace,
					pathDepth: path.length,
					acronyme: rule.acronyme,
					titre: rule.titre || ruleName,
					icone: rule.icônes,
					description: rule.description,
				}
			}
		})
		.filter((r) => Boolean(r))
}

const formatSimulationDataToAlgolia = (simulations) => {
	const entries = Object.entries(simulations)

	const data = entries.map(([id, simulation]) => {
		return {
			...simulation,
			objectID: id,
			title: simulation.title || simulation.shortName || simulation.meta.title,
			description: simulation.meta ? simulation.meta.description : undefined,
		}
	})

	return data
}

;(async function () {
	try {
		console.log('Algolia update START')

		console.log('Clearing: rules')
		await rulesIndex.clearObjects().wait()
		console.log('Configure index: rules')
		await rulesIndex
			.setSettings({
				minWordSizefor1Typo: 4,
				minWordSizefor2Typos: 8,
				hitsPerPage: 20,
				maxValuesPerFacet: 100,
				attributesToIndex: ['unordered(namespace)', 'unordered(ruleName)'],
				numericAttributesToIndex: null,
				attributesToRetrieve: null,
				unretrievableAttributes: null,
				optionalWords: null,
				attributesForFaceting: null,
				attributesToSnippet: null,
				attributesToHighlight: ['namespace', 'ruleName'],
				paginationLimitedTo: 1000,
				attributeForDistinct: null,
				exactOnSingleWordQuery: 'attribute',
				ranking: [
					'typo',
					'geo',
					'words',
					'filters',
					'proximity',
					'attribute',
					'exact',
					'custom',
				],
				customRanking: null,
				separatorsToIndex: '',
				removeWordsIfNoResults: 'none',
				queryType: 'prefixLast',
				highlightPreTag: '<em>',
				highlightPostTag: '</em>',
				snippetEllipsisText: '',
				alternativesAsExact: ['ignorePlurals', 'singleWordSynonym'],
			})
			.wait()
		console.log('Uploading: rules')
		await rulesIndex.saveObjects(formatRulesToAlgolia(rules)).wait()

		console.log('Clearing: simulateurs')
		await simulateursIndex.clearObjects().wait()
		console.log('Configure index: simulateurs')
		await simulateursIndex
			.setSettings({
				minWordSizefor1Typo: 4,
				minWordSizefor2Typos: 8,
				hitsPerPage: 20,
				maxValuesPerFacet: 100,
				attributesToIndex: ['unordered(title)'],
				numericAttributesToIndex: null,
				attributesToRetrieve: null,
				unretrievableAttributes: null,
				optionalWords: null,
				attributesForFaceting: null,
				attributesToSnippet: null,
				attributesToHighlight: ['title'],
				paginationLimitedTo: 1000,
				attributeForDistinct: null,
				exactOnSingleWordQuery: 'attribute',
				ranking: [
					'typo',
					'geo',
					'words',
					'filters',
					'proximity',
					'attribute',
					'exact',
					'custom',
				],
				customRanking: null,
				separatorsToIndex: '',
				removeWordsIfNoResults: 'none',
				queryType: 'prefixLast',
				highlightPreTag: '<em>',
				highlightPostTag: '</em>',
				snippetEllipsisText: '',
				alternativesAsExact: ['ignorePlurals', 'singleWordSynonym'],
			})
			.wait()
		console.log('Updloading: simulateurs')
		await simulateursIndex
			.saveObjects(formatSimulationDataToAlgolia(getSimulationData()))
			.wait()

		console.log('Algolia update DONE')
	} catch (e) {
		console.log(e)
	}
})()

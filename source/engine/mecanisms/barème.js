import { val } from 'Engine/traverse-common-functions'
import { decompose } from 'Engine/mecanisms/utils'
import { mecanismVariations } from 'Engine/mecanisms'
import { has, evolve, sum } from 'ramda'
import { defaultNode, rewriteNode, E } from 'Engine/evaluation'

import Barème from 'Engine/mecanismViews/Barème'

export let desugarScale = recurse => tranches =>
	tranches
		.map(t =>
			has('en-dessous de')(t)
				? { ...t, de: 0, à: t['en-dessous de'] }
				: has('au-dessus de')(t)
				? { ...t, de: t['au-dessus de'], à: Infinity }
				: t
		)
		.map(evolve({ taux: recurse }))

export let trancheValue = barèmeType => (assiette, multiplicateur) =>
	barèmeType === 'marginal'
		? ({ de: min, à: max, taux }) =>
				val(assiette) < min * val(multiplicateur)
					? 0
					: (Math.min(val(assiette), max * val(multiplicateur)) -
							min * val(multiplicateur)) *
					  val(taux)
		: ({ de: min, à: max, taux, montant }) =>
				Math.round(val(assiette)) >= min &&
				(!max || Math.round(val(assiette)) <= max)
					? taux != null
						? val(assiette) * val(taux)
						: montant
					: 0

export default (recurse, k, v) => {
	// Barème en taux marginaux.

	if (v.composantes) {
		//mécanisme de composantes. Voir known-mecanisms.md/composantes
		return decompose(recurse, k, v)
	}
	if (v.variations) {
		return mecanismVariations(recurse, k, v, true)
	}

	let { assiette, multiplicateur } = v,
		tranches = desugarScale(recurse)(v['tranches'])

	let explanation = {
		assiette: recurse(assiette),
		multiplicateur: multiplicateur ? recurse(multiplicateur) : defaultNode(1),
		tranches
	}

	let evaluate = (cache, situationGate, parsedRules, node) => {
		let e = E(cache, situationGate, parsedRules)

		let { assiette, multiplicateur } = node.explanation,
			trancheValues = node.explanation.tranches.map(
				({ de: min, à: max, taux }) =>
					e.val(assiette) < min * e.val(multiplicateur)
						? 0
						: (Math.min(e.val(assiette), max * e.val(multiplicateur)) -
								min * e.val(multiplicateur)) *
						  e.val(taux)
			),
			nodeValue = sum(trancheValues)

		return rewriteNode(node, nodeValue, explanation, e.missingVariables())
	}

	return {
		explanation,
		evaluate,
		jsx: Barème('marginal'),
		category: 'mecanism',
		name: 'barème',
		barème: 'marginal'
	}
}

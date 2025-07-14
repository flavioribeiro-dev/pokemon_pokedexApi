const getTypeColor = type => {
	const normal = '#F5F5F5'
	return {
		normal,
		fire: '#FDDFDF',
		grass: '#DEFDE0',
		electric: '#FCF7DE',
		ice: '#DEF3FD',
		water: '#DEF3FD',
		ground: '#F4E7DA',
		rock: '#D5D5D4',
		fairy: '#FCEAFF',
		poison: '#98D7A5',
		bug: '#F8D5A3',
		ghost: '#CAC0F7',
		dragon: '#97B3E6',
		psychic: '#EAEDA1',
		fighting: '#E6E0D4'
	}[type] || normal
}

// ======================================

const getOnlyFulfilled = async ({ arr, func }) => {
	const promise = await arr.map(func)
	const response = await Promise.allSettled(promise);
	return response.filter(item => item.status === 'fulfilled');
}

const getPokemonsTypes = async (pokeApiResults) => {
	const fulfilled = await getOnlyFulfilled({ arr: pokeApiResults, func: item => fetch(item.url) });
	const value = fulfilled.map(item => item.value.json());
	const pokemon = await Promise.all(value);
	return pokemon.map(item => item.types.map(item => DOMPurify.sanitize(item.type.name	)));
}

const getPokemonsIds = (pokeApiResults) => pokeApiResults.map( ({url}) => {
	const urlAsArray = DOMPurify.sanitize(url).split("/");
	return urlAsArray.at(urlAsArray.length - 2);
} );

const getPokemonsImages = async (ids) => {
	const fulfilled = await getOnlyFulfilled({ arr: ids, func: item => fetch(`assets/img/${item}.png`) })


	
	return fulfilled.map(item => DOMPurify.sanitize(item.value.url))
}


const paginationInfo = (() => {
	const limit = 15;
	let offset = 0;

	const getLimit = () => limit;
	const getOffset = () => offset;
	const incrementOffset = () => offset += limit;

	return { getLimit, getOffset, incrementOffset }
})()

const getPokemons = async () => {
	const { getLimit, getOffset, incrementOffset } = paginationInfo;
	const pokeApi = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${ getLimit() }&offset=${ getOffset() }`);
	if(!pokeApi.ok) {
		return
	}
	const { results: pokeApiResults } = await pokeApi.json();

	const types = await getPokemonsTypes(pokeApiResults);
	const ids = getPokemonsIds(pokeApiResults);
	const images = await getPokemonsImages(ids);

	incrementOffset();
	const pokemons = ids.map((id, i) => ({ id, name: pokeApiResults[i].name, type: types[i], urlImage: images[i] }))
	return pokemons;
}

const renderPokemons = (pokemons) => {
	const ul = document.querySelector('[data-js="pokemons-list"]');
	const fragment = document.createDocumentFragment();

	pokemons.forEach(({ id, name, type, urlImage }) => {
		const li = document.createElement('li');
		const nameContext = document.createElement('h2');
		const typeContext = document.createElement('p');
		const image = document.createElement('img');
		const [firstType] = type;

		image.setAttribute('src', urlImage);
		image.setAttribute('alt', name);
		image.setAttribute('class', 'card-image')

		li.append( image, nameContext, typeContext );
		li.setAttribute('class', 'card');

		nameContext.textContent = `${id}. ${name[0].toUpperCase()}${name.slice(1)}`;
		nameContext.setAttribute('class', 'card-title');

		typeContext.textContent = type.length > 1 ? type.join(" || ") : firstType;
		typeContext.setAttribute('class', 'card-subtitle');

		fragment.append(li);
	})
	ul.append(fragment)
}


const observeLastPokemon = (pokemonObserver) => {
	const lastPokemon = document.querySelector('[data-js="pokemons-list"]').lastChild;
	pokemonObserver.observe(lastPokemon)
}

const handleNextPokemonsRender = () => {
	const pokemonObserver = new IntersectionObserver( async ([lastPokemon], observer) => {
		if(!lastPokemon.isIntersecting) {
			return 
		}
		if(( paginationInfo.getOffset() === 150 )) {
			return
		}
		const novos_pokemons = await getPokemons();
		observer.unobserve(lastPokemon.target);
		renderPokemons(novos_pokemons);
		observeLastPokemon(pokemonObserver);
	}, ({ rootMargin: '300px' }) );
	observeLastPokemon(pokemonObserver);	
};


export const loadPokemons = async () => {
	const pokemons = await getPokemons();
	renderPokemons(pokemons);
	handleNextPokemonsRender();
}

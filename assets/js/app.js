import { loadPokemons } from "./modules-js/load-pokemons.js"


const handlePageLoaded = async () => {
	await loadPokemons();
};

window.onload = handlePageLoaded();

import { el, empty } from './helpers.js';
import { fetchNews } from './news.js';

/**
 * Föll sem sjá um að kalla í `fetchNews` og birta viðmót:
 * - Loading state meðan gögn eru sótt
 * - Villu state ef villa kemur upp við að sækja gögn
 * - Birta gögnin ef allt OK
 * Fyrir gögnin eru líka búnir til takkar sem leyfa að fara milli forsíðu og
 * flokks *án þess* að nota sjálfgefna <a href> virkni—við tökum yfir og sjáum
 * um sjálf með History API.
 */

/**
 * Sér um smell á flokk og birtir flokkinn *á sömu síðu* og við erum á.
 * Þarf að:
 * - Stoppa sjálfgefna hegðun <a href>
 * - Tæma `container` þ.a. ekki sé verið að setja efni ofan í annað efni
 * - Útbúa link sem fer til baka frá flokk á forsíðu, þess vegna þarf `newsItemLimit`
 * - Sækja og birta flokk
 * - Bæta við færslu í `history` þ.a. back takki virki
 *
 * Notum lokun þ.a. við getum útbúið föll fyrir alla flokka með einu falli. Notkun:
 * ```
 * link.addEventListener('click', handleCategoryClick(categoryId, container, newsItemLimit));
 * ```
 *
 * @param {string} id ID á flokk sem birta á eftir að smellt er
 * @param {HTMLElement} container Element sem á að birta fréttirnar í
 * @param {number} newsItemLimit Hámark frétta sem á að birta
 * @returns {function} Fall sem bundið er við click event á link/takka
 */
function handleCategoryClick(id, container, newsItemLimit) {
  return (e) => {
    e.preventDefault();

    window.history.replaceState(null, null, '?category=' + id);
    empty(container);

    fetchAndRenderCategory(
      id,
      container,
      createCategoryBackLink(container, newsItemLimit),
      20,
      true
    );

  }; // TODO útfæra
}

/**
 * Eins og `handleCategoryClick`, nema býr til link sem fer á forsíðu.
 *
 * @param {HTMLElement} container Element sem á að birta fréttirnar í
 * @param {number} newsItemLimit Hámark frétta sem á að birta
 * @returns {function} Fall sem bundið er við click event á link/takka
 */
function handleBackClick(container, newsItemLimit) {
  return (e) => {
    e.preventDefault();
    window.history.replaceState(null, null, '/');
    empty(container);
    fetchAndRenderLists(container, newsItemLimit);

    // TODO útfæra
  };
}

/**
 * Útbýr takka sem fer á forsíðu.
 * @param {HTMLElement} container Element sem á að birta fréttirnar í
 * @param {number} newsItemLimit Hámark frétta sem á að birta
 * @returns {HTMLElement} Element með takka sem fer á forsíðu
 */
export function createCategoryBackLink(container, newsItemLimit) {
  const a = el('a', 'Til baka');
  a.classList.add('news__link');
  a.setAttribute('href','/');
  a.addEventListener(
    'click',
    handleBackClick(container,newsItemLimit)
    );
  
  return a;
  // TODO útfæra

}

/**
 * Sækir grunnlista af fréttum, síðan hvern flokk fyrir sig og birtir nýjustu
 * N fréttir úr þeim flokk með `fetchAndRenderCategory()`
 * @param {HTMLElement} container Element sem mun innihalda allar fréttir
 * @param {number} newsItemLimit Hámark fjöldi frétta sem á að birta í yfirliti
 */
export async function fetchAndRenderLists(container, newsItemLimit) {
  // Byrjum á að birta loading skilaboð
  const loadingElement = el('p', 'Sæki gögn...');

  // Birtum þau beint á container

  container.appendChild(loadingElement);

  // Sækjum yfirlit með öllum flokkum, hér þarf að hugsa um Promises!
  const newsIndex = await fetchNews();

  // Fjarlægjum loading skilaboð
  container.removeChild(loadingElement);

  // Athugum hvort villa hafi komið upp => fetchNews skilaði null

  if (newsIndex === null) {
    const Villuskilaboð = el('p', 'Villa kom upp');
    container.appendChild(Villuskilaboð);
    return;
  }

  // Athugum hvort engir fréttaflokkar => fetchNews skilaði tómu fylki

  if (newsIndex.length === 0) {
    const Villuskilaboð = el('p', 'Engir fréttaflokkar');
    container.appendChild(Villuskilaboð);
    return;
  }

  // Búum til <section> sem heldur utan um allt

  const Frettir = el('div');
  Frettir.classList.add('newsList__list');
  const kassi = el('section', Frettir);
  kassi.classList.add('news__list');
  container.appendChild(kassi);

  // Höfum ekki-tómt fylki af fréttaflokkum! Ítrum í gegn og birtum
  // Þegar það er smellt á flokka link, þá sjáum við um að birta fréttirnar, ekki default virknin

  for (let i = 0; i < newsIndex.length; i++) {
    const element = newsIndex[i];
    const div = el('div');
    div.classList.add('newsList__item');
    Frettir.appendChild(div);
    const takki = el('a', 'Allar fréttir');
    takki.classList.add('news__link');
    takki.setAttribute('href', '/?category=' + element.id);
    takki.addEventListener(
      'click', 
      handleCategoryClick(element.id,container,newsItemLimit));
    fetchAndRenderCategory(element.id, div, takki, newsItemLimit);
  }
}

/**
 * Sækir gögn fyrir flokk og birtir í DOM.
 * @param {string} id ID á category sem við erum að sækja
 * @param {HTMLElement} parent Element sem setja á flokkinn í
 * @param {HTMLELement | null} [link=null] Linkur sem á að setja eftir fréttum
 * @param {number} [limit=Infinity] Hámarks fjöldi frétta til að sýna
 */
export async function fetchAndRenderCategory(
  id,
  parent,
  link = null,
  limit = Infinity
) {
  
  // Búum til <section> sem heldur utan um flokkinn
  const flokkur = el('section');
  flokkur.classList.add('news');
  // Bætum við parent og þannig DOM, allar breytingar héðan í frá fara gegnum
  // container sem er tengt parent
  parent.appendChild(flokkur);


  // Setjum inn loading skilaboð fyrir flokkinn
  const loadingElement = el('p', 'Sæki gögn...');
  flokkur.appendChild(loadingElement);

  // Sækjum gögn fyrir flokkinn og bíðum
  const newsIndex = await fetchNews(id);
  console.log(newsIndex);

  // Fjarlægjum loading skilaboð
  flokkur.removeChild(loadingElement);

  // Ef það er linkur, bæta honum við
  if (link) {
    const div = el('div', link)
    div.classList.add('news__links')
    flokkur.appendChild(div);
  }
  // Villuskilaboð ef villa og hættum
  if (newsIndex === null) {
    const Villuskilaboð = el('p', 'Villa kom upp');
    flokkur.appendChild(Villuskilaboð);
    return;
  }
  // Skilaboð ef engar fréttir og hættum
  if (newsIndex.items.length === 0) {
    const Villuskilaboð = el('p', 'Engar fréttir');
    flokkur.appendChild(Villuskilaboð);
    return;
  }
  // Bætum við titli
  const titill = el('h2', newsIndex.title);
  titill.classList.add('news__title');
  flokkur.appendChild(titill);

  // Höfum fréttir! Ítrum og bætum við <ul>
  const linkur = el('ul');
  linkur.classList.add('news__list')
  flokkur.appendChild(linkur);

  for (let i = 0; i < newsIndex.items.length && i < limit; i++) {
    const element = newsIndex.items[i];
    const linkarlisti = el('a', element.title);
    linkarlisti.setAttribute('href', element.link);
    const listi = el('li', linkarlisti);
    listi.classList.add('news__item')
    linkur.appendChild(listi);
  }
}
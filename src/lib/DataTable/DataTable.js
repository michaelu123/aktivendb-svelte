// MUH: this code copied from @brainandbones/skeleton
// Data Table Utilities
// A set of utility features for local template-driven data tables.
import { get } from 'svelte/store';
// Exports
export * from './types';
export * from './actions';
// Data Table Handler
/** Listens for changes to `$dataTableModel` and triggers: search, selection, sort, and pagination. */
export function dataTableHandler(store) {
	// Reset
	store.filtered = store.source;
	// Then
	searchHandler(store);
	selectionHandler(store);
	sortHandler(store);
	paginationHandler(store);
}
// Utilities ---
/** A utility method for updating a select store value. */
export function dataTableStorePut(store, key, value) {
	let newStore = get(store);
	newStore = { ...newStore, [key]: value };
	store.set(newStore);
}
// Search ---
function searchHandler(store) {
	//MUH
	// const formattedSearchTerm = store.search?.toLowerCase() || '';
	// store.filtered = store.source.filter((rowObj) => {
	//     return Object.values(rowObj).join(' ').toLowerCase().includes(formattedSearchTerm);
	// });
	store.filtered = store.filter(store);
}
// Selection ---
function selectionHandler(store) {
	store.selection = store.filtered.filter((row) => row.dataTableChecked === true);
}
/** Allows you to dynamically pre-select rows on-demand. */
export function dataTableSelect(store, key, valuesArr) {
	get(store).filtered.map((row) => {
		if (valuesArr.includes(row[key])) row.dataTableChecked = true;
		return row;
	});
}
/** Triggered by the "select all" checkbox to toggle all row selection. */
export function dataTableSelectAll(event, store) {
	//MUH
	const isAllChecked = event.target.checked;
	const storeFiltered = get(store).filtered.forEach((row) => (row.dataTableChecked = isAllChecked));
	dataTableStorePut(store, 'filtered', storeFiltered);
}
// Sort ---
const sortState = { lastKey: '', asc: true };
/** Listens for clicks to a table heading with `data-sort` attribute. Updates `$dataTableModel.sort`. */
export function dataTableSort(event, store) {
	if (!(event.target instanceof Element)) return;
	const newSortKey = event.target.getAttribute('data-sort');
	// If same key used repeated, toggle asc/dsc order
	if (newSortKey !== '' && newSortKey === sortState.lastKey) sortState.asc = !sortState.asc;
	// Cache the last key used
	sortState.lastKey = newSortKey;
	// Update store
	if (newSortKey) dataTableStorePut(store, 'sort', newSortKey);
}
function sortHandler(store) {
	if (!store.sort) return;
	// Sort order based on current sortState.asc value
	sortState.asc ? sortOrder('asc', store) : sortOrder('dsc', store);
}
function sortOrder(order, store) {
	const key = store.sort;
	store.filtered.sort((x, y) => {
		// If descending, swap x/y
		if (order === 'dsc') [x, y] = [y, x];
		// Sort logic
		if (typeof x[key] === 'string' && typeof y[key] === 'string') {
			return String(x[key]).localeCompare(String(y[key]));
		} else {
			return x[key] - y[key];
		}
	});
}
// Pagination ---
function paginationHandler(store) {
	//MUH
	// store.sort = ''; // reset
	if (store.pagination) {
		// Set Current Size
		store.pagination.size = store.filtered.length;
		if (store.pagination.page * store.pagination.limit > store.pagination.size) {
			store.pagination.page = 0;
		}
		// Slice for Pagination
		store.filtered = store.filtered.slice(
			store.pagination.page * store.pagination.limit, // start
			store.pagination.page * store.pagination.limit + store.pagination.limit // end
		);
	}
}

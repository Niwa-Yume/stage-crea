import { writable } from 'svelte/store';
import internshipsData from '../../data/internships.json';

export const internships = writable(internshipsData);

import { Production } from '../types';

export const productions: Production[] = [
  { id: 'prod-1', title: 'John Wick: Chapter 4', year: 2023, studio: 'Lionsgate', budgetTier: 'tentpole' },
  { id: 'prod-2', title: 'Mission: Impossible - Dead Reckoning', year: 2023, studio: 'Paramount', budgetTier: 'tentpole' },
  { id: 'prod-3', title: 'The Fall Guy', year: 2024, studio: 'Universal', budgetTier: 'tentpole' },
  { id: 'prod-4', title: 'Extraction 2', year: 2023, studio: 'Netflix', budgetTier: 'tentpole' },
  { id: 'prod-5', title: 'Mad Max: Fury Road', year: 2015, studio: 'Warner Bros.', budgetTier: 'tentpole' },
  { id: 'prod-6', title: 'Top Gun: Maverick', year: 2022, studio: 'Paramount', budgetTier: 'tentpole' },
  { id: 'prod-7', title: 'Atomic Blonde', year: 2017, studio: 'Focus Features', budgetTier: 'mid' },
  { id: 'prod-8', title: 'Avatar: The Way of Water', year: 2022, studio: '20th Century', budgetTier: 'tentpole' },
  { id: 'prod-9', title: 'Bullet Train', year: 2022, studio: 'Sony', budgetTier: 'tentpole' },
  { id: 'prod-10', title: 'Nobody', year: 2021, studio: 'Universal', budgetTier: 'mid' },
  { id: 'prod-11', title: 'The Matrix Resurrections', year: 2021, studio: 'Warner Bros.', budgetTier: 'tentpole' },
  { id: 'prod-12', title: 'Fast X', year: 2023, studio: 'Universal', budgetTier: 'tentpole' },
  { id: 'prod-13', title: 'Deadpool & Wolverine', year: 2024, studio: 'Marvel/Disney', budgetTier: 'tentpole' },
  { id: 'prod-14', title: 'Kill Bill: Volume 1', year: 2003, studio: 'Miramax', budgetTier: 'mid' },
  { id: 'prod-15', title: 'The Raid', year: 2011, studio: 'Sony Pictures Classics', budgetTier: 'indie' },
  { id: 'prod-16', title: 'Fast Five', year: 2011, studio: 'Universal', budgetTier: 'tentpole' },
];

export const productionMap = new Map(productions.map(p => [p.id, p]));

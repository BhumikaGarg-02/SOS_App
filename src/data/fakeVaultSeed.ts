export interface DecoyNote {
  id: string;
  folder: 'shopping' | 'recipes' | 'study' | 'bills';
  title: string;
  body: string;
  updatedAt: string;
}

export const fakeVaultSeed: DecoyNote[] = [
  {
    id: 'note-1',
    folder: 'shopping',
    title: 'Saturday sabzi list',
    body: 'Aloo 2kg, Tamatar 1kg, Palak 2 gaddi, Adrak 100g, Hari mirch 50g, Dhaniya, Nimbu 4 pcs. Don’t forget to check if fresh peas are available.',
    updatedAt: '2026-11-14T09:30:00Z',
  },
  {
    id: 'note-2',
    folder: 'shopping',
    title: 'Monthly grocery refill',
    body: 'Atta 10kg (Aashirvaad), Basmati Rice 5kg, Toor dal 2kg, Moong dal 1kg, Mustard oil 2L, Tata salt 1 packet, Haldi & Jeera refill.',
    updatedAt: '2026-11-10T14:15:00Z',
  },
  {
    id: 'note-3',
    folder: 'recipes',
    title: 'Dal tadka recipe',
    body: 'Boil toor & chana dal with haldi and salt. For tadka: ghee, jeera, chopped garlic, ginger, hing, dry red chilli, tomatoes, and kasuri methi at the end.',
    updatedAt: '2026-11-05T19:40:00Z',
  },
  {
    id: 'note-4',
    folder: 'recipes',
    title: 'Chai masala mix',
    body: 'Green cardamom 50g, Clove 20g, Cinnamon sticks 30g, Black pepper 15g, Dry ginger (saunth) powder 20g. Light roast and grind coarse.',
    updatedAt: '2026-10-28T11:00:00Z',
  },
  {
    id: 'note-5',
    folder: 'recipes',
    title: 'Sooji Halwa ratio',
    body: '1:1:1:3 ratio. 1 cup sooji, 1 cup desi ghee, 1 cup sugar, 3 cups boiling water/milk with crushed cardamom and saffron strands.',
    updatedAt: '2026-10-15T16:20:00Z',
  },
  {
    id: 'note-6',
    folder: 'study',
    title: 'Physics unit 3 summary',
    body: 'Thermodynamics: First law delta U = Q - W. Carnot engine efficiency eta = 1 - (Tc/Th). Entropy changes in reversible vs irreversible processes. Review solved examples 3.4 to 3.9.',
    updatedAt: '2026-11-12T18:05:00Z',
  },
  {
    id: 'note-7',
    folder: 'study',
    title: 'DBMS normalization notes',
    body: '1NF: Atomic values. 2NF: No partial dependency on candidate key. 3NF: No transitive dependency. BCNF: For every X -> Y, X must be a super key.',
    updatedAt: '2026-11-08T20:10:00Z',
  },
  {
    id: 'note-8',
    folder: 'study',
    title: 'Lab viva questions list',
    body: 'Prepare circuit diagram for CE amplifier, frequency response characteristics, difference between BJT and FET, and pinch-off voltage definition.',
    updatedAt: '2026-11-02T13:45:00Z',
  },
  {
    id: 'note-9',
    folder: 'bills',
    title: 'Electricity bill October',
    body: 'Consumer No: 4920194819. Due date: 22nd Nov. Amount paid: ₹1,420 via UPI transaction ref #93810482910.',
    updatedAt: '2026-11-01T10:12:00Z',
  },
  {
    id: 'note-10',
    folder: 'bills',
    title: 'Broadband recharge slip',
    body: 'Plan: Fiber 100Mbps unlimited. Paid ₹825 on 5th Nov. Next renewal on 5th Dec.',
    updatedAt: '2026-11-05T08:50:00Z',
  },
];

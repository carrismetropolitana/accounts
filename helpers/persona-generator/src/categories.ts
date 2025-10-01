/* * */

export interface CategoryItem {
	_id: string
	forbidden_combinations?: { category_id?: string, item_id?: string }[]
	images: {
		filename: string
		order: number
	}[]
}

export interface Category {
	_id: string
	allow_empty: boolean
	items: CategoryItem[]
}

export interface Outfit {
	category_id: string
	item?: CategoryItem
}

/* * */

export const categories: Category[] = [
	{
		_id: 'base',
		allow_empty: false,
		items: [
			{
				_id: 'default',
				images: [{ filename: 'default.png', order: 1 }],
			},
		],
	},
	{
		_id: 'ears',
		allow_empty: false,
		items: [
			{
				_id: 'default',
				images: [{ filename: 'default.png', order: 2 }],
			},
			// {
			// 	_id: 'earing',
			// 	images: [{ filename: 'earing.png', order: 2 }],
			// },
			// {
			// 	_id: 'ring-md',
			// 	images: [{ filename: 'ring-md.png', order: 2 }],
			// },
			{
				_id: 'ring-xl',
				images: [{ filename: 'ring-xl.png', order: 2 }],
			},
			// {
			// 	_id: 'plug-md',
			// 	images: [{ filename: 'plug-md.png', order: 2 }],
			// },
			{
				_id: 'plug-xl',
				images: [{ filename: 'plug-xl.png', order: 2 }],
			},
		],
	},
	{
		_id: 'tattoos',
		allow_empty: true,
		items: [
			{
				_id: 'chest',
				images: [{ filename: 'chest.png', order: 3 }],
			},
		],
	},
	{
		_id: 'clothes',
		allow_empty: false,
		items: [
			{
				_id: 'sleeveless',
				images: [{ filename: 'sleeveless.png', order: 4 }],
			},
			{
				_id: 'pearls',
				forbidden_combinations: [
					{ category_id: 'beards' },
					{ category_id: 'tattoos' },
					{ category_id: 'hairs', item_id: 'crista' },
					{ category_id: 'hairs', item_id: 'rapado' },
					{ category_id: 'hairs', item_id: 'mullet' },
					{ category_id: 'hairs', item_id: 'careca' },
					{ category_id: 'ears', item_id: 'plug-xl' },
					{ category_id: 'ears', item_id: 'ring-xl' },
					{ category_id: 'accessories', item_id: 'nose-piercing' },
					{ category_id: 'accessories', item_id: 'septum-piercing' },
				],
				images: [{ filename: 'pearls.png', order: 4 }],
			},
			{
				_id: 'purple',
				forbidden_combinations: [
					{ category_id: 'tattoos' },
					{ category_id: 'hairs', item_id: 'afro' },
					{ category_id: 'hairs', item_id: 'bob' },
					{ category_id: 'hairs', item_id: 'daenerys' },
					{ category_id: 'hairs', item_id: 'liso' },
					{ category_id: 'accessories', item_id: 'glasses' },
				],
				images: [{ filename: 'purple.png', order: 4 }],
			},
			{
				_id: 'blue', forbidden_combinations: [
					{ category_id: 'tattoos' },
					{ category_id: 'hairs', item_id: 'mullet' },
					{ category_id: 'hairs', item_id: 'rapado' },
					{ category_id: 'hairs', item_id: 'crista' },
					{ category_id: 'hairs', item_id: 'buzzcut' },
					{ category_id: 'accessories', item_id: 'nose-piercing' },
					{ category_id: 'accessories', item_id: 'septum-piercing' },
				],
				images: [{ filename: 'blue.png', order: 4 }],
			},
			{
				_id: 'blue-top',
				forbidden_combinations: [
					{ category_id: 'beards' },
				],
				images: [{ filename: 'blue-top.png', order: 4 }],
			},
			{
				_id: 'yellow',
				forbidden_combinations: [
					{ category_id: 'tattoos' },
				],
				images: [{ filename: 'yellow.png', order: 4 }],
			},
		],
	},
	{
		_id: 'hairs',
		allow_empty: false,
		items: [
			{
				_id: 'afro',
				forbidden_combinations: [
					{ category_id: 'ears' },
					{ category_id: 'beards', item_id: 'long' },
				],
				images: [{ filename: 'afro-background.png', order: 0 }, { filename: 'mini-afro.png', order: 5 }],
			},
			// {
			// 	_id: 'mini-afro',
			// 	forbidden_combinations: [
			// 		{ category_id: 'ears' },
			// 		{ category_id: 'beards', item_id: 'long' },
			// 	],
			// 	images: [{ filename: 'mini-afro.png', order: 5 }],
			// },
			{
				_id: 'mullet',
				forbidden_combinations: [
					{ category_id: 'beards', item_id: 'long' },
				],
				images: [{ filename: 'mullet.png', order: 5 }],
			},
			{
				_id: 'popa',
				forbidden_combinations: [
					{ category_id: 'ears', item_id: 'plug-xl' },
					{ category_id: 'ears', item_id: 'ring-xl' },
				],
				images: [{ filename: 'popa.png', order: 5 }],
			},
			{
				_id: 'bob',
				forbidden_combinations: [
					{ category_id: 'beards' },
					{ category_id: 'ears', item_id: 'plug-xl' },
					{ category_id: 'ears', item_id: 'ring-xl' },
					{ category_id: 'clothes', item_id: 'sleeveless' },
					{ category_id: 'accessories', item_id: 'nose-piercing' },
				],
				images: [{ filename: 'bob.png', order: 5 }],
			},
			{
				_id: 'crista',
				images: [{ filename: 'crista.png', order: 5 }],
			},
			{
				_id: 'liso',
				forbidden_combinations: [
					{ category_id: 'beards' },
					{ category_id: 'ears', item_id: 'ring-xl' },
					{ category_id: 'ears', item_id: 'plug-xl' },
				],
				images: [{ filename: 'liso.png', order: 5 }],
			},
			// {
			// 	_id: 'careca',
			// 	images: [{ filename: 'careca.png', order: 5 }],
			// },
			{
				_id: 'rapado',
				images: [{ filename: 'rapado.png', order: 5 }],
			},
			// {
			// 	_id: 'curly',
			// 	forbidden_combinations: [
			// 		{ category_id: 'ears', item_id: 'ring-md' },
			// 		{ category_id: 'ears', item_id: 'ring-xl' },
			// 		{ category_id: 'beards', item_id: 'comprida' },
			// 		{ category_id: 'clothes', item_id: 'sleeveless' },
			// 	],
			// 	images: [{ filename: 'curly.png', order: 5 }],
			// },
			{
				_id: 'buzzcut',
				images: [{ filename: 'buzzcut.png', order: 5 }],
			},
			{
				_id: 'daenerys',
				forbidden_combinations: [
					{ category_id: 'beards' },
					{ category_id: 'clothes', item_id: 'sleeveless' },
					{ category_id: 'ears', item_id: 'ring-xl' },
				],
				images: [{ filename: 'daenerys.png', order: 5 }],
			},
		],
	},

	{
		_id: 'beards',
		allow_empty: true,
		items: [
			{
				_id: 'unshaved',
				images: [{ filename: 'unshaved.png', order: 6 }],
			},
			{
				_id: 'long',
				forbidden_combinations: [
					{ category_id: 'ears', item_id: 'ring-md' },
					{ category_id: 'ears', item_id: 'ring-xl' },
				],
				images: [{ filename: 'long.png', order: 6 }],
			},
			{
				_id: 'moustache',
				images: [{ filename: 'moustache.png', order: 6 }],
			},
			// {
			// 	_id: 'pera',
			// 	images: [{ filename: 'pera.png', order: 6 }],
			// },
		],
	},
	{
		_id: 'accessories',
		allow_empty: true,
		items: [
			{
				_id: 'nose-piercing',
				images: [{ filename: 'nose-piercing.png', order: 7 }, { filename: 'eyebrow-piercing.png', order: 7 }],
			},
			{
				_id: 'septum-piercing',
				images: [{ filename: 'septum-piercing.png', order: 7 }],
			},
			{
				_id: 'glasses',
				images: [{ filename: 'glasses.png', order: 7 }],
			},
			// {
			// 	_id: 'lip-piercing',
			// 	images: [{ filename: 'lip-piercing.png', order: 7 }],
			// },
		],
	},
];

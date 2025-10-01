export const categories = [
    {
        _id: "Base",
        items: [
            {
                _id: "base-1",
                images: [
                    { filename: "base.png", order: 1 },
                ],
            }
        ]
    },
    {
        _id: "Orelhas",
        items: [
            {
                _id: "normal",
                images: [
                    { filename: "1_Normal.png", order: 2 },
                ],
            },
            {
                _id: "c_brinco",
                images: [
                    { filename: "2_C_Brinco.png", order: 2 },
                ],
            },
            {
                _id: "c_argola",
                images: [
                    { filename: "3_C_Argola.png", order: 2 },
                ],
            },
            {
                _id: "c_argola_xl",
                images: [
                    { filename: "4_C_Argola_XL.png", order: 2 },
                ],
            },
            {
                _id: "alargador_s",
                images: [
                    { filename: "5_Alargador_S.png", order: 2 },
                ],
            },
            {
                _id: "alargador_xl",
                images: [
                    { filename: "6_Alargado_XL.png", order: 2 },
                ],
            }
        ]
    },
    {
        _id: "Tattoos",
        items: [
            {
                _id: "tattoo_1",
                images: [
                    { filename: "Tattoo_1.png", order: 3 },
                ],
            },
            {
                _id: "tattoo_0",
                images: [
                    { filename: "Tattoo_0.png", order: 3 },
                ],
            }
        ]
    },
    {
        _id: "Roupa",
        items: [
            {
                _id: "manga_cava",
                images: [
                    { filename: "1_Mangas_Cavas.png", order: 4 },
                ],
            },
            {
                _id: "perolas",
                images: [
                    { filename: "2_Pérolas.png", order: 4 },
                ],
				forbidden_combinations: [
					{ _id: "TODAS AS BARBAS" },
					{ _id: "TODAS AS TATTOOS" },
					{ _id: "CABELO 4_Crista" },
					{ _id: "CABELO rapado" },
					{ _id: "CABELO 1_Mullet" },
					{ _id: "CABELO careca" },
				]
            },
            {
                _id: "camisa_roxa",
                images: [
                    { filename: "3_Camisa_Roxa.png", order: 4 },
                ],
            },
            {
                _id: "camisa_azul",
                images: [
                    { filename: "4_Camisa Azul.png", order: 4 },
                ],
            },
            {
                _id: "top_azul_mar",
                images: [
                    { filename: "5_Top_Azul_Mar.png", order: 4 },
                ],
				forbidden_combinations: [
					{ _id: "TODAS AS BARBAS" }
				]
            },
            {
                _id: "sweatshirt_amarela",
                images: [
                    { filename: "6_Sweatshirt_Amarela.png", order: 4 },
                ],
            },
        ]
    },
    {
        _id: "Cabelo",
        items: [
            {
                _id: "afro",
                images: [
                    { filename: "12_Afro_Back.png", order: 0 },
                    { filename: "5_Mini_Afro.png", order: 5 },
                ],
				forbidden_combinations: [
					{ _id: "TODAS AS ORELHAS" },
					{ _id: "BARBA comprida" }
				]
            },
            {
                _id: "mullet",
                images: [
                    { filename: "1_Mullet.png", order: 5 },
                ],
            },
            {
                _id: "popa",
                images: [
                    { filename: "2_Popa.png", order: 5 },
                ],
            },
            {
                _id: "bob",
                images: [
                    { filename: "3_Bob.png", order: 5 },
                ],
				forbidden_combinations: [
					{ _id: "TODAS AS BARBAS" },
					{ _id: "MANGA CAVA" }
				]
            },
            {
                _id: "crista",
                images: [
                    { filename: "4_Crista.png", order: 5 },
                ],
            },
            {
                _id: "mini-afro",
                images: [
                    { filename: "2_Popa.png", order: 5 },
                ],
				forbidden_combinations: [
					{ _id: "TODAS AS ORELHAS" },
					{ _id: "BARBA comprida" }
				]
            },
            {
                _id: "liso",
                images: [
                    { filename: "6_Liso.png", order: 5 },
                ],
				forbidden_combinations: [
					{ _id: "ORELHA 3_C_Argola" },
					{ _id: "ORELHA 4_C_Argola_XL" }
				]
            },
            {
                _id: "careca",
                images: [
                    { filename: "7_Careca.png", order: 5},
                ],
            },
            {
                _id: "rapado",
                images: [
                    { filename: "8_Rapado.png", order: 5 },
                ],
            },
            {
                _id: "encaraculado",
                images: [
                    { filename: "9_Encaraculado.png", order: 5 },
                ],
				forbidden_combinations: [
					{ _id: "ORELHA 3_C_Argola" },
					{ _id: "ORELHA 4_C_Argola_XL" },
					{ _id: "BARBA 2_Comprida" },
					{ _id: "MANGA CAVA" }
				]
            },
            {
                _id: "buzzcut",
                images: [
                    { filename: "10_Buzzcut.png", order: 5 },
                ],
            },
            {
                _id: "daenerys",
                images: [
                    { filename: "11_Daenerys.png", order: 5 },
                ],
				forbidden_combinations: [
					{ _id: "TODAS AS BARBAS" },
					{ _id: "MANGA CAVA" }
				]
            }
        ]
    },

    {
        _id: "Barbas",
        items: [
            {
                _id: "sem_barba",
                images: [
                    { filename: "0_Sem_Barba.png", order: 6},
                ],
            },
            {
                _id: "por_fazer",
                images: [
                    { filename: "1_Por_fazer.png", order: 6},
                ],
            },
            {
                _id: "comprida",
                images: [
                    { filename: "2_Comprida.png", order: 6 },
                ],
				forbidden_combinations: [
					{ _id: "ORELHA 3_C_Argola" },
					{ _id: "ORELHA 4_C_Argola_XL" }
				]
            },
            {
                _id: "p_fazer_bigode",
                images: [
                    { filename: "3_P_Fazer_Bigode.png", order: 6 },
                ],
            },
            {
                _id: "pera",
                images: [
                    { filename: "4_Pêra.png", order: 6 },
                ],
            },
            {
                _id: "bigode",
                images: [
                    { filename: "5_Bigode.png", order: 6 },
                ],
            }
        ]
    },
    {
        _id: "Acessórios",
        items: [
            {
                _id: "piercing_nariz",
                images: [
                    { filename: "1_Piercing_Nariz.png", order: 7 },
                ],
            },
            {
                _id: "piercing_septo",
                images: [
                    { filename: "2_Piercing_ Septo.png", order: 7 },
                ],
            },
            {
                _id: "piercing_sobrancelha",
                images: [
                    { filename: "3_Piercing_Sobrancelha.png", order: 7 },
                ],
            },
            {
                _id: "oculos",
                images: [
                    { filename: "4_Oculos.png", order: 7 },
                ],
            },
            {
                _id: "piercing_labio",
                images: [
                    { filename: "5_Piercing_Labio.png", order: 7 },
                ],
            }
        ]
    },
  ];
  export default categories;
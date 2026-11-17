/**
 * London house price per square metre by postcode district.
 * Source: RealScout (realscout.uk), built from HM Land Registry sold prices matched to EPC floor areas,
 * median of the last 12 months to August 2026. Contains HM Land Registry data © Crown copyright and
 * database right 2026, licensed under the Open Government Licence v3.0.
 * Districts with fewer than 30 matched sales have no figure (null).
 * To refresh: copy the table from https://realscout.uk/property-prices/region/london (rebuilt monthly),
 * or swap this file for a call to that site's dataset (https://realscout.uk/dataset).
 */
export const LONDON_PSM_AS_OF = 'August 2026';
export const LONDON_PSM_SOURCE_URL = 'https://realscout.uk/property-prices/region/london';
/** district -> [median £/m², area name, matched sales] */
export const LONDON_PSM: Record<string, [number | null, string, number]> = {
"BR1": [
5500,
"Sundridge, Bromley",
435
],
"BR2": [
5710,
"Shortlands, Bromley",
466
],
"BR3": [
5940,
"Beckenham",
554
],
"BR4": [
5660,
"West Wickham",
185
],
"BR5": [
5420,
"Petts Wood, Orpington",
359
],
"BR6": [
5780,
"Farnborough, Orpington",
495
],
"BR7": [
6100,
"Chislehurst",
215
],
"CR0": [
4860,
"New Addington, Croydon",
956
],
"CR2": [
5000,
"Selsdon, South Croydon",
469
],
"CR4": [
5430,
"Hackbridge, Mitcham",
269
],
"CR5": [
5210,
"Chipstead, Coulsdon",
286
],
"CR7": [
4800,
"Thornton Heath",
219
],
"CR8": [
5060,
"Purley",
288
],
"DA14": [
5260,
"North Cray, Sidcup",
209
],
"DA15": [
5610,
"Blackfen, Sidcup",
300
],
"DA16": [
5380,
"Welling",
299
],
"DA17": [
4620,
"Belvedere",
140
],
"DA18": [
3360,
"Erith",
52
],
"DA5": [
5390,
"Bexley",
237
],
"DA6": [
5200,
"Bexleyheath",
103
],
"DA7": [
5340,
"Barnehurst, Bexleyheath",
325
],
"DA8": [
4420,
"Northumberland Heath, Erith",
229
],
"E1": [
7370,
"Aldgate",
294
],
"E10": [
6910,
"Leyton",
323
],
"E11": [
7230,
"Leytonstone",
428
],
"E12": [
5360,
"Manor Park",
106
],
"E13": [
5190,
"Plaistow",
147
],
"E14": [
6760,
"Isle of Dogs",
572
],
"E15": [
6090,
"Stratford",
261
],
"E16": [
5830,
"Canning Town",
319
],
"E17": [
7740,
"Walthamstow",
794
],
"E18": [
6600,
"South Woodford",
179
],
"E1W": [
8050,
"London",
138
],
"E2": [
8110,
"Bethnal Green",
277
],
"E20": [
7980,
"Olympic Park",
38
],
"E3": [
6880,
"Mile End",
405
],
"E4": [
5950,
"Chingford",
476
],
"E5": [
8360,
"Lower Clapton",
222
],
"E6": [
5190,
"East Ham",
222
],
"E7": [
6150,
"Forest Gate",
189
],
"E8": [
8860,
"Dalston",
262
],
"E9": [
8140,
"Homerton",
200
],
"EC1A": [
11000,
"London",
40
],
"EC1M": [
10400,
"London",
38
],
"EC1N": [
9430,
"London",
49
],
"EC1R": [
11500,
"London",
82
],
"EC1V": [
9440,
"Islington",
85
],
"EC1Y": [
9730,
"London",
45
],
"EC2A": [
11500,
"Hackney",
38
],
"EC2M": [
null,
"London",
3
],
"EC2R": [
null,
"London",
3
],
"EC2Y": [
11700,
"Barbican",
51
],
"EC3A": [
null,
"London",
1
],
"EC3N": [
null,
"London",
23
],
"EC3R": [
null,
"London",
17
],
"EC4A": [
12900,
"London",
31
],
"EC4M": [
null,
"London",
10
],
"EC4R": [
null,
"London",
3
],
"EC4V": [
10800,
"London",
39
],
"EC4Y": [
null,
"London",
12
],
"EN1": [
5480,
"Enfield",
331
],
"EN2": [
5950,
"The Ridgeway, Enfield",
266
],
"EN3": [
5090,
"Brimsdown, Enfield",
227
],
"EN4": [
6300,
"Cockfosters, Barnet",
187
],
"EN5": [
6540,
"New Barnet, Barnet",
265
],
"HA0": [
6000,
"Alperton, Wembley",
163
],
"HA1": [
5760,
"Harrow",
181
],
"HA2": [
5680,
"North Harrow, Harrow",
235
],
"HA3": [
5760,
"Wealdstone, Harrow",
236
],
"HA4": [
6340,
"South Ruislip, Ruislip",
436
],
"HA5": [
6550,
"Eastcote, Pinner",
306
],
"HA6": [
6050,
"Northwood",
147
],
"HA7": [
6030,
"Stanmore",
212
],
"HA8": [
5670,
"Edgware",
292
],
"HA9": [
5750,
"Wembley",
165
],
"IG1": [
4880,
"Ilford",
170
],
"IG11": [
4610,
"Barking",
228
],
"IG2": [
5150,
"Newbury Park, Ilford",
114
],
"IG3": [
4840,
"Newbury Park, Ilford",
100
],
"IG4": [
5400,
"Gants Hill, Ilford",
31
],
"IG5": [
5240,
"Clayhall, Ilford",
83
],
"IG6": [
5510,
"Barkingside, Ilford",
217
],
"IG8": [
6060,
"Woodford Green",
308
],
"KT1": [
7220,
"Hampton Wick, Kingston upon Thames",
192
],
"KT2": [
7580,
"Kingston upon Thames",
280
],
"KT3": [
6650,
"Motspur Park, New Malden",
282
],
"KT4": [
6140,
"Worcester Park",
271
],
"KT5": [
6780,
"Surbiton",
179
],
"KT6": [
6640,
"Long Ditton, Surbiton",
318
],
"KT9": [
5870,
"Hook, Chessington",
197
],
"N1": [
10600,
"Islington",
632
],
"N10": [
8570,
"Muswell Hill",
199
],
"N11": [
6180,
"Bounds Green",
183
],
"N12": [
6520,
"Woodside Park",
172
],
"N13": [
5770,
"Palmers Green",
178
],
"N14": [
6380,
"Southgate",
190
],
"N15": [
7090,
"South Tottenham",
168
],
"N16": [
8900,
"Stoke Newington",
299
],
"N17": [
6320,
"Tottenham",
255
],
"N18": [
5200,
"Edmonton",
90
],
"N19": [
8630,
"London",
173
],
"N1C": [
14400,
"London",
41
],
"N2": [
7760,
"East Finchley",
156
],
"N20": [
6680,
"Whetstone",
178
],
"N21": [
6300,
"Winchmore Hill",
187
],
"N22": [
7190,
"Wood Green",
206
],
"N3": [
6720,
"Finchley",
166
],
"N4": [
8760,
"Stroud Green",
346
],
"N5": [
9760,
"Islington",
207
],
"N6": [
9830,
"Highgate",
159
],
"N7": [
8410,
"Islington",
225
],
"N8": [
8570,
"Hornsey",
332
],
"N9": [
5130,
"Edmonton",
174
],
"NW1": [
9650,
"Marylebone",
206
],
"NW10": [
7090,
"Park Royal",
335
],
"NW11": [
8210,
"Golders Green",
163
],
"NW2": [
6840,
"Neasden",
252
],
"NW3": [
11600,
"Hampstead",
360
],
"NW4": [
5870,
"London",
142
],
"NW5": [
9840,
"Kentish Town",
163
],
"NW6": [
9350,
"Kilburn",
441
],
"NW7": [
6520,
"Mill Hill",
225
],
"NW8": [
11100,
"St Johns Wood",
153
],
"NW9": [
5890,
"Colindale",
302
],
"RM1": [
4960,
"Rise Park, Romford",
261
],
"RM10": [
4900,
"Dagenham",
197
],
"RM11": [
5360,
"Emerson Park, Hornchurch",
338
],
"RM12": [
5320,
"Elm Park, Hornchurch",
356
],
"RM13": [
4940,
"Wennington, Rainham",
247
],
"RM14": [
5740,
"Bulphan, Upminster",
286
],
"RM2": [
5260,
"Gidea Park, Romford",
133
],
"RM3": [
4930,
"Harold Wood, Romford",
329
],
"RM5": [
5130,
"Collier Row, Romford",
183
],
"RM6": [
4900,
"Chadwell Heath, Romford",
168
],
"RM7": [
4940,
"Rush Green, Romford",
261
],
"RM8": [
5050,
"Goodmayes, Dagenham",
225
],
"RM9": [
5120,
"Dagenham",
175
],
"SE1": [
8750,
"Borough",
477
],
"SE10": [
7160,
"Greenwich",
346
],
"SE11": [
7840,
"Kennington",
123
],
"SE12": [
5690,
"Lee",
201
],
"SE13": [
6500,
"Hither Green",
372
],
"SE14": [
6990,
"New Cross",
167
],
"SE15": [
7510,
"Peckham",
418
],
"SE16": [
7180,
"Bermondsey",
326
],
"SE17": [
7800,
"Walworth",
156
],
"SE18": [
5390,
"Plumstead",
427
],
"SE19": [
6440,
"Upper Norwood",
258
],
"SE2": [
5240,
"Abbey Wood",
152
],
"SE20": [
5980,
"Anerley",
211
],
"SE21": [
7900,
"West Dulwich",
121
],
"SE22": [
8540,
"East Dulwich",
287
],
"SE23": [
6900,
"Forest Hill",
332
],
"SE24": [
8580,
"Herne Hill",
136
],
"SE25": [
5390,
"South Norwood",
298
],
"SE26": [
6360,
"Sydenham",
245
],
"SE27": [
6970,
"West Norwood",
171
],
"SE28": [
4790,
"Thamesmead",
148
],
"SE3": [
6700,
"Blackheath",
299
],
"SE4": [
7770,
"Brockley",
237
],
"SE5": [
7100,
"Camberwell",
312
],
"SE6": [
5830,
"Catford",
380
],
"SE7": [
5660,
"Charlton",
114
],
"SE8": [
6620,
"Deptford",
188
],
"SE9": [
5450,
"Eltham",
463
],
"SM1": [
5590,
"Cheam, Sutton",
356
],
"SM2": [
5220,
"Cheam, Sutton",
287
],
"SM3": [
5770,
"Cheam, Sutton",
181
],
"SM4": [
6220,
"Morden",
221
],
"SM5": [
5800,
"Carshalton",
298
],
"SM6": [
5170,
"Hackbridge, Wallington",
315
],
"SW10": [
12500,
"London",
124
],
"SW11": [
9260,
"Battersea",
732
],
"SW12": [
9170,
"Balham",
351
],
"SW13": [
10200,
"Barnes",
161
],
"SW14": [
9160,
"East Sheen",
162
],
"SW15": [
8140,
"Putney",
552
],
"SW16": [
6120,
"Streatham",
696
],
"SW17": [
7940,
"Tooting",
620
],
"SW18": [
8600,
"Earlsfield",
812
],
"SW19": [
8050,
"Wimbledon",
758
],
"SW1A": [
null,
"London",
26
],
"SW1E": [
13800,
"London",
35
],
"SW1H": [
10900,
"London",
42
],
"SW1P": [
10300,
"London",
99
],
"SW1V": [
10800,
"London",
141
],
"SW1W": [
14200,
"London",
49
],
"SW1X": [
19800,
"London",
45
],
"SW1Y": [
null,
"London",
25
],
"SW2": [
7120,
"Streatham Hill",
473
],
"SW20": [
7470,
"Raynes Park",
287
],
"SW3": [
15600,
"Chelsea",
180
],
"SW4": [
8840,
"Clapham",
340
],
"SW5": [
11200,
"London",
101
],
"SW6": [
10300,
"Fulham",
526
],
"SW7": [
15000,
"Kensington",
136
],
"SW8": [
8190,
"Kennington",
263
],
"SW9": [
7780,
"Brixton",
253
],
"TN16": [
5000,
"Biggin Hill, Westerham",
123
],
"TW1": [
8690,
"St Margarets, Twickenham",
293
],
"TW10": [
8930,
"Ham, Richmond",
174
],
"TW11": [
8210,
"Teddington",
246
],
"TW12": [
6920,
"Hampton Hill, Hampton",
198
],
"TW13": [
5550,
"Hanworth, Feltham",
194
],
"TW14": [
5580,
"Bedfont, Feltham",
163
],
"TW2": [
7220,
"Whitton, Twickenham",
299
],
"TW3": [
5450,
"Whitton, Hounslow",
175
],
"TW4": [
5300,
"Whitton, Hounslow",
84
],
"TW5": [
5670,
"Cranford, Hounslow",
83
],
"TW7": [
6060,
"Osterley, Isleworth",
261
],
"TW8": [
6310,
"Brentford",
177
],
"TW9": [
8930,
"Kew, Richmond",
255
],
"UB1": [
5710,
"Southall",
81
],
"UB10": [
6150,
"Ickenham, Uxbridge",
289
],
"UB2": [
5220,
"Southall",
87
],
"UB3": [
5890,
"Harlington, Hayes",
177
],
"UB4": [
6030,
"Yeading, Hayes",
166
],
"UB5": [
5560,
"Northolt",
203
],
"UB6": [
6030,
"Perivale, Greenford",
218
],
"UB7": [
5420,
"Yiewsley, West Drayton",
157
],
"UB8": [
5580,
"Cowley, Uxbridge",
211
],
"W10": [
9750,
"North Kensington",
111
],
"W11": [
14400,
"Notting Hill",
155
],
"W12": [
8150,
"Hammersmith",
260
],
"W13": [
7970,
"Ealing",
244
],
"W14": [
10000,
"Holland Park",
237
],
"W1B": [
17400,
"London",
38
],
"W1D": [
null,
"London",
26
],
"W1F": [
16500,
"London",
47
],
"W1G": [
19600,
"London",
53
],
"W1H": [
13500,
"London",
45
],
"W1J": [
20700,
"Mayfair",
43
],
"W1K": [
25000,
"Mayfair",
40
],
"W1S": [
null,
"London",
20
],
"W1T": [
14300,
"London",
71
],
"W1U": [
14800,
"London",
36
],
"W1W": [
13100,
"Marylebone",
43
],
"W2": [
11400,
"Bayswater",
258
],
"W3": [
7190,
"Acton",
345
],
"W4": [
9110,
"Chiswick",
382
],
"W5": [
7550,
"Ealing",
358
],
"W6": [
9380,
"Hammersmith",
269
],
"W7": [
6960,
"Hanwell",
178
],
"W8": [
15000,
"Kensington",
148
],
"W9": [
10100,
"Maida Vale",
238
],
"WC1A": [
13100,
"London",
32
],
"WC1B": [
12200,
"London",
44
],
"WC1E": [
12100,
"London",
52
],
"WC1H": [
10900,
"London",
44
],
"WC1N": [
12100,
"Holborn",
47
],
"WC1R": [
null,
"London",
25
],
"WC1V": [
null,
"London",
6
],
"WC1X": [
11700,
"London",
56
],
"WC2A": [
null,
"London",
21
],
"WC2B": [
15600,
"London",
31
],
"WC2E": [
14400,
"London",
39
],
"WC2H": [
13200,
"London",
38
],
"WC2N": [
null,
"London",
27
],
"WC2R": [
null,
"Strand",
24
]
};

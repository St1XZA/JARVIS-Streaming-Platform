import { MediaItem, VidApiPlayerOptions, VidFastPlayerOptions, StreamServer } from '../types';

export const VIDFAST_ORIGINS = [
  'https://vidfast.pro',
  'https://vidfast.in',
  'https://vidfast.io',
  'https://vidfast.me',
  'https://vidfast.net',
  'https://vidfast.pm',
  'https://vidfast.xyz',
  'https://vidfast.vc',
  'https://vidfast.bz'
];

export const MEDIA_CATALOG: MediaItem[] = [
  // Examples from User Prompt
  {
    id: 'tt29623480',
    imdbId: 'tt29623480',
    tmdbId: 762441,
    type: 'movie',
    title: 'A Quiet Place: Day One',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/yrpPYK2soiZG0v1a8j2ho94WcuS.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/2RVcJbWFmICRDsEjRI8qvL59etV.jpg',
    rating: 6.8,
    overview: 'As New York City is invaded by alien creatures who hunt by sound, a woman named Sam fights to survive with her companion cat Frodo.',
    genres: ['Horror', 'Sci-Fi', 'Thriller'],
    duration: '1h 39m',
    category: 'trending',
    cast: ['Lupita Nyong\'o', 'Joseph Quinn', 'Alex Wolff', 'Djimon Hounsou']
  },
  {
    id: '1184918',
    tmdbId: 1184918,
    imdbId: 'tt29623480',
    type: 'movie',
    title: 'The Wild Robot',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/wTnV3PCVW5O92JMrFvvrRil39nM.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/417tYZ4q9kZZNXauJE5m3Z9oRsg.jpg',
    rating: 8.4,
    overview: 'After a shipwreck, an intelligent robot named Roz is stranded on an uninhabited island and must learn to adapt to the harsh surroundings, gradually bonding with the local animals and adopting an orphaned gosling.',
    genres: ['Animation', 'Sci-Fi', 'Family', 'Adventure'],
    duration: '1h 42m',
    category: 'trending',
    cast: ['Lupita Nyong\'o', 'Pedro Pascal', 'Kit Connor', 'Bill Nighy']
  },
  {
    id: 'tt3107288',
    imdbId: 'tt3107288',
    tmdbId: 60735,
    type: 'tv',
    title: 'The Flash',
    year: '2014-2023',
    poster: 'https://image.tmdb.org/t/p/w500/rg8N7x27Ef6PvlIiIRL05NjwSZf.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/jC1KwhfxAIB2KTd9i5tS3j7k0wH.jpg',
    rating: 7.7,
    overview: 'After a particle accelerator causes a freak storm, CSI Investigator Barry Allen is struck by lightning and falls into a coma. Months later he awakens with the power of super-speed, granting him the ability to move through Central City like an unseen guardian angel.',
    genres: ['Drama', 'Sci-Fi', 'Action'],
    totalSeasons: 9,
    episodesPerSeason: 13,
    category: 'series',
    cast: ['Grant Gustin', 'Candice Patton', 'Danielle Panabaker', 'Jesse L. Martin']
  },
  {
    id: '60735',
    tmdbId: 60735,
    imdbId: 'tt3107288',
    type: 'tv',
    title: 'The Flash (TMDb Entry)',
    year: '2014-2023',
    poster: 'https://image.tmdb.org/t/p/w500/rg8N7x27Ef6PvlIiIRL05NjwSZf.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/jC1KwhfxAIB2KTd9i5tS3j7k0wH.jpg',
    rating: 7.7,
    overview: 'Barry Allen strikes through Central City as the Scarlet Speedster, confronting rogues and meta-humans across the multiverse.',
    genres: ['Drama', 'Sci-Fi', 'Action'],
    totalSeasons: 9,
    episodesPerSeason: 13,
    category: 'series',
    cast: ['Grant Gustin', 'Candice Patton']
  },

  // Marvel & Stark Archives
  {
    id: 'tt0371746',
    imdbId: 'tt0371746',
    tmdbId: 1726,
    type: 'movie',
    title: 'Iron Man',
    year: 2008,
    poster: 'https://image.tmdb.org/t/p/w500/78lPtwv72eTNqFW9COBYI0dWDJa.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/cyecbWc1gWpT2L3W4h4rF27iT2s.jpg',
    rating: 7.9,
    overview: 'After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit of armor to fight evil and builds the J.A.R.V.I.S. neural interface.',
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    duration: '2h 06m',
    category: 'marvel',
    director: 'Jon Favreau',
    cast: ['Robert Downey Jr.', 'Gwyneth Paltrow', 'Jeff Bridges', 'Terrence Howard']
  },
  {
    id: 'tt4154796',
    imdbId: 'tt4154796',
    tmdbId: 299534,
    type: 'movie',
    title: 'Avengers: Endgame',
    year: 2019,
    poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    rating: 8.4,
    overview: 'After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos\' actions and restore balance.',
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    duration: '3h 01m',
    category: 'marvel',
    director: 'Anthony Russo, Joe Russo',
    cast: ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo', 'Chris Hemsworth', 'Scarlett Johansson']
  },
  {
    id: 'tt4154756',
    imdbId: 'tt4154756',
    tmdbId: 299536,
    type: 'movie',
    title: 'Avengers: Infinity War',
    year: 2018,
    poster: 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/lmZFxXgJE3vgrphYGAG4w69IRPt.jpg',
    rating: 8.4,
    overview: 'The Avengers and their allies must be willing to sacrifice all in an attempt to defeat the powerful Thanos before his blitz of devastation puts an end to the universe.',
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    duration: '2h 29m',
    category: 'marvel',
    cast: ['Robert Downey Jr.', 'Josh Brolin', 'Chris Hemsworth']
  },
  {
    id: 'tt9140554',
    imdbId: 'tt9140554',
    tmdbId: 84958,
    type: 'tv',
    title: 'Loki',
    year: '2021-2023',
    poster: 'https://image.tmdb.org/t/p/w500/voHUmlvjysvFlBYi7GdYrWNXdun.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    rating: 8.2,
    overview: 'The mercurial villain Loki resumes his role as the God of Mischief in a new series that takes place after the events of Avengers: Endgame.',
    genres: ['Drama', 'Sci-Fi', 'Fantasy'],
    totalSeasons: 2,
    episodesPerSeason: 6,
    category: 'marvel',
    cast: ['Tom Hiddleston', 'Owen Wilson', 'Sophia Di Martino', 'Ke Huy Quan']
  },
  {
    id: 'tt6263850',
    imdbId: 'tt6263850',
    tmdbId: 533535,
    type: 'movie',
    title: 'Deadpool & Wolverine',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/yDHYTlust5Q82faW4orm3neuvNx.jpg',
    rating: 7.7,
    overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary Deadpool behind him. But when his homeworld faces an existential threat, Wade must team up with a reluctant Wolverine.',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    duration: '2h 08m',
    category: 'trending',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Matthew Macfadyen']
  },

  // Sci-Fi & Cyberpunk
  {
    id: 'tt0816692',
    imdbId: 'tt0816692',
    tmdbId: 157336,
    type: 'movie',
    title: 'Interstellar',
    year: 2014,
    poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    rating: 8.7,
    overview: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    duration: '2h 49m',
    category: 'scifi',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine']
  },
  {
    id: 'tt1375666',
    imdbId: 'tt1375666',
    tmdbId: 27205,
    type: 'movie',
    title: 'Inception',
    year: 2010,
    poster: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    rating: 8.8,
    overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered to be impossible: "inception".',
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    duration: '2h 28m',
    category: 'scifi',
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy']
  },
  {
    id: 'tt1856101',
    imdbId: 'tt1856101',
    tmdbId: 335984,
    type: 'movie',
    title: 'Blade Runner 2049',
    year: 2017,
    poster: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/ilryDT2gX1u59ZtY6hM0Mv68CgW.jpg',
    rating: 8.0,
    overview: 'Thirty years after the events of the first film, a new Blade Runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what\'s left of society into chaos.',
    genres: ['Sci-Fi', 'Mystery', 'Drama'],
    duration: '2h 44m',
    category: 'cyberpunk',
    director: 'Denis Villeneuve',
    cast: ['Ryan Gosling', 'Harrison Ford', 'Ana de Armas', 'Sylvia Hoeks']
  },
  {
    id: 'tt15239678',
    imdbId: 'tt15239678',
    tmdbId: 693134,
    type: 'movie',
    title: 'Dune: Part Two',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520b4d.jpg',
    rating: 8.5,
    overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between the love of his life and the fate of the known universe.',
    genres: ['Sci-Fi', 'Adventure'],
    duration: '2h 46m',
    category: 'blockbusters',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem']
  },
  {
    id: 'tt12637874',
    imdbId: 'tt12637874',
    tmdbId: 105248,
    type: 'tv',
    title: 'Cyberpunk: Edgerunners',
    year: 2022,
    poster: 'https://image.tmdb.org/t/p/w500/7jSWrns2vLw9a1l929f27uF1uM.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/qU1u99D1h1a91M2m2K9g2B0r0R.jpg',
    rating: 8.6,
    overview: 'A street kid trying to survive in a technology and body modification-obsessed city of the future. Having everything to lose, he chooses to stay alive by becoming an edgerunner.',
    genres: ['Animation', 'Action', 'Sci-Fi'],
    totalSeasons: 1,
    episodesPerSeason: 10,
    category: 'cyberpunk',
    cast: ['KENN', 'Aoi Yuki', 'Hiroki Touchi']
  },
  {
    id: 'tt11280740',
    imdbId: 'tt11280740',
    tmdbId: 94605,
    type: 'tv',
    title: 'Arcane',
    year: '2021-2024',
    poster: 'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn396mLvvyBtB.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/rkB4LyZHo1NHXSTXYG5cbgy3egb.jpg',
    rating: 9.0,
    overview: 'Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League champions-and the power that will tear them apart.',
    genres: ['Animation', 'Sci-Fi', 'Action', 'Drama'],
    totalSeasons: 2,
    episodesPerSeason: 9,
    category: 'series',
    cast: ['Hailee Steinfeld', 'Ella Purnell', 'Kevin Alejandro']
  },
  {
    id: 'tt1262426',
    imdbId: 'tt1262426',
    tmdbId: 106379,
    type: 'tv',
    title: 'Fallout',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/AnsZu4vT4cT0gQ5i9a7yCgCg1E.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/mo4a4rO4wF3R1a8e1YdY3G3k1M.jpg',
    rating: 8.4,
    overview: 'In a future, post-apocalyptic Los Angeles brought about by nuclear decimation, citizens must live in underground bunkers to protect themselves from radiation, mutants and bandits.',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    totalSeasons: 1,
    episodesPerSeason: 8,
    category: 'trending',
    cast: ['Ella Purnell', 'Walton Goggins', 'Aaron Moten']
  },
  {
    id: 'tt1190634',
    imdbId: 'tt1190634',
    tmdbId: 9799,
    type: 'tv',
    title: 'The Boys',
    year: '2019-2024',
    poster: 'https://image.tmdb.org/t/p/w500/7Ns6tO3aYjVOIJuEnTTzsq9RtQm.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/2meX1nMdScFOoV4370rqHWKm5oY.jpg',
    rating: 8.7,
    overview: 'A fun and irreverent take on what happens when superheroes—who are as popular as celebrities, as influential as politicians, and as revered as gods—abuse their superpowers rather than use them for good.',
    genres: ['Action', 'Sci-Fi', 'Comedy', 'Drama'],
    totalSeasons: 4,
    episodesPerSeason: 8,
    category: 'series',
    cast: ['Karl Urban', 'Jack Quaid', 'Antony Starr', 'Erin Moriarty']
  },
  {
    id: 'tt15398776',
    imdbId: 'tt15398776',
    tmdbId: 872585,
    type: 'movie',
    title: 'Oppenheimer',
    year: 2023,
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    rating: 8.9,
    overview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II.',
    genres: ['Drama', 'History', 'Biography'],
    duration: '3h 00m',
    category: 'blockbusters',
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.']
  },
  {
    id: 'tt1877830',
    imdbId: 'tt1877830',
    tmdbId: 414906,
    type: 'movie',
    title: 'The Batman',
    year: 2022,
    poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/5P8SmMzSNYikXpxil6BYz9G660E.jpg',
    rating: 7.8,
    overview: 'In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler.',
    genres: ['Crime', 'Mystery', 'Action'],
    duration: '2h 56m',
    category: 'blockbusters',
    director: 'Matt Reeves',
    cast: ['Robert Pattinson', 'Zoë Kravitz', 'Paul Dano', 'Jeffrey Wright']
  },

  // Newly Added Latest 2024-2025 Movies & TV Series
  {
    id: 'tt18412256',
    imdbId: 'tt18412256',
    tmdbId: 945961,
    type: 'movie',
    title: 'Alien: Romulus',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao8l3urDDgo402F.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9SSEUrSqhljBMzRe4aB5Y1WbYs5.jpg',
    rating: 7.3,
    overview: 'While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.',
    genres: ['Horror', 'Sci-Fi', 'Thriller'],
    duration: '1h 59m',
    category: 'latest',
    isLatest: true,
    releaseDate: '2024-08-16',
    director: 'Fede Álvarez',
    cast: ['Cailee Spaeny', 'David Jonsson', 'Archie Renaux', 'Isabela Merced']
  },
  {
    id: 'tt15474916',
    imdbId: 'tt15474916',
    tmdbId: 137437,
    type: 'tv',
    title: 'The Penguin',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/yrpPYK2soiZG0v1a8j2ho94WcuS.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/5qHoazZiaLe7oFBok7XlUhg96f2.jpg',
    rating: 8.8,
    overview: 'Follow Oz Cobb as he seeks to capitalize on the vacuum left by Carmine Falcone’s death to claw his way to the top of Gotham City\'s criminal underworld.',
    genres: ['Crime', 'Drama'],
    totalSeasons: 1,
    episodesPerSeason: 8,
    category: 'latest',
    isLatest: true,
    releaseDate: '2024-09-19',
    cast: ['Colin Farrell', 'Cristin Milioti', 'Rhenzy Feliz', 'Clancy Brown']
  },
  {
    id: 'tt2788316',
    imdbId: 'tt2788316',
    tmdbId: 126308,
    type: 'tv',
    title: 'Shōgun',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WNzG1AgYT.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/2w8W4u15R1AwtH7wY7hLwz84yR.jpg',
    rating: 8.7,
    overview: 'When a mysterious European ship is found marooned in a nearby fishing village, Lord Yoshii Toranaga discovers secrets that could tip the scales of power in feudal Japan.',
    genres: ['Drama', 'History', 'War'],
    totalSeasons: 1,
    episodesPerSeason: 10,
    category: 'latest',
    isLatest: true,
    releaseDate: '2024-02-27',
    cast: ['Hiroyuki Sanada', 'Cosmo Jarvis', 'Anna Sawai', 'Tadanobu Asano']
  },
  {
    id: 'tt9218128',
    imdbId: 'tt9218128',
    tmdbId: 558449,
    type: 'movie',
    title: 'Gladiator II',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/euYIwmwkmz95mnXvufEmbL69nmr.jpg',
    rating: 6.8,
    overview: 'Years after witnessing the death of Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome.',
    genres: ['Action', 'Adventure', 'Drama'],
    duration: '2h 28m',
    category: 'latest',
    isLatest: true,
    releaseDate: '2024-11-22',
    director: 'Ridley Scott',
    cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington', 'Connie Nielsen']
  },
  {
    id: 'tt11198330',
    imdbId: 'tt11198330',
    tmdbId: 94997,
    type: 'tv',
    title: 'House of the Dragon',
    year: '2022-2024',
    poster: 'https://image.tmdb.org/t/p/w500/t9Xke5724fqW3169BMxmu98qlZa.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg',
    rating: 8.4,
    overview: 'The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke. As King Viserys\'s succession creates bitter internal rivalries, the Dance of the Dragons begins.',
    genres: ['Drama', 'Fantasy', 'Action'],
    totalSeasons: 2,
    episodesPerSeason: 8,
    category: 'latest',
    isLatest: true,
    releaseDate: '2024-06-16',
    cast: ['Matt Smith', 'Emma D\'Arcy', 'Olivia Cooke', 'Rhys Ifans']
  },
  {
    id: 'tt11280744',
    imdbId: 'tt11280744',
    tmdbId: 95396,
    type: 'tv',
    title: 'Severance',
    year: '2022-2025',
    poster: 'https://image.tmdb.org/t/p/w500/b1x5oG1wz4U4Lw9o18dE0eU7gYV.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9nh1HkC2h1tA43Dq4yQpQW8n6q.jpg',
    rating: 8.7,
    overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth.',
    genres: ['Sci-Fi', 'Mystery', 'Thriller'],
    totalSeasons: 2,
    episodesPerSeason: 10,
    category: 'series',
    isLatest: true,
    cast: ['Adam Scott', 'Zach Cherry', 'Britt Lower', 'Patricia Arquette', 'Christopher Walken']
  },
  {
    id: 'tt12584954',
    imdbId: 'tt12584954',
    tmdbId: 718821,
    type: 'movie',
    title: 'Twisters',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao8l3urDDgo402F.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/p5oU7952k47hOq12oU4p0k0X8hS.jpg',
    rating: 7.0,
    overview: 'As storm season intensifies, the paths of former storm chaser Kate Cooper and reckless social-media superstar Tyler Owens collide in rural Oklahoma.',
    genres: ['Action', 'Adventure', 'Thriller'],
    duration: '2h 02m',
    category: 'latest',
    isLatest: true,
    releaseDate: '2024-07-19',
    cast: ['Daisy Edgar-Jones', 'Glen Powell', 'Anthony Ramos', 'Brandon Perea']
  },
  {
    id: 'tt13622970',
    imdbId: 'tt13622970',
    tmdbId: 1241982,
    type: 'movie',
    title: 'Moana 2',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/aLVkiINNOvcCvKpZyaz5KTg6SQK.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/tEWB3W9Yg4rP4kF8QvA8Uu7a.jpg',
    rating: 7.1,
    overview: 'After receiving an unexpected call from her wayfinding ancestors, Moana journeys alongside Maui and a brand-new crew into far seas of Oceania.',
    genres: ['Animation', 'Adventure', 'Family', 'Music'],
    duration: '1h 40m',
    category: 'latest',
    isLatest: true,
    releaseDate: '2024-11-27',
    cast: ['Auli\'i Cravalho', 'Dwayne Johnson', 'Alan Tudyk']
  },
  {
    id: 'tt0468569',
    imdbId: 'tt0468569',
    tmdbId: 155,
    type: 'movie',
    title: 'The Dark Knight',
    year: 2008,
    poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    rating: 9.0,
    overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    genres: ['Action', 'Crime', 'Drama'],
    duration: '2h 32m',
    category: 'blockbusters',
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine']
  },
  {
    id: 'tt0133093',
    imdbId: 'tt0133093',
    tmdbId: 603,
    type: 'movie',
    title: 'The Matrix',
    year: 1999,
    poster: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/ncEIBdQyly6fYRVxPn5v0hF4sO9.jpg',
    rating: 8.7,
    overview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.',
    genres: ['Sci-Fi', 'Action', 'Cyberpunk'],
    duration: '2h 16m',
    category: 'cyberpunk',
    director: 'Lana Wachowski, Lilly Wachowski',
    cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss', 'Hugo Weaving']
  },
  {
    id: 'tt0903747',
    imdbId: 'tt0903747',
    tmdbId: 1396,
    type: 'tv',
    title: 'Breaking Bad',
    year: '2008-2013',
    poster: 'https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    rating: 9.5,
    overview: 'Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer. Together with his former student Jesse Pinkman, he turns to a life of crime by producing and selling crystal meth.',
    genres: ['Drama', 'Crime', 'Thriller'],
    totalSeasons: 5,
    episodesPerSeason: 13,
    category: 'series',
    cast: ['Bryan Cranston', 'Aaron Paul', 'Anna Gunn', 'Giancarlo Esposito']
  },
  {
    id: 'tt0944947',
    imdbId: 'tt0944947',
    tmdbId: 1399,
    type: 'tv',
    title: 'Game of Thrones',
    year: '2011-2019',
    poster: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
    rating: 9.2,
    overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war, while an ancient enemy awakens in the far north.',
    genres: ['Drama', 'Fantasy', 'Action'],
    totalSeasons: 8,
    episodesPerSeason: 10,
    category: 'series',
    cast: ['Emilia Clarke', 'Kit Harington', 'Peter Dinklage', 'Lena Headey']
  },
  {
    id: 'tt3581920',
    imdbId: 'tt3581920',
    tmdbId: 92749,
    type: 'tv',
    title: 'The Last of Us',
    year: '2023-2025',
    poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2V7JMrne.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    rating: 8.8,
    overview: 'Twenty years after a fungal infection decimates humanity, Joel is hired to smuggle 14-year-old Ellie across a ruthless, post-apocalyptic United States.',
    genres: ['Drama', 'Sci-Fi', 'Adventure'],
    totalSeasons: 2,
    episodesPerSeason: 9,
    category: 'series',
    isLatest: true,
    cast: ['Pedro Pascal', 'Bella Ramsey', 'Gabriel Luna']
  },
  {
    id: 'tt4574334',
    imdbId: 'tt4574334',
    tmdbId: 66732,
    type: 'tv',
    title: 'Stranger Things',
    year: '2016-2025',
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    rating: 8.7,
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl with telekinetic powers.',
    genres: ['Sci-Fi', 'Drama', 'Horror'],
    totalSeasons: 4,
    episodesPerSeason: 8,
    category: 'series',
    cast: ['Millie Bobby Brown', 'Finn Wolfhard', 'Winona Ryder', 'David Harbour']
  },
  {
    id: 'tt11905972',
    imdbId: 'tt11905972',
    tmdbId: 75780,
    type: 'tv',
    title: 'The Boys',
    year: '2019-2024',
    poster: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvfnrFLhxeD82xt.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/n6bต่อ9tDq8K3627YtKk7Z0qF.jpg',
    rating: 8.7,
    overview: 'A group of vigilantes known informally as "The Boys" set out to take down corrupt superheroes who abuse their superpowers rather than use them for good.',
    genres: ['Action', 'Sci-Fi', 'Comedy'],
    totalSeasons: 4,
    episodesPerSeason: 8,
    category: 'series',
    isLatest: true,
    cast: ['Karl Urban', 'Jack Quaid', 'Antony Starr', 'Erin Moriarty']
  },
  {
    id: 'tt0472954',
    imdbId: 'tt0472954',
    tmdbId: 2710,
    type: 'tv',
    title: 'It\'s Always Sunny in Philadelphia',
    year: '2005-2025',
    poster: 'https://image.tmdb.org/t/p/w500/o0tMMK33JqmtpcWw0H41cEr9xQB.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/u2K2hyUSds4KzOegsC8Eon9oNf2.jpg',
    rating: 8.8,
    overview: 'Four egocentric friends run a neighborhood Irish pub in Philadelphia and try to find their way through the adult world of work and relationships. Unfortunately, their warped views and precarious judgments often lead them to trouble, creating a myriad of uncomfortable situations that usually only get worse before they get better.',
    genres: ['Comedy', 'Sitcom'],
    totalSeasons: 18,
    episodesPerSeason: 10,
    category: 'series',
    isLatest: true,
    cast: ['Charlie Day', 'Glenn Howerton', 'Rob McElhenney', 'Kaitlin Olson', 'Danny DeVito']
  },
  {
    id: 'tt9362722',
    imdbId: 'tt9362722',
    tmdbId: 569094,
    type: 'movie',
    title: 'Spider-Man: Across the Spider-Verse',
    year: 2023,
    poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    rating: 8.7,
    overview: 'After reuniting with Gwen Stacy, Brooklyn’s full-time friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider-Society.',
    genres: ['Animation', 'Action', 'Sci-Fi', 'Adventure'],
    duration: '2h 20m',
    category: 'marvel',
    cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac', 'Daniel Kaluuya']
  },
  {
    id: 'tt0499549',
    imdbId: 'tt0499549',
    tmdbId: 19995,
    type: 'movie',
    title: 'Avatar',
    year: 2009,
    poster: 'https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/vL5LR6WdxWPjCmvf4384B6jVp.jpg',
    rating: 7.9,
    overview: 'In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission, but becomes torn between following orders and protecting the alien civilization he feels is his home.',
    genres: ['Action', 'Adventure', 'Fantasy', 'Sci-Fi'],
    duration: '2h 42m',
    category: 'blockbusters',
    director: 'James Cameron',
    cast: ['Sam Worthington', 'Zoe Saldaña', 'Sigourney Weaver', 'Stephen Lang']
  },
  {
    id: 'tt1630029',
    imdbId: 'tt1630029',
    tmdbId: 76600,
    type: 'movie',
    title: 'Avatar: The Way of Water',
    year: 2022,
    poster: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg',
    rating: 7.8,
    overview: 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    duration: '3h 12m',
    category: 'blockbusters',
    director: 'James Cameron',
    cast: ['Sam Worthington', 'Zoe Saldaña', 'Sigourney Weaver', 'Kate Winslet']
  },
  {
    id: 'tt5177120',
    imdbId: 'tt5177120',
    tmdbId: 533535,
    type: 'movie',
    title: 'Deadpool & Wolverine',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9l1eZiJHmhr5jIlthMdJN5mbtBP.jpg',
    rating: 7.7,
    overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary Deadpool behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    duration: '2h 08m',
    category: 'marvel',
    isLatest: true,
    director: 'Shawn Levy',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Matthew Macfadyen']
  },
  {
    id: 'tt11145118',
    imdbId: 'tt11145118',
    tmdbId: 912649,
    type: 'movie',
    title: 'Venom: The Last Dance',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/aosm8Vh9ypRBvt6vY4D2nraHGfW.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/3V4kLQg0kSqPLctI5ziYWMEAZYF.jpg',
    rating: 6.8,
    overview: 'Eddie and Venom are on the run. Hunted by both of their worlds and with the net closing in, the duo are forced into a devastating decision that will bring the curtains down on Venom and Eddie\'s last dance.',
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    duration: '1h 50m',
    category: 'marvel',
    isLatest: true,
    cast: ['Tom Hardy', 'Chiwetel Ejiofor', 'Juno Temple', 'Stephen Graham']
  },
  {
    id: 'tt14539740',
    imdbId: 'tt14539740',
    tmdbId: 823464,
    type: 'movie',
    title: 'Godzilla x Kong: The New Empire',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/bQ2ywkch09oT9yhVIpszmpmpU22.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
    rating: 7.1,
    overview: 'Following their explosive showdown, Godzilla and Kong must reunite against a colossal undiscovered threat hidden within our world, challenging their very existence – and our own.',
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    duration: '1h 55m',
    category: 'blockbusters',
    isLatest: true,
    cast: ['Rebecca Hall', 'Brian Tyree Henry', 'Dan Stevens', 'Kaylee Hottle']
  },
  {
    id: 'tt5108870',
    imdbId: 'tt5108870',
    tmdbId: 1022789,
    type: 'movie',
    title: 'Inside Out 2',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/stKGOm8wqGGOvHQ1GIl8inMZhiO.jpg',
    rating: 7.6,
    overview: 'Teenager Riley\'s mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions! Joy, Sadness, Anger, Fear and Disgust aren\'t sure how to feel when Anxiety shows up.',
    genres: ['Animation', 'Family', 'Comedy', 'Adventure'],
    duration: '1h 36m',
    category: 'latest',
    isLatest: true,
    cast: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman', 'Liza Lapira']
  },
  {
    id: 'tt7959026',
    imdbId: 'tt7959026',
    tmdbId: 653346,
    type: 'movie',
    title: 'Kingdom of the Planet of the Apes',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/fqv8v6AycXKsivp1T5oKtLbGXce.jpg',
    rating: 7.2,
    overview: 'Several generations in the future following Caesar\'s reign, apes are now the dominant species and live harmoniously while humans have been reduced to living in the shadows.',
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    duration: '2h 25m',
    category: 'latest',
    isLatest: true,
    cast: ['Owen Teague', 'Freya Allan', 'Kevin Durand', 'Peter Macon']
  },
  {
    id: 'tt11192306',
    imdbId: 'tt11192306',
    tmdbId: 1084736,
    type: 'movie',
    title: 'The Substance',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/5v60Z6d36gq52hWzQp1F5Z6uQ6u.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/uVlUu1wLI52W1TaAgyAYQ7f0h7X.jpg',
    rating: 7.5,
    overview: 'A fading celebrity decides to use a black-market drug, a cell-replicating substance that temporarily creates a younger, better version of herself.',
    genres: ['Horror', 'Drama', 'Sci-Fi'],
    duration: '2h 21m',
    category: 'latest',
    isLatest: true,
    cast: ['Demi Moore', 'Margaret Qualley', 'Dennis Quaid']
  },
  {
    id: 'tt1136608',
    imdbId: 'tt1136608',
    tmdbId: 204546,
    type: 'movie',
    title: 'Transformers One',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/qbkPtZ1w5c1qj2Z6Yqf5w5vY6.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/uGmYq08K5cWk2Vp0nK6X6k1Y7g.jpg',
    rating: 8.1,
    overview: 'The untold origin story of Optimus Prime and Megatron, better known as sworn enemies, but once were friends bonded like brothers who changed the fate of Cybertron forever.',
    genres: ['Animation', 'Sci-Fi', 'Adventure', 'Action'],
    duration: '1h 44m',
    category: 'latest',
    isLatest: true,
    cast: ['Chris Hemsworth', 'Brian Tyree Henry', 'Scarlett Johansson', 'Keegan-Michael Key']
  }
];

// Mark early 2024 titles with isLatest
MEDIA_CATALOG.forEach(item => {
  if (['tt29623480', '1184918', 'tt6263850', 'tt15239678', 'tt1262426'].includes(item.id)) {
    item.isLatest = true;
  }
});

/**
 * Builds the streaming embed URL using VidFast specifications (https://vidfast.vc)
 * Official endpoints:
 * - Movie: https://vidfast.vc/movie/{id}?autoPlay=true
 * - TV Show: https://vidfast.vc/tv/{id}/{season}/{episode}?autoPlay=true&nextButton=true&autoNext=true
 * Valid parameters:
 * - id: IMDB ID (with tt prefix) or TMDB ID (numeric)
 * - autoPlay: boolean (default: true)
 * - startAt: Watch position in seconds
 * - theme: Player accent color hex code (e.g. '00f2ff' or '16A085')
 * - nextButton: Displays the "Next Episode" button when 90% watched
 * - autoNext: Automatically plays next episode when current ends
 * - title, poster, server, hideServer, fullscreenButton, chromecast, sub
 */
export function buildVidFastUrl(
  mediaId: string,
  type: 'movie' | 'tv',
  season: number = 1,
  episode: number = 1,
  options?: VidFastPlayerOptions
): string {
  const cleanId = mediaId.trim();
  const base = type === 'movie'
    ? `https://vidfast.vc/movie/${cleanId}`
    : `https://vidfast.vc/tv/${cleanId}/${season}/${episode}`;

  const url = new URL(base);

  // Default autoplay is true
  url.searchParams.set('autoPlay', options?.autoPlay === false ? 'false' : 'true');

  // Stark HUD Cyan theme by default
  const themeHex = options?.theme || '00f2ff';
  url.searchParams.set('theme', themeHex.replace('#', ''));

  if (type === 'tv') {
    // Next episode smart button and auto progression
    url.searchParams.set('nextButton', options?.nextButton === false ? 'false' : 'true');
    url.searchParams.set('autoNext', options?.autoNext === false ? 'false' : 'true');
  }

  if (options?.startAt && options.startAt > 5) {
    url.searchParams.set('startAt', Math.floor(options.startAt).toString());
  }

  if (options?.title !== undefined) {
    url.searchParams.set('title', options.title ? 'true' : 'false');
  }

  if (options?.poster !== undefined) {
    url.searchParams.set('poster', options.poster ? 'true' : 'false');
  }

  if (options?.server) {
    url.searchParams.set('server', options.server);
  }

  if (options?.hideServer !== undefined) {
    url.searchParams.set('hideServer', options.hideServer ? 'true' : 'false');
  }

  if (options?.fullscreenButton !== undefined) {
    url.searchParams.set('fullscreenButton', options.fullscreenButton ? 'true' : 'false');
  }

  if (options?.chromecast !== undefined) {
    url.searchParams.set('chromecast', options.chromecast ? 'true' : 'false');
  }

  if (options?.sub) {
    url.searchParams.set('sub', options.sub);
  }

  return url.toString();
}

/**
 * Builds the streaming embed URL using VidAPI specifications (https://vidapi.ru/api)
 * Official endpoints:
 * - Movie: https://vaplayer.ru/embed/movie/{id} (or https://vidapi.ru/embed/movie/{id})
 * - TV Show: https://vaplayer.ru/embed/tv/{id}/{season}/{episode}
 */
export function buildStreamUrl(
  mediaId: string, 
  type: 'movie' | 'tv', 
  season: number = 1, 
  episode: number = 1,
  domain: 'vaplayer.ru' | 'vidapi.ru' = 'vaplayer.ru',
  options?: VidApiPlayerOptions
): string {
  const cleanId = mediaId.trim();
  const base = type === 'movie'
    ? `https://${domain}/embed/movie/${cleanId}`
    : `https://${domain}/embed/tv/${cleanId}/${season}/${episode}`;

  const url = new URL(base);
  const color = options?.primaryColor || '%2300f2ff';
  url.searchParams.set('color', '00f2ff');
  url.searchParams.set('primaryColor', color);
  url.searchParams.set('autoplay', options?.autoplay === false ? '0' : '1');

  if (options?.resumeAt && options.resumeAt > 5) {
    url.searchParams.set('resumeAt', Math.floor(options.resumeAt).toString());
  } else if (options?.startAt && options.startAt > 0) {
    url.searchParams.set('startAt', Math.floor(options.startAt).toString());
  }

  if (options?.subUrl) {
    url.searchParams.set('sub_url', options.subUrl);
    if (options.subLang) url.searchParams.set('sub_lang', options.subLang);
    if (options.subLabel) url.searchParams.set('sub_label', options.subLabel);
    if (options.subDefault) url.searchParams.set('sub_default', 'true');
  }

  return url.toString();
}

/**
 * Search the catalog for matching media titles, genres, overview keywords, or direct IDs
 */
export function searchVidApiCatalog(
  query: string,
  filterType?: 'all' | 'movie' | 'tv',
  filterGenre?: string
): MediaItem[] {
  const q = query.trim().toLowerCase();

  return MEDIA_CATALOG.filter(item => {
    // Type filter
    if (filterType && filterType !== 'all' && item.type !== filterType) {
      return false;
    }

    // Genre filter
    if (filterGenre && filterGenre !== 'all' && !item.genres.some(g => g.toLowerCase() === filterGenre.toLowerCase())) {
      return false;
    }

    // If no query, return matches
    if (!q) return true;

    // ID exact/partial match
    if (item.id.toLowerCase().includes(q) || 
        (item.imdbId && item.imdbId.toLowerCase().includes(q)) ||
        (item.tmdbId && String(item.tmdbId).includes(q))) {
      return true;
    }

    // Title match
    if (item.title.toLowerCase().includes(q)) return true;

    // Genre or overview match
    if (item.genres.some(g => g.toLowerCase().includes(q))) return true;
    if (item.overview && item.overview.toLowerCase().includes(q)) return true;
    if (item.director && item.director.toLowerCase().includes(q)) return true;
    if (item.cast && item.cast.some(c => c.toLowerCase().includes(q))) return true;

    return false;
  });
}

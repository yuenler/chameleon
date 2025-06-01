import { db } from '../firebase/config';
import { doc, collection, getDocs, query, where, updateDoc, getDoc, setDoc, onSnapshot, deleteField } from 'firebase/firestore';
import { Game, GameStatus, Player } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Word categories and words for the game
export const categories = {
  // Animals
  "Animals": ["Elephant", "Tiger", "Penguin", "Dolphin", "Koala", "Giraffe", "Kangaroo", "Octopus", "Lion", "Panda", "Zebra", "Gorilla", "Hippopotamus", "Flamingo", "Hedgehog", "Platypus", "Sloth", "Raccoon", "Armadillo", "Jaguar", "Cheetah", "Lemur", "Meerkat", "Narwhal", "Wombat", "Axolotl", "Ocelot", "Lynx", "Capybara", "Pangolin"],
  "Marine Animals": ["Shark", "Whale", "Octopus", "Dolphin", "Seahorse", "Jellyfish", "Crab", "Lobster", "Stingray", "Manatee", "Starfish", "Clownfish", "Coral", "Eel", "Walrus", "Seal", "Sea Turtle", "Squid", "Narwhal", "Otter", "Beluga", "Hammerhead", "Marlin", "Barracuda", "Manta Ray", "Pufferfish", "Swordfish", "Anemone", "Piranha", "Mahi-mahi"],
  "Insects": ["Butterfly", "Bee", "Ant", "Ladybug", "Grasshopper", "Mantis", "Dragonfly", "Spider", "Moth", "Beetle", "Caterpillar", "Mosquito", "Firefly", "Wasp", "Cicada", "Centipede", "Cockroach", "Termite", "Scorpion", "Cricket", "Fly", "Tarantula", "Stick Insect", "Hornet", "Flea", "Tick", "Aphid", "Millipede", "Gnat", "Weevil"],
  "Birds": ["Eagle", "Penguin", "Ostrich", "Flamingo", "Owl", "Hummingbird", "Peacock", "Toucan", "Falcon", "Parrot", "Swan", "Pelican", "Vulture", "Woodpecker", "Albatross", "Robin", "Kiwi", "Sparrow", "Cardinal", "Seagull", "Crow", "Pigeon", "Hawk", "Macaw", "Bluebird", "Cockatoo", "Kingfisher", "Chickadee", "Finch", "Condor"],
  
  // Places
  "Countries": ["Japan", "Brazil", "Australia", "France", "Egypt", "Canada", "Mexico", "India", "Russia", "South Africa", "China", "Germany", "Italy", "Spain", "Greece", "Thailand", "Peru", "Argentina", "Kenya", "Morocco", "Ireland", "Netherlands", "Singapore", "New Zealand", "Switzerland", "South Korea", "Portugal", "Vietnam", "Turkey", "Iceland"],
  "Cities": ["Paris", "Tokyo", "New York", "Rome", "London", "Barcelona", "Dubai", "Hong Kong", "Cairo", "Sydney", "Berlin", "Amsterdam", "Venice", "Seoul", "Singapore", "Istanbul", "Prague", "Vienna", "Bangkok", "Rio de Janeiro", "Las Vegas", "Miami", "Toronto", "Mexico City", "Mumbai", "Moscow", "Stockholm", "Athens", "Marrakech", "Budapest"],
  "Tourist Attractions": ["Eiffel Tower", "Grand Canyon", "Great Wall", "Taj Mahal", "Pyramids", "Machu Picchu", "Colosseum", "Mount Everest", "Statue of Liberty", "Venice Canals", "Golden Gate Bridge", "Louvre Museum", "Sydney Opera House", "Stonehenge", "Great Barrier Reef", "Niagara Falls", "Big Ben", "Santorini", "Angkor Wat", "Burj Khalifa", "Serengeti", "Times Square", "Victoria Falls", "Acropolis", "Antelope Canyon", "Mount Fuji", "Sistine Chapel", "Tower Bridge", "Christ the Redeemer", "Northern Lights"],
  "Natural Wonders": ["Grand Canyon", "Great Barrier Reef", "Mount Everest", "Northern Lights", "Victoria Falls", "Amazon Rainforest", "Paricutin Volcano", "Harbor of Rio", "Dead Sea", "Niagara Falls", "Sahara Desert", "Galápagos Islands", "Yellowstone", "Uluru", "Great Blue Hole", "Matterhorn", "Cliffs of Moher", "Bryce Canyon", "Yosemite Valley", "Mount Kilimanjaro", "Giant's Causeway", "Mariana Trench", "Antelope Canyon", "Salar de Uyuni", "Ha Long Bay", "Serengeti Plains", "Lake Baikal", "Fairy Pools", "Redwood Forest", "Iguazu Falls"],
  
  // Food & Drink
  "Foods": ["Pizza", "Sushi", "Pasta", "Burger", "Taco", "Curry", "Pancake", "Chocolate", "Ramen", "Croissant", "Steak", "Pho", "Paella", "Lasagna", "Dim Sum", "Gyros", "Risotto", "Kimchi", "Falafel", "Poutine", "Jerk Chicken", "Gumbo", "Tiramisu", "Borscht", "Dumplings", "Bibimbap", "Couscous", "Pad Thai", "Empanada", "Tandoori Chicken"],
  "Desserts": ["Chocolate Cake", "Ice Cream", "Cheesecake", "Tiramisu", "Apple Pie", "Macaron", "Crème Brûlée", "Brownie", "Churros", "Cannoli", "Gelato", "Baklava", "Donut", "Flan", "Panna Cotta", "Éclair", "Cupcake", "Tart", "Mochi", "Pavlova", "Profiterole", "Cookie", "Soufflé", "Rice Pudding", "Baked Alaska", "Cinnamon Roll", "Crêpe", "Croissant", "Bread Pudding", "Milkshake"],
  "Beverages": ["Coffee", "Tea", "Wine", "Beer", "Whiskey", "Cocktail", "Smoothie", "Lemonade", "Cappuccino", "Orange Juice", "Hot Chocolate", "Champagne", "Espresso", "Mojito", "Margarita", "Milkshake", "Green Tea", "Chai", "Bloody Mary", "Bubble Tea", "Kombucha", "Apple Cider", "Coconut Water", "Matcha", "Root Beer", "Frappuccino", "Iced Tea", "Ginger Ale", "Horchata", "Sangria"],
  "Fruits": ["Apple", "Banana", "Orange", "Strawberry", "Mango", "Pineapple", "Watermelon", "Grape", "Kiwi", "Peach", "Blueberry", "Cherry", "Coconut", "Avocado", "Pear", "Lemon", "Papaya", "Raspberry", "Pomegranate", "Dragon Fruit", "Passion Fruit", "Guava", "Apricot", "Blackberry", "Fig", "Lychee", "Cantaloupe", "Persimmon", "Grapefruit", "Nectarine"],
  "Vegetables": ["Carrot", "Broccoli", "Potato", "Tomato", "Cucumber", "Spinach", "Onion", "Eggplant", "Bell Pepper", "Corn", "Lettuce", "Zucchini", "Garlic", "Cauliflower", "Mushroom", "Cabbage", "Asparagus", "Pumpkin", "Kale", "Brussels Sprout", "Beet", "Radish", "Sweet Potato", "Green Bean", "Artichoke", "Celery", "Turnip", "Pea", "Okra", "Leek"],
  
  // Activities
  "Sports": ["Soccer", "Basketball", "Tennis", "Swimming", "Volleyball", "Golf", "Cricket", "Surfing", "Baseball", "Hockey", "Football", "Rugby", "Boxing", "Skiing", "Skateboarding", "Cycling", "Running", "Gymnastics", "Climbing", "Archery", "Martial Arts", "Figure Skating", "Wrestling", "Rowing", "Bowling", "Diving", "Badminton", "Handball", "Judo", "Triathlon"],
  "Winter Sports": ["Skiing", "Snowboarding", "Ice Hockey", "Figure Skating", "Ice Fishing", "Sledding", "Curling", "Snowshoeing", "Biathlon", "Bobsleigh", "Luge", "Ice Climbing", "Ski Jumping", "Speed Skating", "Snow Tubing", "Snowmobiling", "Snowball Fight", "Alpine Skiing", "Cross-country Skiing", "Telemark Skiing", "Freestyle Skiing", "Ice Dancing", "Ice Sculpture", "Skeleton", "Nordic Combined", "Ice Skating", "Snowkiting", "Broomball", "Bandy", "Winter Pentathlon"],
  "Water Sports": ["Swimming", "Surfing", "Sailing", "Kayaking", "Wakeboarding", "Scuba Diving", "Water Polo", "Windsurfing", "Jet Skiing", "Paddleboarding", "Canoeing", "Snorkeling", "Fishing", "Rafting", "Water Skiing", "Synchronized Swimming", "Rowing", "Kite Surfing", "Cliff Diving", "Parasailing", "Freediving", "Bodyboarding", "Dragon Boat Racing", "Flyboarding", "Coasteering", "Aqua Aerobics", "Underwater Hockey", "Cable Wakeboarding", "River Tubing", "Whitewater Kayaking"],
  "Hobbies": ["Painting", "Gardening", "Photography", "Cooking", "Knitting", "Reading", "Hiking", "Fishing", "Gaming", "Yoga", "Birdwatching", "Pottery", "Woodworking", "Chess", "Collecting", "Calligraphy", "Dancing", "Camping", "Astronomy", "Origami", "Archery", "Skateboarding", "Playing Guitar", "Wine Tasting", "Beekeeping", "Rock Climbing", "Candle Making", "Metal Detecting", "Soap Making", "Stargazing"],
  
  // Entertainment
  "Movies": ["Avatar", "Titanic", "Star Wars", "Inception", "Frozen", "Avengers", "Matrix", "Jurassic Park", "Harry Potter", "Lord of the Rings", "Toy Story", "The Lion King", "Forrest Gump", "The Godfather", "Pulp Fiction", "Fight Club", "Interstellar", "Jaws", "The Shining", "The Dark Knight", "Goodfellas", "Casablanca", "Parasite", "E.T.", "Gladiator", "Back to the Future", "Up", "The Silence of the Lambs", "Psycho", "Inside Out"],
  "TV Shows": ["Friends", "Game of Thrones", "Breaking Bad", "The Office", "Stranger Things", "The Crown", "The Simpsons", "Black Mirror", "The Mandalorian", "Westworld", "Grey's Anatomy", "The Big Bang Theory", "The Walking Dead", "Squid Game", "Succession", "Money Heist", "Peaky Blinders", "Doctor Who", "The Witcher", "Lost", "Sherlock", "House of Cards", "Twin Peaks", "Fargo", "The Sopranos", "Mad Men", "Chernobyl", "Dexter", "Ozark", "The Queen's Gambit"],
  "Video Games": ["Minecraft", "Fortnite", "Tetris", "Super Mario", "The Legend of Zelda", "Pokémon", "Grand Theft Auto", "Call of Duty", "FIFA", "The Sims", "Pac-Man", "World of Warcraft", "Overwatch", "Assassin's Creed", "Red Dead Redemption", "Halo", "Animal Crossing", "Final Fantasy", "League of Legends", "Sonic", "God of War", "Resident Evil", "The Last of Us", "Street Fighter", "Among Us", "Mortal Kombat", "Counter-Strike", "Rocket League", "Civilization", "Dark Souls"],
  "Musical Instruments": ["Piano", "Guitar", "Violin", "Drums", "Saxophone", "Flute", "Trumpet", "Cello", "Clarinet", "Harmonica", "Harp", "Accordion", "Ukulele", "Trombone", "Banjo", "Organ", "Bass Guitar", "Oboe", "Viola", "Xylophone", "French Horn", "Mandolin", "Bongos", "Bagpipes", "Sitar", "Maracas", "Kalimba", "Didgeridoo", "Bassoon", "Theremin"],
  "Music Genres": ["Rock", "Pop", "Hip Hop", "Jazz", "Classical", "Country", "Blues", "Reggae", "Electronic", "R&B", "Metal", "Folk", "Punk", "Indie", "Latin", "Disco", "Opera", "Funk", "Gospel", "Alternative", "K-pop", "Techno", "Soul", "Rap", "Dubstep", "EDM", "Ambient", "Reggaeton", "Grunge", "New Wave"],
  
  // Professions & Education
  "Professions": ["Doctor", "Teacher", "Chef", "Pilot", "Artist", "Engineer", "Firefighter", "Scientist", "Lawyer", "Architect", "Nurse", "Mechanic", "Journalist", "Accountant", "Electrician", "Photographer", "Programmer", "Farmer", "Veterinarian", "Police Officer", "Dentist", "Carpenter", "Plumber", "Actor", "Musician", "Psychologist", "Pharmacist", "Athlete", "Hairstylist", "Astronaut"],
  "School Subjects": ["Mathematics", "Science", "History", "English", "Geography", "Physics", "Chemistry", "Biology", "Art", "Music", "Physical Education", "Economics", "Philosophy", "Computer Science", "Psychology", "Sociology", "Literature", "Foreign Languages", "Drama", "Political Science", "Algebra", "Geometry", "Calculus", "Statistics", "Environmental Science", "Astronomy", "Anthropology", "Archaeology", "Ethics", "Religious Studies"],
  "Languages": ["English", "Spanish", "Mandarin", "French", "Arabic", "Russian", "Japanese", "German", "Hindi", "Portuguese", "Italian", "Korean", "Dutch", "Turkish", "Swedish", "Polish", "Vietnamese", "Greek", "Hebrew", "Thai", "Hungarian", "Finnish", "Danish", "Norwegian", "Czech", "Swahili", "Irish", "Icelandic", "Welsh", "Maori"],
  
  // Household & Daily Life
  "Furniture": ["Table", "Chair", "Sofa", "Bed", "Dresser", "Bookshelf", "Desk", "Lamp", "Cabinet", "Coffee Table", "Nightstand", "Wardrobe", "Ottoman", "Dining Table", "Stool", "Bench", "Rocking Chair", "Couch", "Futon", "Beanbag", "Shelving Unit", "Vanity", "Credenza", "Loveseat", "Entertainment Center", "Armchair", "Hammock", "Bunk Bed", "Bar Stool", "Chaise Lounge"],
  "Clothing": ["T-shirt", "Jeans", "Dress", "Jacket", "Sweater", "Shoes", "Hat", "Socks", "Scarf", "Shorts", "Skirt", "Gloves", "Coat", "Sunglasses", "Tie", "Swimsuit", "Hoodie", "Belt", "Suit", "Pajamas", "Boots", "Sandals", "Watch", "Necklace", "Bracelet", "Earrings", "Ring", "Backpack", "Purse", "Wallet"],
  "Vehicles": ["Car", "Bicycle", "Motorcycle", "Airplane", "Boat", "Train", "Bus", "Helicopter", "Truck", "Scooter", "Subway", "Skateboard", "Tractor", "Van", "Jet Ski", "Ambulance", "Taxi", "Fire Truck", "Tank", "Submarine", "Yacht", "Rocket", "Hot Air Balloon", "Cruise Ship", "Limousine", "Segway", "Snowmobile", "Tram", "Sailboat", "Spacecraft"],
  "Appliances": ["Refrigerator", "Oven", "Microwave", "Dishwasher", "Washing Machine", "Toaster", "Blender", "Coffee Maker", "Vacuum Cleaner", "Air Conditioner", "Television", "Computer", "Hair Dryer", "Printer", "Electric Fan", "Mixer", "Iron", "Slow Cooker", "Electric Kettle", "Food Processor", "Juicer", "Rice Cooker", "Waffle Maker", "Sewing Machine", "Deep Fryer", "Humidifier", "Pressure Cooker", "Water Heater", "Game Console", "Speaker"],
  
  // Nature & Science
  "Weather": ["Rain", "Snow", "Sunshine", "Fog", "Wind", "Storm", "Hail", "Rainbow", "Thunderstorm", "Hurricane", "Tornado", "Blizzard", "Drought", "Lightning", "Cloud", "Frost", "Monsoon", "Drizzle", "Heatwave", "Sleet", "Tsunami", "Flood", "Cyclone", "Sandstorm", "Whirlwind", "Mist", "Wildfire", "Earthquake", "Avalanche", "Landslide"],
  "Plants": ["Rose", "Sunflower", "Tulip", "Cactus", "Oak Tree", "Fern", "Orchid", "Maple", "Bamboo", "Pine", "Lily", "Dandelion", "Succulent", "Palm Tree", "Daisy", "Lavender", "Bonsai", "Venus Flytrap", "Daffodil", "Ivy", "Poppy", "Moss", "Sequoia", "Cherry Blossom", "Magnolia", "Baobab", "Willow", "Aloe Vera", "Hibiscus", "Violet"],
  "Astronomy": ["Sun", "Moon", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Comet", "Asteroid", "Galaxy", "Black Hole", "Nebula", "Supernova", "Constellation", "Milky Way", "Solar Flare", "Shooting Star", "Satellite", "Quasar", "Pulsar", "Orbit", "Eclipse", "Meteor", "Aurora", "Gravity", "Red Giant"],
  "Dinosaurs": ["Tyrannosaurus Rex", "Velociraptor", "Triceratops", "Stegosaurus", "Brachiosaurus", "Pterodactyl", "Ankylosaurus", "Diplodocus", "Spinosaurus", "Allosaurus", "Parasaurolophus", "Iguanodon", "Carnotaurus", "Megalosaurus", "Pachycephalosaurus", "Argentinosaurus", "Compsognathus", "Mosasaurus", "Baryonyx", "Protoceratops", "Deinonychus", "Gigantosaurus", "Archaeopteryx", "Dilophosaurus", "Gallimimus", "Ichthyosaurus", "Dimetrodon", "Edmontosaurus", "Apatosaurus", "Oviraptor"],
  
  // Miscellaneous
  "Colors": ["Red", "Blue", "Green", "Yellow", "Purple", "Orange", "Pink", "Black", "White", "Brown", "Gray", "Turquoise", "Gold", "Silver", "Maroon", "Navy", "Teal", "Magenta", "Violet", "Beige", "Cyan", "Crimson", "Olive", "Lime", "Indigo", "Amber", "Coral", "Lavender", "Mint", "Salmon"],
  "Mythical Creatures": ["Dragon", "Unicorn", "Phoenix", "Mermaid", "Werewolf", "Vampire", "Griffin", "Centaur", "Pegasus", "Cyclops", "Minotaur", "Gorgon", "Kraken", "Fairy", "Goblin", "Leprechaun", "Troll", "Sphinx", "Chimera", "Hydra", "Banshee", "Basilisk", "Harpy", "Yeti", "Loch Ness Monster", "Sasquatch", "Cerberus", "Siren", "Ogre", "Hippogriff"],
  "Board Games": ["Chess", "Monopoly", "Scrabble", "Risk", "Clue", "Battleship", "Uno", "Checkers", "Jenga", "Settlers of Catan", "Backgammon", "Trivial Pursuit", "Connect Four", "Candyland", "Pictionary", "Life", "Sorry!", "Cranium", "Boggle", "Dominoes", "Pandemic", "Ticket to Ride", "Stratego", "Operation", "Scattergories", "Yahtzee", "Chutes and Ladders", "Apples to Apples", "Twister", "Guess Who"],
  "Holidays": ["Christmas", "Halloween", "New Year", "Easter", "Thanksgiving", "Valentine's Day", "St. Patrick's Day", "Diwali", "Hanukkah", "Lunar New Year", "Ramadan", "Independence Day", "Cinco de Mayo", "Eid al-Fitr", "Passover", "Holi", "Earth Day", "Labor Day", "Veterans Day", "Memorial Day", "Kwanzaa", "April Fools' Day", "Mother's Day", "Father's Day", "Oktoberfest", "Bastille Day", "Carnival", "Boxing Day", "Groundhog Day", "Mardi Gras"]
};

// Generate a random 6-character join code
const generateJoinCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Get a random category and word
const getRandomCategoryAndWord = (): { category: string, word: string } => {
  const categoryNames = Object.keys(categories);
  const randomCategory = categoryNames[Math.floor(Math.random() * categoryNames.length)];
  const words = categories[randomCategory as keyof typeof categories];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  return { category: randomCategory, word: randomWord };
};

// Create a new game
export const createGame = async (hostName: string): Promise<Game> => {
  try {
    console.log('Creating new game for host:', hostName);
    const gameId = uuidv4();
    const playerId = uuidv4();
    const joinCode = generateJoinCode();
    
    const newGame: Game = {
      id: gameId,
      joinCode,
      players: [{
        id: playerId,
        name: hostName,
        isChameleon: false,
        isReady: false,
        isHost: true
      }],
      status: GameStatus.WAITING,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    console.log('Game object created:', newGame);
    console.log('Attempting to write to Firestore...');
    
    const gameRef = doc(db, 'games', gameId);
    await setDoc(gameRef, newGame);
    
    console.log('Game successfully written to Firestore');
    
    return {
      ...newGame,
      players: [{
        id: playerId,
        name: hostName,
        isChameleon: false,
        isReady: false,
        isHost: true
      }]
    };
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

// Join an existing game
export const joinGame = async (joinCode: string, playerName: string): Promise<{game: Game, playerId: string}> => {
  try {
    console.log('Joining game with code:', joinCode, 'and player name:', playerName);
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, where('joinCode', '==', joinCode.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('Game not found with join code:', joinCode);
      throw new Error('Game not found');
    }
    
    const gameDoc = querySnapshot.docs[0];
    const game = gameDoc.data() as Game;
    console.log('Found game:', game);
    
    // Get the current state of players
    const currentGameRef = doc(db, 'games', game.id);
    const currentGameDoc = await getDoc(currentGameRef);
    const currentGame = currentGameDoc.data() as Game;
    const currentPlayers = currentGame.players || [];
    console.log('Current players in game:', currentPlayers);
    
    const playerId = uuidv4();
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      isChameleon: false,
      isReady: false,
      isHost: false
    };
    
    // Add player to the updated array instead of using arrayUnion
    const updatedPlayers = [...currentPlayers, newPlayer];
    console.log('Updated players array:', updatedPlayers);
    
    await updateDoc(currentGameRef, {
      players: updatedPlayers,
      updatedAt: Date.now()
    });
    console.log('Game document updated with new player');
    
    // Get the updated game to return
    const updatedGameDoc = await getDoc(currentGameRef);
    const updatedGame = updatedGameDoc.data() as Game;
    
    return { game: updatedGame, playerId };
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
};

// Start a game
export const startGame = async (gameId: string, customCategory?: { category: string; words: string[] }): Promise<Game> => {
  const gameRef = doc(db, 'games', gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    throw new Error('Game not found');
  }
  
  const game = gameDoc.data() as Game;
  
  if (game.players.length < 2) {
    throw new Error('Not enough players to start the game');
  }
  
  // Randomly select a chameleon
  const randomPlayerIndex = Math.floor(Math.random() * game.players.length);
  const chameleonId = game.players[randomPlayerIndex].id;
  
  // Use custom category if provided, otherwise select a random category and word
  const { category, word } = customCategory 
    ? { category: customCategory.category, word: customCategory.words[Math.floor(Math.random() * customCategory.words.length)] }
    : getRandomCategoryAndWord();
  
  // Update player statuses and set chameleon
  const updatedPlayers = game.players.map(player => ({
    ...player,
    isChameleon: player.id === chameleonId,
    isReady: true
  }));
  
  const updatedGame: Partial<Game> = {
    status: GameStatus.PLAYING,
    players: updatedPlayers,
    currentCategory: category,
    currentWord: word,
    chameleonId,
    updatedAt: Date.now()
  };
  
  await updateDoc(gameRef, updatedGame);
  
  return { ...game, ...updatedGame };
};

// End the current game and reset for a new round
export const restartGame = async (gameId: string): Promise<Game> => {
  const gameRef = doc(db, 'games', gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    throw new Error('Game not found');
  }
  
  const game = gameDoc.data() as Game;
  
  // Reset player statuses
  const updatedPlayers = game.players.map(player => ({
    ...player,
    isChameleon: false,
    isReady: false
  }));
  
  // Use deleteField() to remove fields from Firestore
  const updatedGame: any = {
    status: GameStatus.WAITING,
    players: updatedPlayers,
    currentCategory: deleteField(),
    currentWord: deleteField(),
    chameleonId: deleteField(),
    updatedAt: Date.now()
  };
  
  await updateDoc(gameRef, updatedGame);
  
  return { ...game, ...updatedGame };
};

// Leave a game
export const leaveGame = async (gameId: string, playerId: string): Promise<void> => {
  const gameRef = doc(db, 'games', gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    return; // Game doesn't exist, nothing to do
  }
  
  const game = gameDoc.data() as Game;
  const player = game.players.find(p => p.id === playerId);
  
  if (!player) {
    return; // Player not in game, nothing to do
  }
  
  // If there's only one player, mark the game as ended
  if (game.players.length === 1) {
    await updateDoc(gameRef, { status: GameStatus.ENDED });
    return;
  }
  
  // Remove the player from the game
  let updatedPlayers = game.players.filter(p => p.id !== playerId);
  
  // If the leaving player was the host, assign a new host
  if (player.isHost && updatedPlayers.length > 0) {
    console.log('Host is leaving, assigning new host');
    // Assign the first remaining player as the new host
    updatedPlayers = updatedPlayers.map((p, index) => ({
      ...p,
      isHost: index === 0 // Make the first player the new host
    }));
  }
  
  await updateDoc(gameRef, {
    players: updatedPlayers,
    updatedAt: Date.now()
  });
};

// Kick a player (host only)
export const kickPlayer = async (gameId: string, playerIdToKick: string): Promise<void> => {
  const gameRef = doc(db, 'games', gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    throw new Error('Game not found');
  }
  
  const game = gameDoc.data() as Game;
  
  // Make sure the player to kick exists and is not the host
  const playerToKick = game.players.find(p => p.id === playerIdToKick);
  if (!playerToKick) {
    throw new Error('Player not found');
  }
  
  if (playerToKick.isHost) {
    throw new Error('Cannot kick the host');
  }
  
  // Remove the player from the game
  const updatedPlayers = game.players.filter(p => p.id !== playerIdToKick);
  
  await updateDoc(gameRef, {
    players: updatedPlayers,
    updatedAt: Date.now()
  });
};

// Handle page unload events (back button, refresh, tab close)
// We need to store pending leave info to process on next app load
export const handlePageUnload = (gameId: string, playerId: string): void => {
  try {
    // Store info about the player leaving in localStorage
    // This will be processed on next app load
    localStorage.setItem('pendingLeave', JSON.stringify({
      gameId,
      playerId,
      timestamp: Date.now()
    }));
    
    // Clear game session data
    localStorage.removeItem('gameId');
    localStorage.removeItem('playerId');
  } catch (error) {
    console.error('Error during page unload:', error);
  }
};

// Process any pending leave operations from previous sessions
// This should be called when the app initializes
export const processPendingLeave = async (): Promise<void> => {
  try {
    const pendingLeaveData = localStorage.getItem('pendingLeave');
    if (pendingLeaveData) {
      const { gameId, playerId, timestamp } = JSON.parse(pendingLeaveData);
      
      // Only process if it's less than 1 hour old
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        console.log('Processing pending leave operation for player', playerId);
        await leaveGame(gameId, playerId);
      }
      
      // Clear the pending leave data
      localStorage.removeItem('pendingLeave');
    }
  } catch (error) {
    console.error('Error processing pending leave:', error);
    localStorage.removeItem('pendingLeave'); // Clear it to avoid repeated errors
  }
};

// Subscribe to game updates
export const subscribeToGame = (gameId: string, callback: (game: Game) => void): (() => void) => {
  const gameRef = doc(db, 'games', gameId);
  
  return onSnapshot(gameRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Game);
    }
  });
};

// Mark a player as ready
export const setPlayerReady = async (gameId: string, playerId: string, isReady: boolean): Promise<void> => {
  const gameRef = doc(db, 'games', gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    throw new Error('Game not found');
  }
  
  const game = gameDoc.data() as Game;
  const updatedPlayers = game.players.map(player => 
    player.id === playerId ? { ...player, isReady } : player
  );
  
  await updateDoc(gameRef, {
    players: updatedPlayers,
    updatedAt: Date.now()
  });
};

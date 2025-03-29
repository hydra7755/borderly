import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  content: string[];
  author: string;
  date: string;
  readTime: string;
  image: string;
}

const blogData: Record<string, BlogPost> = {
  jp: {
    id: 'jp',
    title: 'Exploring the Land of the Rising Sun',
    subtitle: 'Traditional and Modern Japan',
    author: 'Takashi Yamada',
    date: 'May 15, 2023',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    content: [
      'Japan offers a mesmerizing blend of ancient traditions and cutting-edge modernity. From the bustling streets of Tokyo to the serene temples of Kyoto, the country presents an unforgettable journey through time and culture.',
      'One of the most magical experiences in Japan is witnessing the cherry blossoms (sakura) in spring. These delicate pink flowers transform parks, streets, and riverbanks into ethereal landscapes that inspire poets and photographers alike. The Japanese tradition of hanami, or flower viewing, brings people together for picnics under the blooming trees.',
      'Japanese cuisine is another highlight, with its emphasis on seasonal ingredients, precise preparation, and beautiful presentation. Beyond sushi and ramen, travelers can explore regional specialties like Osaka\'s takoyaki (octopus balls), Hiroshima\'s okonomiyaki (savory pancakes), and Hokkaido\'s fresh seafood.',
      'For those seeking spiritual experiences, Japan\'s thousands of temples and shrines offer peaceful retreats. The ancient pilgrimage routes of Kumano Kodo and the sacred island of Miyajima provide deeper connections to the country\'s Shinto and Buddhist heritage.',
      'Japan\'s transportation system, particularly its shinkansen (bullet trains), makes traveling between cities efficient and comfortable. With a Japan Rail Pass, visitors can explore multiple regions, from the snow festivals of Sapporo to the tropical beaches of Okinawa.',
      'Whether you\'re soaking in an onsen (hot spring), participating in a traditional tea ceremony, or navigating the futuristic streets of Akihabara, Japan promises experiences that will stay with you long after your journey ends.'
    ]
  },
  nz: {
    id: 'nz',
    title: 'New Zealand: Nature\'s Playground',
    subtitle: 'Adventure in the Land of the Long White Cloud',
    author: 'Emma Wilson',
    date: 'June 22, 2023',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1469521669194-babb45599def?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    content: [
      'New Zealand, a country of breathtaking landscapes and adventurous pursuits, offers travelers an unparalleled opportunity to connect with nature. From the subtropical Bay of Islands in the North Island to the dramatic fjords of the South Island, the diversity of terrain is astounding.',
      'Adrenaline junkies flock to Queenstown, the adventure capital of the world, for bungee jumping, skydiving, and jet boating. For those seeking less extreme activities, the country offers countless hiking trails, including the famous Great Walks that traverse national parks and showcase New Zealand\'s varied ecosystems.',
      'The indigenous Māori culture adds depth to any visit, with opportunities to learn about traditional customs, witness powerful haka performances, and enjoy hangi feasts cooked in earth ovens. The concept of kaitiakitanga (guardianship of the environment) is evident in conservation efforts throughout the country.',
      'Wildlife enthusiasts can spot rare birds like the kiwi and kakapo, observe sperm whales off the coast of Kaikoura, swim with dolphins in Akaroa, and watch albatrosses soar in Dunedin. Marine reserves and sanctuaries protect these unique creatures and their habitats.',
      'New Zealand\'s wine regions, particularly Marlborough and Hawke\'s Bay, produce world-renowned wines that pair perfectly with the country\'s fresh seafood and farm-to-table cuisine. Food trails and farmers\' markets highlight the best of local produce.',
      'Whether you\'re exploring the geothermal wonders of Rotorua, sailing in the Bay of Islands, stargazing in the Dark Sky Reserve of Mackenzie, or following in the footsteps of hobbits at Hobbiton, New Zealand promises unforgettable experiences in a pristine natural setting.'
    ]
  },
  th: {
    id: 'th',
    title: 'Thailand: Kingdom of Smiles',
    subtitle: 'Beaches, Temples, and Vibrant Street Life',
    author: 'Supachai Panyasiri',
    date: 'April 3, 2023',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    content: [
      'Thailand captivates visitors with its golden temples, exotic beaches, and vibrant street life. The Land of Smiles lives up to its nickname through the warm hospitality of its people and the joyful approach to life that permeates Thai culture.',
      'Bangkok, the capital, pulsates with energy as traditional longtail boats navigate the Chao Phraya River alongside gleaming skyscrapers. The Grand Palace and Wat Phra Kaew dazzle with their intricate architecture and spiritual significance, while the floating markets and bustling street food scenes offer authentic glimpses into everyday Thai life.',
      'The northern city of Chiang Mai serves as a gateway to the mountainous region, where travelers can trek through jungles, visit hill tribe villages, and participate in cooking classes to master the art of Thai cuisine. The ancient city of Ayutthaya, a UNESCO World Heritage site, reveals Thailand\'s glorious past through its magnificent ruins.',
      'For beach lovers, the southern islands offer paradisiacal retreats. Phuket combines stunning beaches with vibrant nightlife, while Koh Samui offers a more relaxed atmosphere with luxury resorts. The limestone karsts of Krabi and Phang Nga Bay create dramatic seascapes perfect for kayaking and rock climbing.',
      'Thai food deserves special mention for its complex flavors and regional variations. From the fiery som tam (papaya salad) of the northeast to the rich massaman curry of the south, culinary adventures await at every turn. Food tours and cooking classes allow visitors to take these skills home.',
      'Whether you\'re meditating with monks in a Buddhist temple, dancing the night away at a full moon party, shopping in floating markets, or simply relaxing on a pristine beach, Thailand offers experiences that appeal to all types of travelers.'
    ]
  },
  pt: {
    id: 'pt',
    title: 'Portugal: European Gem by the Atlantic',
    subtitle: 'History, Culture, and Coastal Beauty',
    author: 'Maria Silva',
    date: 'March 12, 2023',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    content: [
      'Portugal, perched on the western edge of Europe, offers travelers a perfect blend of historic charm and natural beauty. From the cobblestone streets of Lisbon to the wine terraces of the Douro Valley, this compact country packs diverse experiences into its borders.',
      'Lisbon, built on seven hills, enchants visitors with its vintage trams, Moorish castle, and fado music clubs. The nearby town of Sintra, with its colorful palaces and mystical gardens, feels like stepping into a fairy tale. Porto, the country\'s second city, invites exploration of its UNESCO-listed riverside district and famed port wine cellars.',
      'Portugal\'s 1,800 kilometers of coastline features some of Europe\'s most stunning beaches. The Algarve region in the south is renowned for its golden cliffs and azure waters, while the wilder Atlantic coast attracts surfers from around the world. The archipelagos of Madeira and the Azores offer volcanic landscapes and marine adventures.',
      'Portuguese cuisine celebrates the bounty of land and sea. Fresh seafood is a staple, particularly bacalhau (salted cod), which is said to have 365 different preparations—one for each day of the year. Pastry lovers shouldn\'t miss the custard tarts (pastéis de nata) that originated in Lisbon\'s Belém district.',
      'For history enthusiasts, Portugal\'s past as a maritime superpower is evident in its grand monuments and global influences. The Monastery of Jerónimos and Belém Tower in Lisbon commemorate the Age of Discoveries, while the well-preserved medieval town of Évora and the ancient university city of Coimbra reveal earlier chapters of Portuguese history.',
      'Whether you\'re sipping vinho verde in a seaside café, hiking the flower-lined levadas of Madeira, exploring traditional villages in the Alentejo, or marveling at azulejo tile art, Portugal offers authentic experiences that combine old-world charm with modern European comfort.'
    ]
  },
  cr: {
    id: 'cr',
    title: 'Costa Rica: Pura Vida Paradise',
    subtitle: 'Eco-Adventures in Central America\'s Green Jewel',
    author: 'Carlos Jiménez',
    date: 'July 8, 2023',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1518756509889-7884b7a89a11?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    content: [
      'Costa Rica, a small Central American country with outsized biodiversity, embodies its national motto "Pura Vida" (pure life) through its commitment to conservation and sustainable tourism. With protected areas covering more than a quarter of its territory, it offers unparalleled opportunities to experience nature up close.',
      'The country\'s diverse ecosystems include misty cloud forests, active volcanoes, lush rainforests, and pristine beaches on both the Pacific and Caribbean coasts. Travelers can spot colorful quetzals in the Monteverde Cloud Forest, watch sea turtles nest in Tortuguero, hike around the perfect cone of Arenal Volcano, or surf the legendary waves of Tamarindo.',
      'Wildlife viewing is exceptional, with opportunities to observe howler monkeys, sloths, toucans, and hundreds of other species in their natural habitats. Guided night walks reveal a different set of creatures, from poison dart frogs to nocturnal birds and fascinating insects.',
      'Adventure seekers will find plenty of adrenaline-pumping activities, from zip-lining through forest canopies to white-water rafting down tropical rivers. For those seeking relaxation, the country\'s numerous hot springs provide natural therapy, while yoga retreats take advantage of serene settings to promote wellness.',
      'Costa Rican cuisine features fresh, simple ingredients with an emphasis on rice, beans, tropical fruits, and fresh seafood. The traditional casado (a plate with rice, beans, plantains, salad, and a protein) offers a satisfying introduction to local flavors, while coffee tours showcase the country\'s premier export.',
      'Whether you\'re watching scarlet macaws fly across a beach at sunset, soaking in hot springs with a view of a volcano, or simply embracing the relaxed pace of life in a hammock, Costa Rica reminds visitors of the joy that comes from connecting with nature and living in the moment.'
    ]
  },
  za: {
    id: 'za',
    title: 'South Africa: Rainbow Nation',
    subtitle: 'Wildlife, Landscapes, and Cultural Diversity',
    author: 'Thabo Mabaso',
    date: 'February 25, 2023',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1484318571209-661cf29a69c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    content: [
      'South Africa, a nation of extraordinary diversity and resilience, offers travelers experiences that range from wildlife safaris to wine tasting, urban exploration to cultural immersion. This "Rainbow Nation" at the southern tip of Africa continues to inspire visitors with its natural beauty and the warmth of its people.',
      'Safari experiences in Kruger National Park and other game reserves provide opportunities to spot the "Big Five" (lion, leopard, rhinoceros, elephant, and Cape buffalo) in their natural habitats. Conservation efforts to protect endangered species like rhinos are an integral part of South Africa\'s commitment to preserving its natural heritage.',
      'Cape Town, consistently rated among the world\'s most beautiful cities, dazzles with its stunning setting between Table Mountain and the Atlantic Ocean. The vibrant V&A Waterfront, historic Robben Island, and the colorful Bo-Kaap neighborhood offer diverse experiences within the city, while the nearby Cape Winelands produce world-class wines in picturesque settings.',
      'For those interested in history and culture, South Africa provides profound insights through sites like the Apartheid Museum in Johannesburg, the Cradle of Humankind (where some of the oldest hominid fossils have been discovered), and living museums that celebrate the traditions of various ethnic groups from Zulu to Ndebele.',
      'Adventure enthusiasts can surf at Jeffreys Bay, hike the Wild Coast or Drakensberg Mountains, dive with sharks in Gansbaai, or bungee jump from Bloukrans Bridge. The Garden Route, a scenic stretch along the southeastern coast, combines forests, lagoons, and charming towns with opportunities for outdoor activities.',
      'Whether you\'re watching the sun set over the Kalahari Desert, tasting wines in Stellenbosch, learning about cultural traditions in a township tour, or standing at the Cape of Good Hope where two oceans meet, South Africa\'s diverse experiences create memories that will last a lifetime.'
    ]
  }
};

const BlogsPage: React.FC = () => {
  const { countryCode } = useParams<{ countryCode: string }>();
  const navigate = useNavigate();
  
  // If no countryCode is provided, show a 404 page or redirect
  if (!countryCode || !blogData[countryCode.toLowerCase()]) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Blog Not Found</h1>
        <p className="text-gray-600 mb-6">The blog you're looking for doesn't exist or has been moved.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  const blog = blogData[countryCode.toLowerCase()];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-teal-700 text-white p-4 mb-8">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="text-xl font-bold flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </header>
      
      <div className="container mx-auto max-w-4xl px-4">
        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="relative h-80 w-full overflow-hidden">
            <img 
              src={blog.image} 
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="p-6 md:p-8">
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{blog.title}</h1>
              <h2 className="text-xl text-gray-600 mb-4">{blog.subtitle}</h2>
              
              <div className="flex items-center text-sm text-gray-500 mb-6">
                <span className="mr-4">{blog.author}</span>
                <span className="mr-4">{blog.date}</span>
                <span>{blog.readTime}</span>
              </div>
            </div>
            
            <div className="prose prose-lg max-w-none">
              {blog.content.map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            
            <div className="border-t border-gray-200 mt-10 pt-6">
              <h3 className="text-lg font-medium mb-4">Interested in visiting?</h3>
              <Link 
                to="/dashboard" 
                className="bg-teal-600 text-white px-6 py-2 rounded-md inline-flex items-center hover:bg-teal-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Check Travel Requirements
              </Link>
            </div>
          </div>
        </article>
        
        <div className="mt-12 mb-16">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Explore Other Destinations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.values(blogData)
              .filter(b => b.id !== countryCode.toLowerCase())
              .slice(0, 3)
              .map(blog => (
                <Link 
                  to={`/blogs/${blog.id}`} 
                  key={blog.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={blog.image} 
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900">{blog.title}</h4>
                    <p className="text-sm text-gray-600 mt-2">{blog.readTime}</p>
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogsPage; 
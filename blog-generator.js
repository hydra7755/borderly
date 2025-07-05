// Script to generate travel blog content for various countries using DeepSeek API
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Get API key from environment variables
const DEEPSEEK_API_KEY = process.env.VITE_DEEPSEEK_API_KEY || 'sk-6383c1c18a8240ea8fa223a78fc10193';

// List of countries to generate blogs for with their codes
const countries = [
  { name: 'Turkey', code: 'TR' },
  { name: 'India', code: 'IN' },
  { name: 'Vietnam', code: 'VN' },
  { name: 'Thailand', code: 'TH' },
  { name: 'Egypt', code: 'EG' },
  { name: 'Sri Lanka', code: 'LK' },
  { name: 'Malaysia', code: 'MY' },
  { name: 'Kenya', code: 'KE' },
  { name: 'Azerbaijan', code: 'AZ' },
  { name: 'Albania', code: 'AL' }
];

// Blog topics for each country (5 per country)
const blogTopics = [
  {
    title: 'Top 10 Must-Visit Destinations',
    category: 'Places',
    tags: ['travel', 'destinations', 'sightseeing', 'attractions']
  },
  {
    title: 'Local Cuisine and Dining Guide',
    category: 'Food',
    tags: ['food', 'cuisine', 'restaurants', 'dining']
  },
  {
    title: 'Cultural Traditions and Etiquette',
    category: 'Culture',
    tags: ['culture', 'traditions', 'customs', 'etiquette']
  },
  {
    title: 'Best Time to Visit and Weather Guide',
    category: 'Travel Tips',
    tags: ['weather', 'seasons', 'travel planning', 'climate']
  },
  {
    title: 'Travel Tips and Practical Information',
    category: 'Travel Tips',
    tags: ['travel tips', 'budget', 'transportation', 'accommodation']
  }
];

// Function to generate blog content using DeepSeek API
async function generateBlogContent(country, topic) {
  const prompt = `Write a 500-word travel blog post about "${topic.title} in ${country.name}". 
  The blog should be informative, engaging, and provide valuable insights for travelers.
  Use the author name "Hydra Travel Team" and avoid mentioning any real person names or specific website references.
  Include a brief introduction (50-80 words that can be used as an excerpt), main content with 3-5 key points, and a conclusion.
  Make it personal as if written by someone who has actually visited the destination.
  Format with appropriate paragraph breaks for readability.`;

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(`Error generating blog for ${country.name} - ${topic.title}:`, error.message);
    return `Error generating content for ${country.name} - ${topic.title}. Please try again later.`;
  }
}

// Function to extract excerpt from content (first paragraph)
function extractExcerpt(content) {
  const firstParagraphMatch = content.match(/^(.+?)(?:\n\n|\n|$)/);
  const firstParagraph = firstParagraphMatch ? firstParagraphMatch[1] : '';
  
  // Remove any title that might be at the beginning of the paragraph
  const noTitleParagraph = firstParagraph.replace(/^#+ .+\n+/, '');
  
  // Limit to roughly 150 characters and add ellipsis if needed
  let excerpt = noTitleParagraph.slice(0, 150);
  if (noTitleParagraph.length > 150) {
    excerpt += '...';
  }
  
  return excerpt.trim();
}

// Function to create a blog post object
function createBlogPostObject(country, topic, content) {
  const id = `${country.code.toLowerCase()}-${topic.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
  const date = new Date();
  const formattedDate = `${date.toLocaleString('en-US', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`;
  const readTimeMinutes = Math.max(3, Math.ceil(content.split(' ').length / 200)); // Approximate reading time
  
  // Extract excerpt from content (first paragraph)
  const excerpt = extractExcerpt(content);
  
  // Create subtitle from topic title
  const subtitle = `Essential Guide to ${topic.title.replace('in', 'for')} ${country.name}`;
  
  return {
    id,
    title: `${topic.title} in ${country.name}`,
    subtitle,
    excerpt,
    author: 'Hydra Travel Team',
    date: formattedDate,
    readTime: `${readTimeMinutes} min read`,
    image: `https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/${country.code.toLowerCase()}_image_1`,
    category: topic.category,
    country: { name: country.name, code: country.code },
    tags: [...topic.tags, `${country.name.toLowerCase()} travel`],
    content: content.split('\n\n') // Split content into paragraphs
  };
}

// Function to save all blog posts to a single JSON file
async function saveBlogPostsToJson(blogPosts) {
  const blogsDir = path.join(process.cwd(), 'src', 'data');
  try {
    await fs.mkdir(blogsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating blogs directory:', error);
  }
  
  const filePath = path.join(blogsDir, 'blogs.json');
  await fs.writeFile(filePath, JSON.stringify(blogPosts, null, 2));
  
  console.log(`All blog posts saved to ${filePath}`);
}

// Main function to generate blogs for all countries and topics
async function generateAllBlogs() {
  console.log('Starting blog generation...');
  
  const allBlogPosts = [];
  let totalGenerated = 0;
  
  for (const country of countries) {
    console.log(`Generating blogs for ${country.name}...`);
    
    for (const topic of blogTopics) {
      console.log(`  - Topic: ${topic.title}`);
      
      try {
        const blogContent = await generateBlogContent(country, topic);
        const blogPost = createBlogPostObject(country, topic, blogContent);
        allBlogPosts.push(blogPost);
        totalGenerated++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing ${country.name} - ${topic.title}:`, error);
      }
    }
    
    console.log(`Completed blogs for ${country.name}`);
    // Add a longer delay between countries
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Save all blog posts to a single JSON file
  await saveBlogPostsToJson(allBlogPosts);
  
  console.log(`Blog generation complete. Generated ${totalGenerated} blog posts.`);
}

// Execute the main function
generateAllBlogs().catch(error => {
  console.error('Error in blog generation process:', error);
}); 
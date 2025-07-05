export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  category: string;
  country: {
    name: string;
    code: string;
  };
  tags: string[];
  content: string[];
} 
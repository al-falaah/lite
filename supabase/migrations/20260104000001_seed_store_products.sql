-- Seed some sample products for the store

-- Books
INSERT INTO store_products (name, slug, description, price_nzd, image_url, category, stock_quantity, is_active)
VALUES
(
  'Tajweed Rules of the Qur''an',
  'tajweed-rules-of-the-quran',
  'Comprehensive guide to Tajweed rules with practical examples and exercises. Perfect for students learning proper Quranic recitation.',
  35.00,
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&auto=format&fit=crop',
  'Books',
  15,
  true
),
(
  'Arabic Grammar Made Easy',
  'arabic-grammar-made-easy',
  'Step-by-step guide to Arabic grammar with clear explanations and practice exercises. Ideal for beginners and intermediate learners.',
  28.50,
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop',
  'Books',
  20,
  true
),
(
  'Stories of the Prophets',
  'stories-of-the-prophets',
  'Authentic narrations of the lives of Allah''s messengers, beautifully illustrated and easy to read for all ages.',
  42.00,
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop',
  'Books',
  12,
  true
),
(
  'Fiqh of Worship',
  'fiqh-of-worship',
  'Detailed explanation of Islamic worship practices including prayer, fasting, and pilgrimage according to authentic sources.',
  32.00,
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop',
  'Books',
  8,
  true
),
(
  'Quran Translation and Tafsir',
  'quran-translation-and-tafsir',
  'Clear English translation with concise commentary explaining the context and meanings of Quranic verses.',
  55.00,
  'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&auto=format&fit=crop',
  'Books',
  10,
  true
);

-- Souvenirs
INSERT INTO store_products (name, slug, description, price_nzd, image_url, category, stock_quantity, is_active)
VALUES
(
  'Islamic Calligraphy Wall Art',
  'islamic-calligraphy-wall-art',
  'Beautiful Arabic calligraphy featuring Quranic verses, perfect for home or office decoration. High-quality print on canvas.',
  45.00,
  'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=800&auto=format&fit=crop',
  'Souvenirs',
  5,
  true
),
(
  'Prayer Mat - Premium Quality',
  'prayer-mat-premium-quality',
  'Soft, comfortable prayer mat with beautiful Islamic designs. Easy to fold and carry for travel.',
  38.00,
  'https://images.unsplash.com/photo-1591604021695-0c69e6b0a7f1?w=800&auto=format&fit=crop',
  'Souvenirs',
  25,
  true
),
(
  'Tasbeeh Counter (Digital)',
  'tasbeeh-counter-digital',
  'Digital tasbeeh counter with LED display. Convenient for keeping track of dhikr.',
  18.50,
  'https://images.unsplash.com/photo-1563218283-3b1b5b102c7a?w=800&auto=format&fit=crop',
  'Souvenirs',
  30,
  true
),
(
  'Islamic Quote Bookmark Set',
  'islamic-quote-bookmark-set',
  'Set of 5 elegant bookmarks featuring inspirational Islamic quotes in Arabic and English. Perfect for students and book lovers.',
  12.00,
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop',
  'Souvenirs',
  50,
  true
),
(
  'Madrasah Tote Bag',
  'madrasah-tote-bag',
  'Eco-friendly cotton tote bag with The FastTrack Madrasah logo. Perfect for carrying books and supplies.',
  22.00,
  'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&auto=format&fit=crop',
  'Souvenirs',
  40,
  true
);

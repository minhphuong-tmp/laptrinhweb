# LinkUp Web App

Ứng dụng web React với tích hợp Supabase, được thiết kế để đồng bộ với mobile app.

## 🚀 Tính năng

- **Authentication**: Đăng nhập/đăng ký với Supabase Auth
- **Posts**: Tạo, xem, like bài viết với real-time updates
- **Chat**: Tin nhắn real-time với direct và group chat
- **Todo**: Quản lý ghi chú cá nhân với database sync
- **Profile**: Quản lý thông tin cá nhân và avatar
- **Real-time**: Cập nhật real-time cho tất cả tính năng

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, React Router
- **Backend**: Supabase (Database, Auth, Storage, Real-time)
- **Styling**: CSS Modules
- **State Management**: React Context API

## 📦 Cài đặt

1. **Clone repository:**
```bash
git clone https://github.com/minhphuong-tmp/laptrinhweb.git
cd web-app
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Tạo file .env.local:**
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Chạy ứng dụng:**
```bash
npm start
```

## 🗄️ Database Schema

### Tables chính:

#### `users`
- `id` (uuid, primary key)
- `email` (text, unique)
- `name` (text)
- `image` (text, avatar URL)
- `bio` (text)
- `created_at` (timestamp)

#### `posts`
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to users)
- `title` (text)
- `content` (text)
- `image` (text, optional)
- `created_at` (timestamp)

#### `post_likes`
- `id` (uuid, primary key)
- `post_id` (uuid, foreign key to posts)
- `user_id` (uuid, foreign key to users)

#### `comments`
- `id` (uuid, primary key)
- `post_id` (uuid, foreign key to posts)
- `user_id` (uuid, foreign key to users)
- `content` (text)
- `created_at` (timestamp)

#### `conversations`
- `id` (uuid, primary key)
- `name` (text, optional for group chats)
- `type` (text: 'direct' or 'group')
- `created_by` (uuid, foreign key to users)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `conversation_members`
- `id` (uuid, primary key)
- `conversation_id` (uuid, foreign key to conversations)
- `user_id` (uuid, foreign key to users)
- `is_admin` (boolean)
- `last_read_at` (timestamp)

#### `messages`
- `id` (uuid, primary key)
- `conversation_id` (uuid, foreign key to conversations)
- `sender_id` (uuid, foreign key to users)
- `content` (text)
- `message_type` (text: 'text', 'image', 'file')
- `file_url` (text, optional)
- `created_at` (timestamp)

#### `todos`
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to users)
- `title` (text)
- `description` (text, optional)
- `priority` (text: 'low', 'medium', 'high')
- `deadline` (timestamp, optional)
- `completed` (boolean)
- `completed_at` (timestamp, optional)
- `created_at` (timestamp)

## 🔌 API Integration cho Mobile App

### Sử dụng API services:

```javascript
import { api } from './services/api';

// Authentication
const loginResult = await api.auth.signIn(email, password);
const signupResult = await api.auth.signUp(email, password, userData);

// Posts
const posts = await api.posts.getPosts(20, 0);
const newPost = await api.posts.createPost(postData);
const likeResult = await api.posts.toggleLike(postId, userId);

// Todos
const todos = await api.todos.getTodos(userId);
const newTodo = await api.todos.createTodo(todoData);
const updateResult = await api.todos.updateTodo(todoId, updates);

// Chat
const conversations = await api.chat.getConversations(userId);
const messages = await api.chat.getMessages(conversationId);
const sendResult = await api.chat.sendMessage(messageData);

// User
const profile = await api.user.getProfile(userId);
const updateProfile = await api.user.updateProfile(userId, profileData);
```

### Real-time subscriptions:

```javascript
import { subscribeToPosts } from './services/postsService';

// Subscribe to posts changes
const unsubscribe = subscribeToPosts((payload) => {
    console.log('Posts updated:', payload);
    // Reload posts or update UI
});

// Cleanup
unsubscribe();
```

## 📱 Mobile App Integration

### 1. **Shared Database**
- Web và mobile app sử dụng cùng Supabase database
- Real-time sync tự động giữa các platform

### 2. **API Consistency**
- Cùng API endpoints cho web và mobile
- Consistent data structure và error handling

### 3. **Authentication**
- Shared user sessions giữa web và mobile
- Single sign-on experience

### 4. **File Storage**
- Shared Supabase Storage cho images và files
- Optimized image loading cho mobile devices

## 🚀 Deployment

### Vercel (Recommended):
```bash
npm install -g vercel
vercel --prod
```

### Netlify:
```bash
npm run build
# Upload dist folder to Netlify
```

### Environment Variables:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## 🔧 Development

### Scripts:
- `npm start` - Development server
- `npm build` - Production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Code Structure:
```
src/
├── components/     # Reusable components
├── pages/         # Page components
├── services/      # API services
├── context/       # React Context providers
├── lib/          # External library configs
└── constants/    # App constants
```

## 🐛 Troubleshooting

### Common Issues:

1. **Supabase Connection Error:**
   - Check environment variables
   - Verify Supabase URL and keys

2. **Real-time Not Working:**
   - Check Supabase real-time settings
   - Verify RLS policies

3. **Image Loading Issues:**
   - Check Supabase Storage buckets
   - Verify file permissions

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

- GitHub Issues: [Create an issue](https://github.com/minhphuong-tmp/laptrinhweb/issues)
- Email: support@linkup.com
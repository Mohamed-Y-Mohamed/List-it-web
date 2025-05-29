# 📝 List It - Smart Task Management Application

A modern, feature-rich task management application built with Next.js that helps you organize your tasks, notes, and projects efficiently.

![List It Preview](app-icon.jpeg)

## 🚀 Live Demo

**Try List It now:** [https://list-it-dom.netlify.app/landingpage](https://list-it-dom.netlify.app/landingpage)

Experience the full functionality of List It with our live demo. Create an account or sign in with Google to start organizing your tasks and notes immediately!

### Demo Features
- 🎯 **Full Functionality**: All features are available in the demo
- 🔐 **Secure Authentication**: Real Google OAuth and email registration
- 💾 **Persistent Data**: Your lists, tasks, and notes are saved
- 📱 **Mobile Responsive**: Test on any device
- ⚡ **Real-time Updates**: Experience instant synchronization

### Quick Start Guide
1. Visit the [demo link](https://list-it-dom.netlify.app/landingpage)
2. Click "Get Started Free" or "Sign up with Google"
3. Create your first list from the sidebar
4. Add tasks and notes to the default "General" collection
5. Explore different views: Today, Tomorrow, Priority, Completed
6. Check out the Dashboard for productivity insights

## ✨ Features

### 🎯 Core Functionality
- **Smart Lists**: Create multiple lists to organize different projects or areas of your life
- **Collections**: Group related tasks and notes within lists using customizable color-coded collections
- **Task Management**: Create, prioritize, complete, and track tasks with due dates and descriptions
- **Note Taking**: Rich note-taking with color customization and pinning capabilities
- **Dashboard Analytics**: Track your productivity with interactive charts and statistics

### 🗂️ Smart Views
- **Today's Tasks**: Focus on tasks due today
- **Tomorrow's Planning**: Prepare for upcoming tasks
- **Priority Tasks**: Starred/pinned high-priority items
- **Overdue Tasks**: Never miss important deadlines
- **Completed Tasks**: Review your accomplishments
- **Active Tasks**: View all incomplete tasks organized by due date

### 🎨 User Experience
- **Dark/Light Theme**: Seamless theme switching
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion powered interactions
- **Intuitive Navigation**: Clean sidebar with easy list management
- **Real-time Updates**: Instant synchronization across devices

### 🔐 Authentication & Security
- **Google OAuth**: Quick sign-in with Google
- **Email/Password**: Traditional authentication option
- **Email Verification**: Secure account creation process
- **Session Management**: Persistent login across browser sessions

## 🛠️ Technology Stack

### Frontend
- **Next.js 13+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icons

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Authentication & user management

### State Management
- **React Context** - Global state management
- **React Hooks** - Local component state

## 🏗️ Project Structure

```
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/               
│   │   ├── register/            
│   │   └── auth/callback/       # OAuth callback handler
│   ├── List/[listId]/           # Dynamic list pages
│   ├── dashboard/               # Analytics dashboard
│   ├── today/                   # Today's tasks view
│   ├── tomorrow/                # Tomorrow's tasks view
│   ├── priority/                # Priority tasks view
│   ├── overdue/                 # Overdue tasks view
│   ├── completed/               # Completed tasks view
│   ├── notcomplete/             # Active tasks view
│   └── landingpage/             # Marketing landing page
├── components/                   # Reusable components
│   ├── Collection/              # Collection management
│   ├── Tasks/                   # Task components
│   ├── Notes/                   # Note components
│   ├── popupModels/             # Modal dialogs
│   └── SideNav.tsx              # Main navigation
├── context/                     # React Context providers
│   ├── AuthContext.tsx          # Authentication state
│   └── ThemeContext.tsx         # Theme management
├── types/                       # TypeScript definitions
├── utils/                       # Utility functions
└── public/                      # Static assets
```

## 🎯 How It Works

### 📋 List Management
1. **Create Lists**: Click the "Create New List" button in the sidebar
2. **Dynamic Routing**: Each list gets its own URL (`/List/[listId]`)
3. **Default Collection**: Every new list automatically gets a "General" collection
4. **List Actions**: Pin, rename, or delete lists from the sidebar

### 🗂️ Collection System
- **Dual Organization**: Each collection contains both tasks and notes
- **Color Coding**: Customize collection colors for visual organization
- **Tab Interface**: Switch between tasks and notes views
- **Default Collection**: "General" collection cannot be deleted (only when list is deleted)

### ✅ Task Features
- **Rich Tasks**: Title, description, due date, priority status
- **Priority System**: Pin important tasks to the top
- **Due Date Tracking**: Smart categorization by due date
- **Completion Tracking**: Mark tasks as complete with timestamp
- **Cross-Collection**: Move tasks between collections

### 📝 Note Features
- **Color Customization**: Choose from multiple background colors
- **Pin System**: Keep important notes at the top
- **Rich Text**: Title and description support
- **Quick Edit**: Click to open detailed editing sidebar

### 📊 Dashboard Analytics
- **Task Statistics**: Total, completed, pending, and overdue counts
- **Progress Charts**: Visual representation of productivity
- **Recent Activity**: Timeline of completed and created tasks
- **Completion Trends**: 7-day activity charts

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/list-it.git
cd list-it
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Database Setup**
- Create a new Supabase project
- Run the SQL schema (create tables for users, lists, collections, tasks, notes)
- Enable Row Level Security (RLS) policies
- Configure Google OAuth in Supabase Auth settings

5. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📱 Database Schema

### Core Tables
- **users** - User profiles and preferences
- **list** - User-created lists with names and colors
- **collection** - Themed collections within lists
- **task** - Individual tasks with metadata
- **note** - Rich notes with color customization

### Key Relationships
- Users → Lists (1:many)
- Lists → Collections (1:many) 
- Collections → Tasks (1:many)
- Collections → Notes (1:many)

## 🎨 Design System

### Color Themes
- **Light Mode**: Clean whites and grays with colorful accents
- **Dark Mode**: Rich dark grays with warm orange accents
- **Collection Colors**: Customizable color coding for organization

### Typography
- **Headings**: Bold, clean sans-serif
- **Body Text**: Readable font weights with proper line height
- **Code**: Monospace for technical elements

### Animations
- **Page Transitions**: Smooth enter/exit animations
- **Hover Effects**: Subtle scale and color changes
- **Loading States**: Skeleton screens and spinners
- **Gesture Feedback**: Tap and swipe animations

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Add build command `npm run build`
- **Railway**: Configure environment variables
- **Self-hosted**: Build with `npm run build` and serve the `out` folder

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - For providing an excellent backend-as-a-service
- **Vercel** - For Next.js and deployment platform
- **Tailwind CSS** - For the utility-first CSS framework
- **Framer Motion** - For beautiful animations
- **Lucide** - For the icon library

## 📞 Support

If you have any questions or run into issues, please:
1. Check the [Issues](https://github.com/yourusername/list-it/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

---

**Made with ❤️ by [Your Name]**

*Transform your productivity with smart task management.*

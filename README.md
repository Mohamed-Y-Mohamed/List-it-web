# 📝 List It - Organise Everything!

A modern cross-platform, feature-rich task & note management in ONE application built with Next.js that helps you organize yourself.

---

## 🌐 Website

### Our platform is free for all users here:
- [Website](https://list-it-dom.netlify.app/landingpage)
- [iOS](https://apps.apple.com/gb/app/list-it-organise-everything/id6746731233)

---

### Application Features
- 🔐 **Secure Authentication**: Real Google OAuth and email registration
- 💾 **Persistent Data**: Your lists, collection, tasks, and notes are saved available cross-platform
- ⚡ **Real-time Updates**: Experience instant synchronization

---

## ✨ Features

### 🎯 Core Functionality
- **Smart Lists**: Create multiple `Lists` to organize different areas of your life
- **Collections**: Group related `tasks` & `notes` within color codded `Collections` 
- **Task Management**: Create, prioritize, track and complete tasks with due dates and descriptions
- **Note Taking**: Rich note taking with color customization and pinning capabilities
- **Dashboard Analytics**: Track your productivity with interactive charts and statistics

### 🗂️ Smart Views
- **Today's Tasks**: Focus on tasks due today
- **Tomorrow's Planning**: Prepare for upcoming tasks
- **Priority Tasks**: Starred/pinned high-priority items
- **Overdue Tasks**: Instantly see what you need to catch up on
- **Completed Tasks**: Review your accomplishments
- **Active Tasks**: View all incomplete tasks organized by due date

### 🎨 User Experience
- **Dark/Light Theme**: Seamless theme switching
- **Responsive Design**: Designed for all displays
- **Smooth Animations**: Framer Motion powered interactions
- **Intuitive Navigation**: Clean sidebar with easy list management
- **Real-time Updates**: Instant synchronization across devices

### 🔐 Authentication & Security
- **Google OAuth**: Quick sign-in with Google
- **Email/Password**: Traditional authentication option
- **Email Verification**: Secure account creation process
- **Session Management**: Persistent login across browser sessions

---

## 🛠️ Technology Stack

### Website
- **Next.js 13+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icons

### iOS Native
- **Swift** - Used for application logic, async networking, and integration with the backend `(Supabase)`
- - **SwiftUI** - Apple’s declarative UI framework used to build responsive and modern interfaces

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Authentication & user management

### State Management
- **React Context** - Global state management
- **React Hooks** - Local component state

---

## 🎯 How It Works

### 📋 List Management
- **Create Lists**: Click the "Create New List" button in the sidebar
- **Dynamic Routing**: Each list gets its own URL (`/List/[listId]`)
- **Default Collection**: Every new list automatically gets a "General" collection
- **List Actions**: Pin, rename, or delete lists from the sidebar

### 🗂️ Collection System
- **Dual Organization**: Each `collection` contains both `tasks` and `notes`
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

---

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

---

**Made by [@Mohamed](https://github.com/Mohamed-Y-Mohamed) & [@Abdul](https://github.com/A-Moiz)**

*Transform your productivity with List It.*

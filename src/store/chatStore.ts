import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message } from '../lib/openrouter';

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  isCollapsed?: boolean;
}

interface ChatState {
  chats: Chat[];
  folders: Folder[];
  activeChat: string | null;
  createChat: (model: string) => string;
  updateChat: (id: string, updates: Partial<Chat>) => void;
  deleteChat: (id: string) => void;
  createFolder: (name: string) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  setActiveChat: (id: string | null) => void;
  addMessageToChat: (chatId: string, message: Message) => void;
  moveChat: (chatId: string, folderId: string | null) => void;
  reorderChats: (folderId: string | null, chatId: string, newIndex: number) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      folders: [],
      activeChat: null,
      createChat: (model) => {
        const id = crypto.randomUUID();
        const chats = get().chats;
        const maxOrder = Math.max(0, ...chats.map(chat => chat.order));
        
        const newChat: Chat = {
          id,
          title: 'New Chat',
          messages: [],
          model,
          folderId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: maxOrder + 1,
        };
        
        set((state) => ({
          chats: [newChat, ...state.chats],
          activeChat: id,
        }));
        return id;
      },
      updateChat: (id, updates) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === id
              ? { ...chat, ...updates, updatedAt: new Date().toISOString() }
              : chat
          ),
        }));
      },
      deleteChat: (id) => {
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== id),
          activeChat: state.activeChat === id ? null : state.activeChat,
        }));
      },
      createFolder: (name) => {
        const newFolder: Folder = {
          id: crypto.randomUUID(),
          name,
          createdAt: new Date().toISOString(),
          isCollapsed: false,
        };
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
      },
      updateFolder: (id, updates) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id ? { ...folder, ...updates } : folder
          ),
        }));
      },
      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
          chats: state.chats.map((chat) =>
            chat.folderId === id ? { ...chat, folderId: null } : chat
          ),
        }));
      },
      setActiveChat: (id) => {
        set({ activeChat: id });
      },
      addMessageToChat: (chatId, message) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, message],
                  updatedAt: new Date().toISOString(),
                  title:
                    chat.messages.length === 0 && message.role === 'user'
                      ? message.content.slice(0, 30) + '...'
                      : chat.title,
                }
              : chat
          ),
        }));
      },
      moveChat: (chatId, folderId) => {
        const chats = get().chats;
        const targetChats = chats.filter(c => c.folderId === folderId);
        const maxOrder = Math.max(0, ...targetChats.map(chat => chat.order));
        
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, folderId, order: maxOrder + 1 } : chat
          ),
        }));
      },
      reorderChats: (folderId, chatId, newIndex) => {
        const chats = get().chats;
        const folderChats = chats
          .filter(chat => chat.folderId === folderId)
          .sort((a, b) => a.order - b.order);
        
        const chatToMove = chats.find(chat => chat.id === chatId);
        if (!chatToMove) return;

        // Remove chat from current position
        const updatedFolderChats = folderChats.filter(chat => chat.id !== chatId);
        
        // Insert chat at new position
        updatedFolderChats.splice(newIndex, 0, chatToMove);
        
        // Update orders
        const updatedChats = chats.map(chat => {
          if (chat.folderId !== folderId) return chat;
          const index = updatedFolderChats.findIndex(c => c.id === chat.id);
          return index === -1 ? chat : { ...chat, order: index };
        });
        
        set({ chats: updatedChats });
      },
    }),
    {
      name: 'chat-storage',
    }
  )
);
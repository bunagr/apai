import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Plus,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Bot,
  LogOut,
  User,
  ChevronDown,
  Folder,
  MessageSquare,
  Trash2,
  FolderPlus,
  ChevronRight,
  GripVertical,
  Pencil,
  Check,
  X,
  Menu,
  CheckCircle2,
  PanelLeftClose,
  PanelLeft,
  Zap,
  Brain,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useChatStore, Chat, Folder as FolderType } from '../store/chatStore';
import { sendMessage, Message, AVAILABLE_MODELS } from '../lib/ai-providers';
import { uploadFile } from '../lib/supabase';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface SortableChatItemProps {
  chat: Chat;
  activeChat: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  isDragging?: boolean;
}

function SortableChatItem({ chat, activeChat, onSelect, onDelete, onRename, isDragging }: SortableChatItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: chat.id });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition,
  } : undefined;

  const model = AVAILABLE_MODELS.find(m => m.id === chat.model);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
        activeChat === chat.id
          ? 'bg-white bg-opacity-10 text-white'
          : 'hover:bg-zinc-800 text-zinc-300'
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => onSelect(chat.id)}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 hover:bg-zinc-700 rounded"
      >
        <GripVertical className="h-4 w-4 text-zinc-400" />
      </button>
      {model?.provider === 'aiml' ? (
        <Brain className="h-4 w-4 text-blue-400" />
      ) : (
        <Zap className="h-4 w-4 text-purple-400" />
      )}
      <span className="flex-1 truncate text-left">{chat.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(chat.id);
        }}
        className="opacity-0 group-hover:opacity-100 hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

interface DroppableFolderProps {
  folder: FolderType;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onToggleCollapse: (id: string) => void;
  children: React.ReactNode;
}

function DroppableFolder({ folder, onDelete, onRename, onToggleCollapse, children }: DroppableFolderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', id: folder.id },
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = () => {
    if (editName.trim()) {
      onRename(folder.id, editName.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(folder.name);
      setIsEditing(false);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className={`space-y-1 ${isOver ? 'bg-zinc-800 rounded-lg' : ''}`}
    >
      <div className="group flex items-center gap-2 px-2 py-1 text-zinc-300 hover:bg-zinc-800 rounded-lg cursor-pointer">
        <button
          onClick={() => onToggleCollapse(folder.id)}
          className="p-1 hover:bg-zinc-700 rounded"
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${folder.isCollapsed ? '' : 'rotate-90'}`} />
        </button>
        <Folder className="h-4 w-4" />
        {isEditing ? (
          <div className="flex-1 flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-zinc-800 text-white px-2 py-0.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-white"
            />
            <button
              onClick={handleRename}
              className="p-1 hover:bg-zinc-700 rounded text-green-400"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setEditName(folder.name);
                setIsEditing(false);
              }}
              className="p-1 hover:bg-zinc-700 rounded text-red-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm">{folder.name}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-zinc-700 rounded"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(folder.id)}
                className="p-1 hover:bg-zinc-700 rounded text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
      {!folder.isCollapsed && (
        <div className="pl-9 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

export function ChatInterface() {
  const [message, setMessage] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'openrouter' | 'aiml'>('openrouter');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user, signOut } = useAuthStore();
  const { selectedModel, setSelectedModel } = useSettingsStore();
  const {
    chats,
    folders,
    activeChat,
    createChat,
    createFolder,
    updateFolder,
    deleteChat,
    deleteFolder,
    setActiveChat,
    addMessageToChat,
    moveChat,
    reorderChats,
  } = useChatStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeMessages = activeChat
    ? chats.find((chat) => chat.id === activeChat)?.messages || []
    : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  const handleNewChat = () => {
    createChat(selectedModel);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;

    const newMessage: Message = { role: 'user', content: message };
    addMessageToChat(activeChat, newMessage);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessage([...activeMessages, newMessage], selectedModel);
      addMessageToChat(activeChat, response);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const handleRenameFolder = (id: string, newName: string) => {
    updateFolder(id, { name: newName });
  };

  const handleRenameChat = (id: string, newName: string) => {
    // Implementation for renaming chat
  };

  const handleToggleCollapse = (id: string) => {
    const folder = folders.find(f => f.id === id);
    if (folder) {
      updateFolder(id, { isCollapsed: !folder.isCollapsed });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeChat) return;

    try {
      const publicUrl = await uploadFile(file, user.id);
      const newMessage: Message = {
        role: 'user',
        content: `[Attachment: ${file.name}](${publicUrl})`,
      };
      addMessageToChat(activeChat, newMessage);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    if (activeId === overId) return;

    if (overId.startsWith('folder-')) {
      const folderId = overId.replace('folder-', '');
      moveChat(activeId, folderId);
    } else {
      const activeChat = chats.find(chat => chat.id === activeId);
      if (!activeChat) return;

      const folderChats = chats
        .filter(chat => chat.folderId === activeChat.folderId)
        .sort((a, b) => a.order - b.order);
      
      const newIndex = folderChats.findIndex(chat => chat.id === overId);
      if (newIndex !== -1) {
        reorderChats(activeChat.folderId, activeId, newIndex);
      }
    }
  };

  const filteredModels = AVAILABLE_MODELS.filter(model => model.provider === selectedProvider);

  const renderChatList = (chats: Chat[], folderId: string | null = null) => {
    const filteredChats = chats
      .filter((chat) => chat.folderId === folderId)
      .sort((a, b) => a.order - b.order);

    return (
      <SortableContext items={filteredChats.map(chat => chat.id)} strategy={verticalListSortingStrategy}>
        {filteredChats.map((chat) => (
          <SortableChatItem
            key={chat.id}
            chat={chat}
            activeChat={activeChat}
            onSelect={setActiveChat}
            onDelete={deleteChat}
            onRename={handleRenameChat}
            isDragging={chat.id === activeDragId}
          />
        ))}
      </SortableContext>
    );
  };

  const draggedChat = activeDragId ? chats.find(chat => chat.id === activeDragId) : null;

  return (
    <div className="flex h-screen bg-black text-zinc-100">
      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed md:hidden z-30 top-4 left-4 p-2 bg-zinc-800 rounded-lg"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-20 h-screen transition-all duration-500 ease-out transform ${
          isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 md:w-16 -translate-x-full md:translate-x-0'
        } bg-zinc-900 border-r border-zinc-800`}
      >
        <div className={`h-full transition-all duration-500 ease-out transform ${
          isSidebarOpen ? 'w-72 opacity-100' : 'w-0 md:w-16 opacity-0 md:opacity-100'
        } overflow-hidden`}>
          <div className="h-full flex flex-col p-4">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 px-4 rounded-lg hover:bg-zinc-200 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              New Chat
            </button>

            <div className="mt-8">
              <div className="flex items-center gap-2 px-2 mb-4">
                <Bot className="h-5 w-5 text-white" />
                <h3 className="text-sm font-medium text-white">AI Models</h3>
              </div>

              {/* Provider Selection */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSelectedProvider('openrouter')}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    selectedProvider === 'openrouter'
                      ? 'bg-purple-500 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  OpenRouter
                </button>
                <button
                  onClick={() => setSelectedProvider('aiml')}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    selectedProvider === 'aiml'
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <Brain className="h-4 w-4" />
                  AIML
                </button>
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                {filteredModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedModel === model.id
                        ? 'bg-white bg-opacity-10 text-white'
                        : 'hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800">
                        {model.pricing}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{model.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex-1 overflow-y-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-1">
                  {folders.map((folder) => (
                    <DroppableFolder
                      key={folder.id}
                      folder={folder}
                      onDelete={deleteFolder}
                      onRename={handleRenameFolder}
                      onToggleCollapse={handleToggleCollapse}
                    >
                      {renderChatList(chats, folder.id)}
                    </DroppableFolder>
                  ))}
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-zinc-400 px-2 mb-2">
                    Recent Chats
                  </h3>
                  <div className="space-y-1">{renderChatList(chats, null)}</div>
                </div>

                <DragOverlay>
                  {draggedChat && (
                    <SortableChatItem
                      chat={draggedChat}
                      activeChat={activeChat}
                      onSelect={setActiveChat}
                      onDelete={deleteChat}
                      onRename={handleRenameChat}
                      isDragging={true}
                    />
                  )}
                </DragOverlay>
              </DndContext>
            </div>

            {/* Profile Menu */}
            <div className="mt-4 relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white truncate">
                    {user?.email}
                  </div>
                  <div className="text-sm text-zinc-400">View Profile</div>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 overflow-hidden">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-zinc-700 text-red-400 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">
              {activeChat
                ? chats.find((chat) => chat.id === activeChat)?.title
                : 'Select a chat'}
            </h1>
            {activeChat && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-white bg-opacity-10 text-white text-sm">
                  {AVAILABLE_MODELS.find(
                    (m) =>
                      m.id ===
                      chats.find((chat) => chat.id === activeChat)?.model
                  )?.name}
                </span>
                {AVAILABLE_MODELS.find(
                  (m) =>
                    m.id ===
                    chats.find((chat) => chat.id === activeChat)?.model
                )?.provider === 'aiml' ? (
                  <Brain className="h-4 w-4 text-blue-400" />
                ) : (
                  <Zap className="h-4 w-4 text-purple-400" />
                )}
              </div>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-100'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-zinc-200 rounded">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className="p-1 hover:bg-zinc-200 rounded">
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button className="p-1 hover:bg-zinc-200 rounded">
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-800 p-4 bg-zinc-900">
          {activeChat ? (
            <form onSubmit={handleSend} className="flex gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 bg-zinc-800 text-white border-none rounded-lg px-4 py-2 focus:ring-2 focus:ring-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-white text-black p-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          ) : (
            <div className="text-center py-4 text-zinc-400">
              Select a chat or create a new one to start messaging
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
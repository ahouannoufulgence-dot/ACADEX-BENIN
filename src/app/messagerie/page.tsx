
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Send, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Plus, 
  User,
  CheckCheck,
  Clock,
  ChevronLeft
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useMemo, useEffect, useRef } from "react"
import { useUser, useFirestore, useCollection } from "@/firebase/index"
import { collection, addDoc, query, where, orderBy, serverTimestamp, doc, updateDoc, setDoc } from "firebase/firestore"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

export default function MessagingPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messageText, setMessageText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch conversations where user is a participant
  const conversationsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageTime", "desc")
    )
  }, [db, user])

  const { data: conversations, loading: loadingConvs } = useCollection(conversationsQuery)

  // Fetch messages for selected conversation
  const messagesQuery = useMemo(() => {
    if (!db || !selectedChat) return null
    return query(
      collection(db, "conversations", selectedChat.id, "messages"),
      orderBy("timestamp", "asc")
    )
  }, [db, selectedChat])

  const { data: messages } = useCollection(messagesQuery)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedChat || !user || !db) return

    const text = messageText
    setMessageText("")

    const messageData = {
      senderId: user.uid,
      senderName: user.displayName || "Moi",
      text,
      timestamp: serverTimestamp()
    }

    // Add message
    addDoc(collection(db, "conversations", selectedChat.id, "messages"), messageData)
      .catch(async () => {
        const error = new FirestorePermissionError({
          path: `conversations/${selectedChat.id}/messages`,
          operation: 'create',
          requestResourceData: messageData
        })
        errorEmitter.emit('permission-error', error)
      })

    // Update conversation last message
    updateDoc(doc(db, "conversations", selectedChat.id), {
      lastMessage: text,
      lastMessageTime: serverTimestamp()
    })
  }

  const filteredConversations = useMemo(() => {
    if (!conversations) return []
    return conversations.filter(c => 
      c.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.includes(searchTerm)
    )
  }, [conversations, searchTerm])

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-12rem)] flex gap-6 animate-in fade-in duration-700">
        
        {/* Conversations List Sidebar */}
        <Card className="w-full md:w-96 border-none shadow-sm bg-white rounded-[2.5rem] flex flex-col overflow-hidden">
          <div className="p-8 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">Discussions</h2>
              <Button size="icon" className="rounded-xl bg-primary hover:bg-primary/90">
                <Plus className="size-5" />
              </Button>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Chercher une discussion..." 
                className="pl-12 h-12 bg-muted/50 border-none rounded-2xl font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {loadingConvs ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse font-bold">Chargement...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-4">
                <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <User className="size-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground italic">Aucune discussion trouvée.</p>
              </div>
            ) : (
              filteredConversations.map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all ${selectedChat?.id === chat.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-muted/50'}`}
                >
                  <div className="relative">
                    <Avatar className="size-14 border-2 border-white shadow-sm">
                      <AvatarImage src={`https://picsum.photos/seed/${chat.id}/100/100`} />
                      <AvatarFallback className={selectedChat?.id === chat.id ? "text-primary bg-white" : ""}> {chat.id[0]} </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 size-4 border-2 border-white rounded-full ${chat.unreadCount?.[user?.uid || ''] > 0 ? 'bg-destructive' : 'bg-emerald-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-black truncate"> Discussion {chat.id.substring(0, 8)} </h4>
                      <span className={`text-[10px] font-bold ${selectedChat?.id === chat.id ? 'text-white/70' : 'text-muted-foreground'}`}> 12:45 </span>
                    </div>
                    <p className={`text-xs truncate font-medium ${selectedChat?.id === chat.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {chat.lastMessage || "Aucun message"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Chat Window */}
        <Card className="flex-1 border-none shadow-sm bg-white rounded-[2.5rem] flex flex-col overflow-hidden relative">
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/5">
              <div className="size-24 bg-white rounded-[2rem] flex items-center justify-center shadow-sm mb-6">
                <Send className="size-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-2">Sélectionnez une discussion</h3>
              <p className="text-muted-foreground font-medium max-w-sm">
                Choisissez un contact à gauche pour commencer à échanger en toute sécurité.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-6 px-10 border-b flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-5">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-xl" onClick={() => setSelectedChat(null)}>
                    <ChevronLeft className="size-6" />
                  </Button>
                  <Avatar className="size-12 border-2 border-primary/10">
                    <AvatarImage src={`https://picsum.photos/seed/${selectedChat.id}/100/100`} />
                    <AvatarFallback> {selectedChat.id[0]} </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-black text-foreground"> Discussion {selectedChat.id.substring(0, 8)} </h3>
                    <div className="flex items-center gap-2">
                      <div className="size-2 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">En ligne</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="rounded-xl"> <Search className="size-5" /> </Button>
                  <Button variant="ghost" size="icon" className="rounded-xl"> <MoreVertical className="size-5" /> </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-10 space-y-6 bg-muted/5 scroll-smooth"
              >
                {messages?.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] space-y-2 ${msg.senderId === user?.uid ? 'items-end' : 'items-start'}`}>
                      <div className={`p-5 rounded-[2rem] text-sm font-medium shadow-sm leading-relaxed ${
                        msg.senderId === user?.uid 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white text-foreground rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-2 px-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase">
                          {msg.senderName} • 12:45
                        </span>
                        {msg.senderId === user?.uid && <CheckCheck className="size-3 text-primary" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-8 pt-4 bg-white border-t">
                <form 
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-4 bg-muted/30 p-2 pl-6 rounded-[2rem] border border-transparent focus-within:border-primary/20 transition-all"
                >
                  <Button type="button" variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors">
                    <Paperclip className="size-5" />
                  </Button>
                  <Input 
                    placeholder="Écrivez votre message ici..." 
                    className="flex-1 bg-transparent border-none shadow-none h-12 font-bold placeholder:text-muted-foreground/60 focus-visible:ring-0"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors">
                    <Smile className="size-5" />
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!messageText.trim()}
                    className="bg-primary hover:bg-primary/90 text-white size-12 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
                  >
                    <Send className="size-5" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>

      </div>
    </DashboardLayout>
  )
}

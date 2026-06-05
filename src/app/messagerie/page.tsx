
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
  ChevronLeft,
  Loader2,
  MessageCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useMemo, useEffect, useRef } from "react"
import { useUser, useFirestore, useCollection } from "@/firebase/index"
import { collection, addDoc, query, where, orderBy, serverTimestamp, doc, updateDoc, setDoc, limit } from "firebase/firestore"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { toast } from "@/hooks/use-toast"

export default function MessagingPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messageText, setMessageText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Récupérer les conversations où l'utilisateur est participant
  const conversationsQuery = useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageTime", "desc"),
      limit(20)
    )
  }, [db, user])

  const { data: conversations, loading: loadingConvs } = useCollection(conversationsQuery)

  // 2. Récupérer les messages de la conversation sélectionnée
  const messagesQuery = useMemo(() => {
    if (!db || !selectedChat) return null
    return query(
      collection(db, "conversations", selectedChat.id, "messages"),
      orderBy("timestamp", "asc"),
      limit(50)
    )
  }, [db, selectedChat])

  const { data: messages, loading: loadingMsgs } = useCollection(messagesQuery)

  // Auto-scroll vers le bas lors de l'arrivée de nouveaux messages
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
      senderName: user.displayName || localStorage.getItem('acadex_user_name') || "Utilisateur",
      text,
      timestamp: serverTimestamp()
    }

    // Ajout du message dans la sous-collection
    addDoc(collection(db, "conversations", selectedChat.id, "messages"), messageData)
      .catch(async () => {
        const error = new FirestorePermissionError({
          path: `conversations/${selectedChat.id}/messages`,
          operation: 'create',
          requestResourceData: messageData
        })
        errorEmitter.emit('permission-error', error)
      })

    // Mise à jour du résumé de la conversation
    updateDoc(doc(db, "conversations", selectedChat.id), {
      lastMessage: text,
      lastMessageTime: serverTimestamp()
    })
  }

  const filteredConversations = useMemo(() => {
    if (!conversations) return []
    return conversations.filter(c => 
      (c.lastMessage?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.id.toLowerCase()).includes(searchTerm.toLowerCase())
    )
  }, [conversations, searchTerm])

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-14rem)] flex gap-6 animate-in fade-in duration-500">
        
        {/* Barre latérale : Liste des discussions */}
        <Card className="hidden md:flex w-96 border-none shadow-sm bg-white rounded-[2.5rem] flex-col overflow-hidden">
          <div className="p-8 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight">Messagerie</h2>
              <Button size="icon" variant="ghost" className="rounded-2xl bg-muted/50 hover:bg-primary hover:text-white transition-all">
                <Plus className="size-5" />
              </Button>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Rechercher un contact..." 
                className="pl-12 h-12 bg-muted/30 border-none rounded-2xl font-bold placeholder:text-muted-foreground/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 no-scrollbar">
            {loadingConvs ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest">Chargement...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-4">
                <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="size-8 text-muted-foreground opacity-20" />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aucune discussion</p>
              </div>
            ) : (
              filteredConversations.map((chat: any) => (
                <div 
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all duration-300 ${selectedChat?.id === chat.id ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'hover:bg-muted/50'}`}
                >
                  <div className="relative">
                    <Avatar className="size-14 border-4 border-white shadow-sm">
                      <AvatarImage src={`https://picsum.photos/seed/${chat.id}/100/100`} />
                      <AvatarFallback className={selectedChat?.id === chat.id ? "text-primary bg-white font-black" : "bg-primary/10 text-primary font-black"}> 
                        {chat.id[0]} 
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 size-4 border-4 border-white rounded-full ${chat.unreadCount?.[user?.uid || ''] > 0 ? 'bg-destructive animate-pulse' : 'bg-emerald-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-black truncate text-sm"> Discussion Acadex </h4>
                      <span className={`text-[10px] font-black ${selectedChat?.id === chat.id ? 'text-white/60' : 'text-muted-foreground'}`}>
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <p className={`text-xs truncate font-medium ${selectedChat?.id === chat.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {chat.lastMessage || "Démarrez l'échange..."}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Fenêtre de Chat principale */}
        <Card className="flex-1 border-none shadow-sm bg-white rounded-[2.5rem] flex flex-col overflow-hidden relative">
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/5">
              <div className="size-28 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl mb-8 group hover:rotate-12 transition-transform duration-500">
                <Send className="size-12 text-primary" />
              </div>
              <h3 className="text-3xl font-black text-foreground mb-3 tracking-tight">Espace de Communication</h3>
              <p className="text-muted-foreground font-medium max-w-sm leading-relaxed">
                Échangez en temps réel avec les enseignants, l'administration ou les parents dans un environnement 100% sécurisé.
              </p>
              <Button className="mt-8 bg-primary rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20">
                Démarrer une discussion
              </Button>
            </div>
          ) : (
            <>
              {/* Entête du Chat */}
              <div className="p-6 px-10 border-b flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-5">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-xl" onClick={() => setSelectedChat(null)}>
                    <ChevronLeft className="size-6" />
                  </Button>
                  <Avatar className="size-12 border-2 border-primary/10 shadow-sm">
                    <AvatarImage src={`https://picsum.photos/seed/${selectedChat.id}/100/100`} />
                    <AvatarFallback className="bg-primary text-white font-black"> {selectedChat.id[0]} </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-black text-foreground tracking-tight"> Groupe de Discussion </h3>
                    <div className="flex items-center gap-2">
                      <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Canal Sécurisé</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/50"> <Search className="size-5 text-muted-foreground" /> </Button>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/50"> <MoreVertical className="size-5 text-muted-foreground" /> </Button>
                </div>
              </div>

              {/* Zone des Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-10 space-y-6 bg-[#F8FAFC]/50 scroll-smooth no-scrollbar"
              >
                {loadingMsgs ? (
                  <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary opacity-20" /></div>
                ) : messages?.length === 0 ? (
                  <div className="text-center py-20 italic text-muted-foreground font-medium">Aucun message dans cette discussion. Soyez le premier !</div>
                ) : (
                  messages?.map((msg: any) => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                    >
                      <div className={`max-w-[75%] space-y-2 ${msg.senderId === user?.uid ? 'items-end' : 'items-start'}`}>
                        <div className={`p-5 rounded-[2rem] text-sm md:text-base font-medium shadow-sm leading-relaxed transition-all ${
                          msg.senderId === user?.uid 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white text-foreground rounded-tl-none border border-muted/30'
                        }`}>
                          {msg.text}
                        </div>
                        <div className="flex items-center gap-2 px-4">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                            {msg.senderName} • {formatTime(msg.timestamp)}
                          </span>
                          {msg.senderId === user?.uid && <CheckCheck className="size-3 text-primary" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Zone de Saisie */}
              <div className="p-8 pt-4 bg-white border-t border-muted/20">
                <form 
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-4 bg-muted/30 p-2 pl-6 rounded-[2.5rem] border-2 border-transparent focus-within:border-primary/10 focus-within:bg-white transition-all shadow-inner"
                >
                  <Button type="button" variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors">
                    <Paperclip className="size-5" />
                  </Button>
                  <Input 
                    placeholder="Tapez votre message..." 
                    className="flex-1 bg-transparent border-none shadow-none h-12 font-bold placeholder:text-muted-foreground/40 focus-visible:ring-0 text-base"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors">
                    <Smile className="size-5" />
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!messageText.trim()}
                    className="bg-primary hover:bg-primary/90 text-white size-12 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 group"
                  >
                    <Send className="size-5 group-hover:rotate-12 transition-transform" />
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

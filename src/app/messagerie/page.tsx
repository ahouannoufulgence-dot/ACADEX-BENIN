
"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Send, 
  MoreVertical, 
  Paperclip, 
  Plus, 
  CheckCheck,
  Loader2,
  MessageCircle,
  ChevronLeft,
  ShieldCheck,
  Zap,
  Bot,
  Image as ImageIcon,
  Mic,
  Smile,
  ThumbsUp,
  Phone,
  Video,
  Info,
  Camera,
  Check,
  User,
  X,
  PhoneOff,
  MicOff,
  VideoOff,
  Maximize2,
  Trash2,
  AlertTriangle,
  ArrowLeft
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useMemo, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function MessagingPage() {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [currentUserName, setCurrentUserName] = useState<string>("")
  const [currentUserRole, setCurrentUserRole] = useState<string>("")
  const [userClasses, setUserClasses] = useState<string[]>([])
  
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messageText, setMessageText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [contacts, setContacts] = useState<any[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherPersonTyping, setOtherPersonTyping] = useState(false)

  // Call System State
  const [isCalling, setIsCalling] = useState(false)
  const [callType, setCallType] = useState<'video' | 'voice' | null>(null)
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting')

  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCurrentUserId(localStorage.getItem('acadex_user_id') || "")
    setCurrentUserName(localStorage.getItem('acadex_user_name') || "Utilisateur")
    setCurrentUserRole(localStorage.getItem('acadex_user_role') || "Élève")
    setUserClasses(JSON.parse(localStorage.getItem('acadex_user_classes') || "[]"))
  }, [])

  const [conversations, setConversations] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)

  const fetchConversations = async () => {
    if (!currentUserId) return
    setLoadingConvs(true)
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [currentUserId])
      .order('last_message_time', { ascending: false })
    setConversations(data || [])
    setLoadingConvs(false)
  }

  useEffect(() => { fetchConversations() }, [currentUserId])

  const fetchMessages = async () => {
    if (!selectedChat) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', selectedChat.id)
      .order('timestamp', { ascending: true })
      .limit(100)
    setMessages(data || [])
  }

  useEffect(() => {
    fetchMessages()
    if (!selectedChat) return

    const channel = supabase
      .channel(`conversation-${selectedChat.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedChat.id}` }, () => {
        fetchMessages()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedChat])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    if (selectedChat && currentUserId) {
      const markAsRead = async () => {
        const unreadCount = { ...(selectedChat.unread_count || {}), [currentUserId]: 0 }
        await supabase.from('conversations').update({ unread_count: unreadCount }).eq('id', selectedChat.id)
      }
      markAsRead()
    }
  }, [messages, selectedChat, currentUserId])

  const handleTyping = async () => {
    if (!selectedChat || !currentUserId) return
    if (!isTyping) {
      setIsTyping(true)
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false)
    }, 2000)
  }

  const handleSendMessage = async (e?: React.FormEvent, customText?: string, type: 'text' | 'image' | 'like' = 'text') => {
    if (e) e.preventDefault()
    const textToSend = customText || messageText
    if (!textToSend.trim() && type === 'text') return
    if (!selectedChat || !currentUserId) return
    
    const msgContent = type === 'like' ? '👍' : textToSend
    setMessageText("")
    setIsTyping(false)

    try {
      await supabase.from('messages').insert({
        conversation_id: selectedChat.id,
        sender_id: currentUserId,
        sender_name: currentUserName,
        text: msgContent,
        type: type,
        seen: false
      })
      
      const newUnreadCount = { ...(selectedChat.unread_count || {}) }
      selectedChat.participants.forEach((pId: string) => { 
        if (pId !== currentUserId) newUnreadCount[pId] = (newUnreadCount[pId] || 0) + 1
      })

      await supabase.from('conversations').update({
        last_message: type === 'image' ? '📷 Photo' : (type === 'like' ? '👍 Like' : msgContent),
        last_message_time: new Date().toISOString(),
        unread_count: newUnreadCount,
      }).eq('id', selectedChat.id)

      fetchMessages()
      fetchConversations()
    } catch (e) {
      toast({ title: "Erreur d'envoi", variant: "destructive" })
    }
  }

  const handleDeleteMessage = async (msgId: string) => {
    if (!selectedChat) return
    try {
      await supabase.from('messages').delete().eq('id', msgId)
      toast({ title: "Message retiré" })
      fetchMessages()
    } catch (e) {
      toast({ title: "Action impossible", variant: "destructive" })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      await handleSendMessage(undefined, base64, 'image')
      toast({ title: "Photo scellée envoyée" })
    }
    reader.readAsDataURL(file)
  }

  const startCall = (type: 'video' | 'voice') => {
    setCallType(type)
    setIsCalling(true)
    setCallStatus('connecting')
    setTimeout(() => setCallStatus('active'), 3000)
  }

  const endCall = () => {
    setCallStatus('ended')
    setTimeout(() => {
      setIsCalling(false)
      setCallType(null)
    }, 1000)
  }

  const fetchContacts = async () => {
    setLoadingContacts(true)
    try {
      const [teachersRes, studentsRes] = await Promise.all([
        supabase.from('teachers').select('*'),
        supabase.from('students').select('*')
      ])
      const teachersData = teachersRes.data || []
      const studentsData = studentsRes.data || []
      let allContacts: any[] = []

      if (currentUserRole === "Directeur") {
        allContacts = [
          ...teachersData.map((d: any) => ({ id: d.official_id || d.id, name: d.full_name, role: 'Prof', sub: d.subject })),
          ...studentsData.map((d: any) => ({ id: d.matricule || d.id, name: `${d.first_name} ${d.last_name}`, role: 'Élève', sub: d.class_id }))
        ]
      } else if (currentUserRole === "Enseignant") {
        const myStudents = studentsData
          .filter((d: any) => userClasses.includes(d.class_id))
          .map((d: any) => ({ id: d.matricule || d.id, name: `${d.first_name} ${d.last_name}`, role: 'Élève', sub: d.class_id }))
        allContacts = [{ id: 'DIR-001', name: 'Directeur Acadex', role: 'Direction', sub: 'Admin' }, ...myStudents]
      } else {
        allContacts = [{ id: 'DIR-001', name: 'Directeur Acadex', role: 'Direction', sub: 'Admin' }]
      }
      
      setContacts(allContacts.filter(c => c.id !== currentUserId).sort((a, b) => a.name.localeCompare(b.name)))
    } catch (e) { console.error(e) } 
    finally { setLoadingContacts(false) }
  }

  const startConversation = async (contact: any) => {
    const convId = [currentUserId, contact.id].sort().join("_")
    await supabase.from('conversations').upsert({
      id: convId,
      participants: [currentUserId, contact.id],
      type: 'private',
      participant_names: { [currentUserId]: currentUserName, [contact.id]: contact.name },
      last_message: "Conversation démarrée",
      last_message_time: new Date().toISOString(),
      unread_count: { [currentUserId]: 0, [contact.id]: 0 },
    })
    setSelectedChat({ id: convId, participants: [currentUserId, contact.id], otherName: contact.name })
    fetchConversations()
  }

  const filteredConversations = useMemo(() => {
    if (!conversations) return []
    return conversations.filter(c => {
      const otherId = c.participants.find((p: string) => p !== currentUserId)
      const name = c.participant_names?.[otherId] || "Utilisateur"
      return name.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [conversations, searchTerm, currentUserId])

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 24 * 60 * 60 * 1000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    if (diff < 7 * 24 * 60 * 60 * 1000) return date.toLocaleDateString('fr-FR', { weekday: 'short' })
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="h-svh md:h-screen flex bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar - Discussions */}
      <Card className={cn(
        "flex flex-col overflow-hidden border-none shadow-none md:shadow-2xl bg-white md:rounded-none w-full md:w-[320px] lg:w-[400px] shrink-0 z-10",
        selectedChat ? "hidden md:flex" : "flex"
      )}>
        <div className="p-5 md:p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="hidden md:flex size-9 rounded-xl bg-muted/30 hover:bg-muted items-center justify-center transition-all">
                <ArrowLeft className="size-4 text-muted-foreground" />
              </button>
              <h2 className="text-3xl font-black tracking-tight uppercase">Messages</h2>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" onClick={fetchContacts} className="size-11 rounded-full bg-primary text-white shadow-xl hover:scale-105 active:scale-95 transition-all"><Plus className="size-7" /></Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.2rem] w-[95%] max-w-lg p-0 overflow-hidden border-none shadow-2xl">
                <div className="p-6 bg-primary text-white flex items-center justify-between">
                  <DialogTitle className="text-xl md:text-2xl font-black uppercase">Nouveau Chat</DialogTitle>
                </div>
                <div className="p-4 bg-white border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="rounded-full bg-muted/30 border-none pl-10 h-11" />
                  </div>
                </div>
                <ScrollArea className="h-[450px] p-2 bg-[#F8FAFC]">
                  {loadingContacts ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary size-8" /></div> : 
                    contacts.map(c => (
                      <button key={c.id} onClick={() => startConversation(c)} className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all text-left mb-2 group">
                        <Avatar className="size-12 border-2 border-white shadow-sm"><AvatarFallback className="bg-primary/5 text-primary font-black text-sm">{c.name?.[0]}</AvatarFallback></Avatar>
                        <div className="min-w-0">
                          <p className="font-black text-sm truncate uppercase">{c.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{c.role} • {c.sub}</p>
                        </div>
                      </button>
                  ))}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Rechercher une discussion..." className="pl-11 h-12 bg-muted/30 border-none rounded-2xl font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-1 no-scrollbar pb-10">
          {loadingConvs ? <div className="flex justify-center p-10"><Loader2 className="size-8 animate-spin text-primary opacity-20" /></div> : 
            filteredConversations.map(chat => {
              const otherId = chat.participants.find((p: string) => p !== currentUserId)
              const name = chat.participant_names?.[otherId] || "Utilisateur"
              const unread = chat.unread_count?.[currentUserId] || 0
              return (
                <div key={chat.id} onClick={() => setSelectedChat({ ...chat, otherName: name })} className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all mx-1",
                  selectedChat?.id === chat.id ? "bg-primary/5 shadow-inner" : "hover:bg-muted/30"
                )}>
                  <div className="relative">
                    <Avatar className="size-14 border-2 border-white shadow-sm">
                      <AvatarFallback className="font-black text-lg bg-primary/10 text-primary uppercase">{name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 size-4 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className={cn("truncate text-sm font-black uppercase tracking-tight", unread > 0 ? "text-foreground" : "text-foreground/70")}>{name}</h4>
                      <span className="text-[10px] font-bold text-muted-foreground">{formatTime(chat.last_message_time)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-xs truncate max-w-[85%]", unread > 0 ? "font-black text-foreground" : "font-medium text-muted-foreground/60")}>
                        {chat.last_message}
                      </p>
                      {unread > 0 && <Badge className="bg-primary text-white text-[10px] px-1.5 py-0 min-w-[1.4rem] h-5 justify-center rounded-full shadow-lg">{unread}</Badge>}
                    </div>
                  </div>
                </div>
              )
          })}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className={cn(
        "flex-1 border-none shadow-none bg-white flex-col overflow-hidden relative transition-all duration-500",
        !selectedChat ? "hidden md:flex bg-[#F8FAFC]/50" : "flex fixed inset-0 z-50 md:relative"
      )}>
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white/40 backdrop-blur-3xl">
            <div className="size-32 bg-primary/5 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-700">
              <MessageCircle className="size-16 text-primary opacity-10" />
            </div>
            <h3 className="text-4xl font-black uppercase tracking-tighter text-foreground/20">Messagerie Acadex</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.4em] mt-4 opacity-30">Espace de communication scellé</p>
          </div>
        ) : (
          <>
            {/* Header Messenger Style */}
            <div className="h-16 md:h-20 px-4 md:px-10 border-b flex items-center justify-between bg-white/90 backdrop-blur-xl sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden rounded-full text-primary" onClick={() => setSelectedChat(null)}><ChevronLeft className="size-8" /></Button>
                <div className="relative">
                  <Avatar className="size-10 md:size-12 border-2 border-primary/5">
                    <AvatarFallback className="font-black text-sm bg-primary/5 text-primary uppercase">{selectedChat.otherName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 size-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm md:text-xl font-black uppercase truncate tracking-tight">{selectedChat.otherName}</h3>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                    Actif maintenant
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 md:gap-4">
                <Button onClick={() => startCall('voice')} variant="ghost" size="icon" className="size-10 md:size-12 rounded-xl text-primary hover:bg-primary/5 transition-all"><Phone className="size-6" /></Button>
                <Button onClick={() => startCall('video')} variant="ghost" size="icon" className="size-10 md:size-12 rounded-xl text-primary hover:bg-primary/5 transition-all"><Video className="size-6" /></Button>
                <Button variant="ghost" size="icon" className="size-10 md:size-12 rounded-xl text-primary hover:bg-primary/5"><Info className="size-6" /></Button>
              </div>
            </div>

            {/* Messages Zone */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 md:space-y-8 no-scrollbar bg-[#F8FAFC]/30 scroll-smooth">
              {messages?.map((msg: any, i: number) => {
                const isMe = msg.sender_id === currentUserId
                return (
                  <div key={msg.id || i} className={cn("flex items-end gap-2 group animate-in slide-in-from-bottom-2 duration-300", isMe ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("max-w-[85%] md:max-w-[70%] flex flex-col relative", isMe ? "items-end" : "items-start")}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className={cn(
                            "px-4 py-3 rounded-[1.4rem] md:rounded-[1.8rem] text-[15px] md:text-lg font-medium leading-relaxed shadow-sm cursor-pointer transition-all active:scale-95",
                            isMe ? "bg-primary text-white rounded-br-sm" : "bg-white text-foreground border border-muted/30 rounded-bl-sm"
                          )}>
                            {msg.type === 'image' ? (
                              <img src={msg.text} alt="Shared" className="rounded-xl max-w-full max-h-[400px] object-cover" />
                            ) : msg.text === '👍' ? (
                              <ThumbsUp className="size-12 md:size-16 fill-primary text-primary" />
                            ) : (
                              msg.text
                            )}
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isMe ? "end" : "start"} className="rounded-2xl border-2 p-1 shadow-2xl">
                          {isMe && (
                            <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="flex items-center gap-3 font-bold p-3 rounded-xl text-destructive focus:text-destructive cursor-pointer">
                               <Trash2 className="size-4" /> Retirer le message
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="flex items-center gap-3 font-bold p-3 rounded-xl cursor-pointer">
                             <Check className="size-4" /> Réagir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {i === (messages.length - 1) && isMe && (
                        <div className="mt-1 flex items-center gap-1 opacity-40">
                           <CheckCheck className="size-3 text-primary" />
                           <span className="text-[8px] font-black uppercase tracking-widest">Remis</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {otherPersonTyping && (
                <div className="flex items-center gap-2 animate-pulse">
                  <div className="bg-white border px-5 py-3 rounded-full flex gap-1.5 shadow-sm">
                     <div className="size-2 bg-primary/40 rounded-full animate-bounce" />
                     <div className="size-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                     <div className="size-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Interaction Bar */}
            <div className="p-4 md:p-10 bg-white/95 backdrop-blur-xl border-t border-muted/10">
              <div className="flex items-end gap-3 md:gap-5 max-w-6xl mx-auto">
                <div className="flex items-center gap-1 mb-1 hidden sm:flex">
                   <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" className="size-11 rounded-full text-primary hover:bg-primary/5 transition-transform active:scale-90"><ImageIcon className="size-7" /></Button>
                   <Button variant="ghost" size="icon" className="size-11 rounded-full text-primary hover:bg-primary/5 transition-transform active:scale-90"><Camera className="size-7" /></Button>
                   <Button variant="ghost" size="icon" className="size-11 rounded-full text-primary hover:bg-primary/5 transition-transform active:scale-90"><Mic className="size-7" /></Button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                
                <div className="flex-1 relative flex items-center min-h-[44px]">
                  <form onSubmit={handleSendMessage} className="w-full relative">
                    <textarea 
                      rows={1}
                      placeholder="Aa" 
                      className="w-full bg-muted/40 border-none rounded-[2rem] py-3.5 pl-6 pr-14 focus:ring-4 focus:ring-primary/5 focus:outline-none resize-none font-medium text-base md:text-xl max-h-40 transition-all shadow-inner placeholder:text-muted-foreground/40"
                      value={messageText} 
                      onChange={(e) => {
                        setMessageText(e.target.value)
                        handleTyping()
                      }}
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-3 bottom-1.5 rounded-full text-primary h-11 w-11 hover:bg-transparent"><Smile className="size-8" /></Button>
                  </form>
                </div>

                <div className="mb-1">
                  {messageText.trim() ? (
                    <Button onClick={() => handleSendMessage()} className="bg-primary text-white size-12 md:size-14 rounded-full shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-90">
                      <Send className="size-7" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => handleSendMessage(undefined, "👍", "like")} className="rounded-full text-primary hover:bg-primary/5 size-12 md:size-14 flex-shrink-0 transition-transform active:scale-150">
                      <ThumbsUp className="size-8 md:size-10 fill-primary text-primary" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex justify-center mt-4 opacity-10">
                 <ShieldCheck className="size-3 mr-2" /> <span className="text-[8px] font-black uppercase tracking-widest">Connexion scellée Acadex V1</span>
              </div>
            </div>

            {/* Call Overlay Immersion */}
            {isCalling && (
              <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-between p-10 text-white animate-in zoom-in duration-500">
                <div className="w-full flex justify-between items-center px-4">
                   <div className="flex items-center gap-3">
                      <ShieldCheck className="size-5 text-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Cryptage scellé</span>
                   </div>
                   <Button variant="ghost" size="icon" className="text-white/40 hover:text-white" onClick={endCall}><Maximize2 className="size-6" /></Button>
                </div>
                
                <div className="flex flex-col items-center gap-10">
                   <div className="relative">
                      <div className={cn("absolute inset-[-20px] bg-primary/20 rounded-full animate-ping", callStatus === 'connecting' ? 'block' : 'hidden')} />
                      <Avatar className="size-32 md:size-56 border-4 border-white/10 shadow-[0_0_80px_rgba(20,83,45,0.3)]">
                        <AvatarFallback className="bg-primary text-white text-5xl md:text-8xl font-black uppercase">{selectedChat.otherName?.[0]}</AvatarFallback>
                      </Avatar>
                   </div>
                   <div className="text-center space-y-4">
                      <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter drop-shadow-2xl">{selectedChat.otherName}</h2>
                      <div className="flex items-center justify-center gap-3">
                         <div className={cn("size-2 rounded-full", callStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')} />
                         <p className="text-primary font-black uppercase tracking-[0.5em] text-xs">
                          {callStatus === 'connecting' ? 'Initialisation flux...' : 'Communication active'}
                         </p>
                      </div>
                   </div>
                </div>

                {callType === 'video' && callStatus === 'active' && (
                  <div className="absolute inset-0 z-0 overflow-hidden opacity-40">
                     <img src="https://picsum.photos/seed/call-visual/1920/1080" className="w-full h-full object-cover scale-110" alt="Video Call" />
                  </div>
                )}

                <div className="relative z-10 w-full max-w-xl flex justify-center items-center gap-6 md:gap-14 bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10">
                   <Button variant="outline" size="icon" className="size-16 md:size-24 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all">
                      <MicOff className="size-8 md:size-10" />
                   </Button>
                   <Button onClick={endCall} className="size-24 md:size-32 rounded-full bg-red-600 hover:bg-red-700 shadow-[0_0_50px_rgba(220,38,38,0.5)] group active:scale-90 transition-all">
                      <PhoneOff className="size-10 md:size-14 fill-white group-hover:rotate-12 transition-transform" />
                   </Button>
                   <Button variant="outline" size="icon" className="size-16 md:size-24 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all">
                      <VideoOff className="size-8 md:size-10" />
                   </Button>
                </div>

                <div className="flex flex-col items-center gap-2 opacity-20">
                   <Zap className="size-5 text-amber-500" />
                   <p className="text-[10px] font-black uppercase tracking-[0.6em]">ACADEX LIVE NETWORK</p>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}


"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { type Boisson } from '@/lib/data';
import { askAssistant } from '@/ai/flows/assistant-flow';

interface ChatAssistantProps {
    boissons: Boisson[];
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatAssistant({ boissons }: ChatAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await askAssistant({
                question: input,
                boissons: boissons,
                history: messages
            });
            
            const assistantMessage: Message = { role: 'assistant', content: response };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error calling assistant:", error);
            const errorMessage: Message = { role: 'assistant', content: "Désolé, je rencontre un problème. Veuillez réessayer." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <Button onClick={() => setIsOpen(!isOpen)} size="icon" className="rounded-full h-16 w-16 shadow-lg">
                    {isOpen ? <X /> : <MessageCircle />}
                </Button>
            </div>
            {isOpen && (
                <Card className="fixed bottom-24 right-6 z-50 w-full max-w-sm shadow-2xl flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Assistant IA</CardTitle>
                        {/* <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X /></Button> */}
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <ScrollArea className="h-72 pr-4">
                            <div className="space-y-4">
                                <div className="p-3 rounded-lg bg-secondary text-secondary-foreground text-sm">
                                    Bonjour ! Posez-moi une question sur les boissons, comme "Quel est le prix de la Castel ?".
                                </div>
                                {messages.map((msg, index) => (
                                    <div key={index} className={`p-3 rounded-lg text-sm ${
                                        msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground ml-auto'
                                            : 'bg-secondary text-secondary-foreground'
                                    }`}>
                                        {msg.content}
                                    </div>
                                ))}
                                {isLoading && <Loader2 className="animate-spin text-primary" />}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter>
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full space-x-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Posez votre question..."
                                disabled={isLoading}
                            />
                            <Button type="submit" disabled={isLoading}>
                                <Send />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}
        </>
    );
}

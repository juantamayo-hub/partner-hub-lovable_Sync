import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function NPSPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    if (submitted) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setSubmitted(false)}
                    className="rounded-full h-12 w-12 bg-primary shadow-xl"
                >
                    <MessageSquare className="h-6 w-6" />
                </Button>
            </div>
        );
    }

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setIsOpen(true)}
                    className="rounded-full h-12 w-12 bg-primary shadow-xl hover:scale-110 transition-transform"
                >
                    <MessageSquare className="h-6 w-6 text-white" />
                </Button>
            </div>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 z-50 w-80 shadow-2xl animate-in slide-in-from-bottom-5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">¿Cómo calificarías tu experiencia?</CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <Button
                            key={num}
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-9 w-9 p-0",
                                rating === num && "bg-primary text-primary-foreground border-primary"
                            )}
                            onClick={() => setRating(num)}
                        >
                            {num}
                        </Button>
                    ))}
                </div>
                <p className="text-[10px] text-muted-foreground flex justify-between px-1 mb-4">
                    <span>Poco probable</span>
                    <span>Muy probable</span>
                </p>
                <Button
                    disabled={rating === null}
                    className="w-full"
                    size="sm"
                    onClick={() => setSubmitted(true)}
                >
                    Enviar feedback
                </Button>
            </CardContent>
        </Card>
    );
}

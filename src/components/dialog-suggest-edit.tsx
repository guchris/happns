"use client"

// React Imports
import { useState } from "react"

// App Imports
import { Event } from "@/components/types"
import { useToast } from "@/hooks/use-toast"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"

// Shadcn Imports
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Lightbulb } from "lucide-react"

interface SuggestEditDialogProps {
    event: Event | null;
    user: any;
}

const SuggestEditDialog = ({ event, user }: SuggestEditDialogProps) => {
    const { toast } = useToast();
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async () => {
        if (!event) return;
    
        setIsSubmitting(true);
        try {
            const suggestionsRef = collection(db, "suggested-edits");
            await addDoc(suggestionsRef, {
                eventId: event.id,
                eventName: event.name,
                subject,
                description,
                submittedBy: user?.uid || "anonymous",
                submittedAt: new Date().toISOString(),
                status: "pending",
            });
    
            toast({
                title: "edit suggestion submitted",
                description: "your suggestion has been successfully submitted",
            });

            // Clear the form
            setSubject("");
            setDescription("");
            setIsOpen(false);
        } catch (error) {
            console.error("Error submitting suggestion:", error);
            toast({
                title: "submission error",
                description: "could not submit your suggestion - please try again",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!event}>
                    <Lightbulb className="h-4 w-4" />
                    <span className="sr-only">suggest edits</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>suggest edits for {event?.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                    <Input value={event?.name || ""} readOnly />
                    <Input
                        placeholder="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        autoFocus
                    />
                    <Textarea
                        placeholder="describe your suggested edit..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !subject.trim() || !description.trim()}
                    >
                        {isSubmitting ? "submitting..." : "submit"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default SuggestEditDialog;
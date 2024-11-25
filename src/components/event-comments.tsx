"use client"

// Next and React Imports
import Link from "next/link"
import { useState, useEffect } from "react"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { Comment } from "@/components/types"
import { useToast } from "@/hooks/use-toast"
import { getInitials } from "@/lib/userUtils"
import { extractMentions } from "@/lib/commentUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, orderBy, onSnapshot } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Other Imports
import { format } from "date-fns"
import { MentionsInput, Mention } from "react-mentions"

const mentionStyle = {
    control: {
        fontSize: "14px",
        fontWeight: "normal",
    },
    highlighter: {
        overflow: "hidden",
    },
    input: {
        margin: 0,
    },
    suggestions: {
        list: {
            backgroundColor: "white",
            border: "1px solid #ccc",
            fontSize: "14px",
        },
        item: {
            padding: "5px 15px",
            "&focused": {
                backgroundColor: "#cee4e5",
            },
        },
    },
};


interface EventCommentsProps {
    eventId: string;
}

const EventComments = ({ eventId }: EventCommentsProps) => {
    const { toast } = useToast();
    const { user, userData } = useAuth();

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

    useEffect(() => {
        // Set the redirect URL only on the client side
        if (typeof window !== "undefined") {
            setRedirectUrl(window.location.href);
        }
    }, []);

    useEffect(() => {
        if (eventId) {
            const commentsRef = collection(db, `events/${eventId}/comments`);
            const q = query(commentsRef, orderBy("timestamp", "desc"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const commentsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                } as Comment));
                setComments(commentsData);
            });
            return () => unsubscribe();
        }
    }, [eventId]);

    const postComment = async () => {
        if (!user || !newComment.trim() || !userData) return;

        setLoading(true);
        try {
            const mentionedUsernames = extractMentions(newComment);
            const commentRef = collection(db, `events/${eventId}/comments`);
            await addDoc(commentRef, {
                username: userData.username || "Anonymous",
                content: newComment.trim(),
                mentionedUsernames,
                timestamp: new Date(),
                profilePicture: userData.profilePicture || null,
            });
            setNewComment("");
        } catch (error) {
            console.error("Error posting comment: ", error);
            toast({
                title: "error",
                description: "failed to post the comment",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* List of Comments */}
            <div className="space-y-4 p-4">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-2">
                            <Link href={`/profile/${comment.username}`}>
                                <Avatar className="w-11 h-11">
                                    {comment.profilePicture ? (
                                        <AvatarImage src={comment.profilePicture} alt={`${comment.username}'s profile picture`} />
                                    ) : (
                                        <AvatarFallback>
                                            {getInitials(comment.username || "Anonymous")}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                            </Link>
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <Link href={`/profile/${comment.username}`} className="text-sm font-semibold hover:underline">
                                        {comment.username}
                                    </Link>
                                    <span className="text-xs text-muted-foreground mt-0.5">
                                        {format(comment.timestamp.toDate(), "MMM d, yyyy h:mm a")}
                                    </span>
                                </div>
                                <p className="text-sm mb-2">
                                    {comment.content.split(" ").map((word, index) => {
                                        if (word.startsWith("@")) {
                                            const username = word.slice(1);
                                            return (
                                                <Link key={index} href={`/profile/${username}`} className="text-blue-500 hover:underline">
                                                    {word}
                                                </Link>
                                            );
                                        }
                                        return `${word} `;
                                    })}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">no comments yet</p>
                )}
            </div>

            <Separator />

            {/* Add a Comment */}
            {user ? (
                <div className="p-4 space-y-2">
                    {/* <Textarea
                        placeholder="add a comment"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={loading}
                    /> */}
                    <MentionsInput
                        style={mentionStyle}
                        value={newComment}
                        onChange={(event, newValue) => setNewComment(newValue)} // Correct handling of MentionsInput onChange
                        placeholder="add a comment and/or mention @username"
                    >
                        <Mention
                            trigger="@"
                            data={async (query: string) => {
                                // Query Firestore to get matching usernames
                                const usernamesSnapshot = await getDocs(collection(db, "usernames"));
                                return usernamesSnapshot.docs
                                    .map((doc) => doc.id) // The document ID is the username
                                    .filter((username) => username.toLowerCase().includes(query.toLowerCase()))
                                    .map((username) => ({ id: username, display: username }));
                            }}
                            style={{ backgroundColor: "#d1e7fd" }}
                        />
                    </MentionsInput>
                    <Button onClick={postComment} disabled={loading || !newComment.trim()}>
                        {loading ? "posting..." : "post comment"}
                    </Button>
                </div>
            ) : (
                <div className="p-4 text-sm text-muted-foreground">
                    please <a href={`/auth?redirect=${encodeURIComponent(redirectUrl || "/")}`} className="underline">
                        login
                    </a> to post a comment
                </div>
            )}
        </>
    )
};

export default EventComments;
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
import { collection, addDoc, getDocs, query, where, orderBy, onSnapshot } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Other Imports
import { format } from "date-fns"
import { MentionsInput, Mention } from "react-mentions"

const mentionStyle = {
    control: {
        fontSize: "14px",
        fontWeight: "normal",
        border: "1px solid #e5e7eb",
        borderRadius: "0.375rem",
        padding: "0.75rem",
        minHeight: "4rem",
        lineHeight: "1.5",
        backgroundColor: "white",
    },
    highlighter: {
        overflow: "hidden",
    },
    input: {
        margin: 0,
        padding: "0.75rem",
        fontSize: "inherit",
        fontWeight: "inherit",
    },
    suggestions: {
        list: {
            backgroundColor: "white",
            border: "1px solid #ccc",
            fontSize: "14px",
            borderRadius: "0.375rem",
        },
        item: {
            padding: "5px 15px",
            "&focused": {
                backgroundColor: "#f3f4f6",
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

            // Notify mentioned users
            for (const username of mentionedUsernames) {

                // Reference the 'usernames' collection
                const usernamesRef = collection(db, "usernames");

                // Query Firestore for the user document matching the username
                const q = query(usernamesRef, where("__name__", "==", username));
                const userDoc = await getDocs(q);

                if (!userDoc.empty) {
                    const userId = userDoc.docs[0].data().uid;

                    // Add a notification to the `user-notifications` subcollection for the mentioned user
                    const notificationsRef = collection(db, `users/${userId}/notifications`);
                    
                    await addDoc(notificationsRef, {
                        type: "mention",
                        message: `${userData.username} mentioned you in a comment`,
                        date: new Date(),
                        link: `/events/${eventId}`,
                        isRead: false,
                    });
                }
            }

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
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                )}
            </div>

            <Separator />

            {/* Add a Comment */}
            {user ? (
                <div className="p-4 space-y-2">
                    <MentionsInput
                        style={mentionStyle}
                        value={newComment}
                        onChange={(event, newValue) => setNewComment(newValue)}
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
                    Please <a href={`/auth?redirect=${encodeURIComponent(redirectUrl || "/")}`} className="underline">
                        login
                    </a> to post a comment
                </div>
            )}
        </>
    )
};

export default EventComments;
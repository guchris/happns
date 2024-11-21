// App Imports
import { Notification } from "@/components/types"
import { formatDistanceToNow } from "date-fns"

interface NotificationListProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
}

export function NotificationList({ notifications, onMarkAsRead }: NotificationListProps) {

    return (
        <div className="space-y-2">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`p-4 rounded-md cursor-pointer border ${
                        notification.isRead ? "bg-white border-gray-100" : "bg-gray-100 border-transparent"
                    }`}
                    onClick={() => onMarkAsRead(notification.id)}
                >
                    <div className="flex justify-between items-center mb-2">
                        {/* Notification Type */}
                        <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                                getBadgeClass(notification.type)
                            }`}
                        >
                            {notification.type}
                        </span>
                    </div>
                    {/* Notification Message */}
                    <div className="flex justify-between items-center">
                        <p className="text-sm">{notification.message}</p>
                    </div>
                    {/* Notification Time */}
                    <p className="text-xs text-gray-400">
                        {formatDistanceToNow(
                            notification.date instanceof Date ? notification.date : notification.date.toDate(),
                            { addSuffix: true }
                        )}
                    </p>
                </div>
            ))}
        </div>
    )
}

/**
 * Helper function to return badge class based on notification type.
 * Add more styles as needed.
 */
function getBadgeClass(type: string): string {
    switch (type) {
        case "info":
            return "bg-blue-100 text-blue-600";
        case "success":
            return "bg-green-100 text-green-600";
        case "warning":
            return "bg-yellow-100 text-yellow-600";
        case "error":
            return "bg-red-100 text-red-600";
        case "eventReminder":
            return "bg-purple-100 text-purple-600";
        case "newEvent":
            return "bg-indigo-100 text-indigo-600";
        case "trendingEvent":
            return "bg-teal-100 text-teal-600";
        case "eventUpdate":
            return "bg-orange-100 text-orange-600";
        case "eventDeadline":
            return "bg-pink-100 text-pink-600";
        case "commentInteraction":
            return "bg-gray-100 text-gray-600";
        case "friendActivity":
            return "bg-amber-100 text-amber-600";
        case "promotion":
            return "bg-fuchsia-100 text-fuchsia-600";
        case "curatorMessage":
            return "bg-cyan-100 text-cyan-600";
        case "systemUpdate":
            return "bg-lime-100 text-lime-600";
        case "accountActivity":
            return "bg-rose-100 text-rose-600";
        default:
            return "bg-gray-100 text-gray-600";
    }
}
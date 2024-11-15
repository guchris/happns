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
                    <div className="flex justify-between items-center">
                        <p className="text-xs">{notification.message}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                        {formatDistanceToNow(notification.date instanceof Date ? notification.date : notification.date.toDate(), { addSuffix: true })}
                    </p>
                </div>
            ))}
        </div>
    )
}
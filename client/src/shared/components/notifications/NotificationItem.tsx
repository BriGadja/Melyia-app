import React from "react";
import { Clock, User, ExternalLink, X } from "lucide-react";
import type { Notification } from "../../types/notifications";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
  onNavigate?: (link: string) => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "À l'instant";
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  if (diffInDays < 7) return `Il y a ${diffInDays}j`;

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "border-red-500 bg-red-50";
    case "high":
      return "border-orange-500 bg-orange-50";
    default:
      return "border-blue-500 bg-blue-50";
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
}: NotificationItemProps): JSX.Element {
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }

    if (notification.link && onNavigate) {
      onNavigate(notification.link);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  const baseClasses =
    "p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors duration-200 relative";
  const unreadClasses = notification.is_read
    ? ""
    : `border-l-4 ${getPriorityColor(notification.priority)}`;

  return (
    <div className={`${baseClasses} ${unreadClasses}`} onClick={handleClick}>
      {/* Badge non-lu */}
      {!notification.is_read && (
        <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}

      {/* Bouton suppression */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
        title="Supprimer la notification"
      >
        <X size={14} />
      </button>

      {/* Contenu principal */}
      <div className="pr-8 pl-4">
        {/* En-tête avec type et priorité */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {notification.notification_type}
          </span>

          {notification.priority !== "normal" && (
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                notification.priority === "urgent"
                  ? "bg-red-100 text-red-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {notification.priority === "urgent" ? "Urgent" : "Important"}
            </span>
          )}
        </div>

        {/* Contenu de la notification */}
        <p
          className={`text-sm leading-relaxed mb-2 ${
            notification.is_read ? "text-gray-600" : "text-gray-900 font-medium"
          }`}
        >
          {notification.content}
        </p>

        {/* Métadonnées */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            {/* Expéditeur */}
            <div className="flex items-center space-x-1">
              <User size={12} />
              <span>
                {notification.sender_name} ({notification.sender_role})
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center space-x-1">
              <Clock size={12} />
              <span>{formatTimeAgo(notification.created_at)}</span>
            </div>
          </div>

          {/* Lien externe */}
          {notification.link && (
            <div className="flex items-center space-x-1 text-blue-500">
              <ExternalLink size={12} />
              <span>Voir plus</span>
            </div>
          )}
        </div>

        {/* Indicateur de lecture */}
        {notification.read_at && (
          <div className="mt-1 text-xs text-gray-400">
            Lu le{" "}
            {new Date(notification.read_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
}

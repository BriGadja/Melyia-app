import React from "react";
import { RefreshCw, AlertCircle, Inbox } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "../../types/notifications";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
  onNavigate?: (link: string) => void;
  onClearError: () => void;
  maxNotifications?: number;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  totalCount,
  isLoading,
  error,
  onMarkAsRead,
  onDelete,
  onRefresh,
  onNavigate,
  onClearError,
  maxNotifications = 50,
}: NotificationDropdownProps): JSX.Element {
  const hasMoreNotifications = totalCount > notifications.length;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 flex flex-col">
      {/* En-tête */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-lg">
        <div>
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <p className="text-sm text-gray-600">
            {unreadCount > 0 ? (
              <>
                <span className="font-medium text-blue-600">{unreadCount}</span>{" "}
                non lues
                {totalCount > unreadCount && (
                  <span className="text-gray-500"> sur {totalCount}</span>
                )}
              </>
            ) : totalCount > 0 ? (
              "Toutes lues"
            ) : (
              "Aucune notification"
            )}
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200 disabled:opacity-50"
          title="Actualiser"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Zone de contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Erreur */}
        {error && (
          <div className="p-3 bg-red-50 border-b border-red-200">
            <div className="flex items-start space-x-2">
              <AlertCircle
                size={16}
                className="text-red-500 mt-0.5 flex-shrink-0"
              />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={onClearError}
                  className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* État de chargement */}
        {isLoading && notifications.length === 0 && (
          <div className="p-8 text-center">
            <RefreshCw
              size={24}
              className="animate-spin text-gray-400 mx-auto mb-2"
            />
            <p className="text-sm text-gray-600">
              Chargement des notifications...
            </p>
          </div>
        )}

        {/* Liste des notifications */}
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onNavigate={onNavigate}
              />
            ))}

            {/* Indicateur "Plus de notifications" */}
            {hasMoreNotifications && (
              <div className="p-3 text-center bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {totalCount - notifications.length} notification(s)
                  supplémentaire(s)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Seules les {maxNotifications} plus récentes sont affichées
                </p>
              </div>
            )}
          </>
        ) : (
          // État vide (pas de chargement et pas d'erreur)
          !isLoading &&
          !error && (
            <div className="p-8 text-center">
              <Inbox size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">Aucune notification</p>
              <p className="text-xs text-gray-500">
                Vous recevrez ici vos notifications importantes
              </p>
            </div>
          )
        )}
      </div>

      {/* Pied de page avec actions */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                // Marquer toutes les notifications non lues comme lues
                notifications
                  .filter((n) => !n.is_read)
                  .forEach((n) => onMarkAsRead(n.id));
              }}
              disabled={unreadCount === 0}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Tout marquer comme lu
            </button>

            <p className="text-xs text-gray-500">
              Dernière mise à jour :{" "}
              {new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

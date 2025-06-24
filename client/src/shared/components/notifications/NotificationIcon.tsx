import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNotifications } from "../../hooks/use-notifications";
import type { NotificationIconProps } from "../../types/notifications";

export function NotificationIcon({
  className = "",
  maxNotifications = 50,
  pollInterval = 30000,
  onNavigate,
}: NotificationIconProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    error,
    refreshNotifications,
    markAsRead,
    deleteNotification,
    clearError,
  } = useNotifications({
    pollInterval,
    maxNotifications,
    autoStart: true,
  });

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Fermer le dropdown avec Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const handleToggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNavigate = (link: string) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(link);
    } else {
      // Navigation par défaut dans un nouvel onglet
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
  };

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
  };

  const handleRefresh = () => {
    refreshNotifications();
  };

  const baseButtonClasses = `
    relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 
    rounded-full transition-all duration-200 focus:outline-none 
    focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  `;

  return (
    <div className={`relative ${className}`}>
      {/* Bouton notification avec badge */}
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className={baseButtonClasses}
        title={`${unreadCount} notification(s) non lue(s)`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Notifications. ${unreadCount} non lues sur ${totalCount}`}
      >
        <Bell size={20} />

        {/* Badge pour notifications non lues */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center">
            {/* Animation pulse pour nouvelles notifications */}
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>

            {/* Badge principal */}
            <div className="relative bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          </div>
        )}

        {/* Indicateur de chargement subtil */}
        {isLoading && unreadCount === 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        )}
      </button>

      {/* Dropdown des notifications */}
      {isOpen && (
        <div ref={dropdownRef}>
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            totalCount={totalCount}
            isLoading={isLoading}
            error={error}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
            onNavigate={handleNavigate}
            onClearError={clearError}
            maxNotifications={maxNotifications}
          />
        </div>
      )}
    </div>
  );
}

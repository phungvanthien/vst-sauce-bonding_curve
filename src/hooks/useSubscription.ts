import { useState, useCallback } from "react";
import { User } from "@/contexts/AuthContext";

export const useSubscription = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const checkSubscriptionStatus = useCallback(async (user: User) => {
    if (!user || !user.userId) {
      setIsSubscribed(false);
      return;
    }

    setIsLoadingSubscription(true);
    try {
      const baseUrl = "http://localhost:8000/api/v2_2/";
      const response = await fetch(
        `${baseUrl}subscription/subscriptions/${user.userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Handle HTTP response status
      if (response.status === 404) {
        // User has no subscription
        console.log("[useSubscription] No subscription found for user");
        setIsSubscribed(false);
        return;
      }

      if (!response.ok) {
        console.error("[useSubscription] Error fetching subscription status:", response);
        setIsSubscribed(false);
        return;
      }

      const data = await response.json();

      // Store subscription data for future use
      setSubscriptionData(data);

      // Check if user has an active subscription
      // Active statuses: 'active', 'trialing', 'pending-tx' (transaction signed but not confirmed)
      const activeStatuses = ['active', 'trialing', 'pending-tx'];
      const isActive = data.status && activeStatuses.includes(data.status);
      
      setIsSubscribed(isActive);
      
    } catch (error) {
      console.error("[useSubscription] Error checking subscription status:", error);
      // Default to not subscribed on error
      setIsSubscribed(false);
    } finally {
      setIsLoadingSubscription(false);
    }
  }, []);

  const handleSelectPlan = useCallback((planId: number) => {
    console.log("[useSubscription] Selected plan:", planId);

    // This is now only used as a fallback callback
    // The actual payment processing happens in SubscriptionModal
    // Just close the modal and update subscription status
    setIsSubscribed(true);
    setShowSubscriptionModal(false);
  }, []);

  const updateSubscriptionStatus = useCallback((status: boolean) => {
    setIsSubscribed(status);
  }, []);

  return {
    isSubscribed,
    isLoadingSubscription,
    showSubscriptionModal,
    setShowSubscriptionModal,
    subscriptionData,
    checkSubscriptionStatus,
    handleSelectPlan,
    updateSubscriptionStatus,
  };
};

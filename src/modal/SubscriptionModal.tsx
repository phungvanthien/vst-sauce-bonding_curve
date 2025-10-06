import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, Star, Clock, Zap, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { useSubscriptionService } from "@/contexts/SubscriptionContext";
import { toast } from "@/hooks/use-toast";

interface SubscriptionOption {
  id: number;
  name: string;
  description: string;
  price: number;
  token: string;
  features: string[];
  isPopular?: boolean;
  isComingSoon?: boolean;
  icon: React.ReactNode;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: number) => void;
  onUpdateSubscriptionStatus?: (status: boolean) => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  onUpdateSubscriptionStatus,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get user and wallet context
  const { user } = useAuth();
  const { walletInfo } = useWallet();

  // Get subscription service from context
  const {
    isInitialized,
    initializeSubscriptionService,
    processSubscriptionPayment,
    getSubscriptionPlan,
    getSubscriptionPlans,
  } = useSubscriptionService();

  // Get subscription plans from service and add UI-specific properties
  const servicePlans = getSubscriptionPlans();
  const subscriptionOptions: SubscriptionOption[] = servicePlans.map(
    (plan) => ({
      ...plan,
      description:
        plan.name === "Premium Plan"
          ? "Full access to all vault features and premium analytics"
          : plan.name === "Pro Plan"
          ? "Professional tools for serious traders"
          : "Advanced features for institutional investors",
      isPopular: plan.name === "Premium Plan",
      isComingSoon: plan.name !== "Premium Plan", // Only Premium is available
      icon:
        plan.name === "Premium Plan" ? (
          <Crown className="h-6 w-6 text-yellow-500" />
        ) : plan.name === "Pro Plan" ? (
          <Zap className="h-6 w-6 text-purple-500" />
        ) : (
          <Star className="h-6 w-6 text-blue-500" />
        ),
    })
  );

  const handleSelectPlan = async (planId: number) => {
    // Check if this is a coming soon plan
    const plan = getSubscriptionPlan(planId);
    if (!plan || plan.name !== "Premium Plan") {
      return; // Don't allow selection of coming soon plans
    }

    setSelectedPlan(planId);
    setIsProcessing(true);

    try {
      // Validate user and wallet connection
      if (!user || !user.userId) {
        throw new Error("User not authenticated");
      }

      if (!walletInfo) {
        throw new Error("Wallet not connected");
      }

      // Get user address
      const userAddress =
        walletInfo.type === "hashpack"
          ? walletInfo.accountId
          : walletInfo.address;

      if (!userAddress) {
        throw new Error("User address not available");
      }

      // Initialize subscription service if not already initialized
      if (!isInitialized) {
        await initializeSubscriptionService();
      }

      // Get subscription plan details
      const plan = getSubscriptionPlan(planId);
      if (!plan) {
        throw new Error("Invalid subscription plan");
      }

      // Process the subscription payment (includes balance validation)
      const payment = await processSubscriptionPayment(
        plan.name,
        plan.price,
        userAddress,
        user.accountId, // Pass Hedera account ID for HashPack operations
        user.userId // Pass database user ID as number
      );

      if (payment.status === "completed") {
        toast({
          title: "Subscription Successful!",
          description: `You have successfully subscribed to ${plan.name} for ${plan.price} VST`,
        });

        // Update subscription status to reflect successful payment
        if (onUpdateSubscriptionStatus) {
          onUpdateSubscriptionStatus(true);
        }

        // Close the modal
        onClose();
      } else if (payment.status === "user_rejected") {
        toast({
          title: "Transaction Cancelled",
          description:
            "You cancelled the subscription payment. No charges were made.",
          variant: "destructive",
        });

        // Don't close the modal, let user try again
      } else {
        throw new Error("Payment processing failed");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during subscription",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-cyrus-accent" />
            Choose Your Subscription Plan
          </DialogTitle>
          <DialogDescription className="text-base">
            Unlock premium features and access to all vault strategies with VST
            token payments
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {subscriptionOptions.map((option) => (
            <Card
              key={option.id}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlan === option.id
                  ? "ring-2 ring-cyrus-accent shadow-lg"
                  : option.isComingSoon
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:shadow-md"
              }`}
              onClick={() =>
                !option.isComingSoon && handleSelectPlan(option.id)
              }
            >
              {/* Popular Badge */}
              {option.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Coming Soon Badge */}
              {option.isComingSoon && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge
                    variant="secondary"
                    className="bg-gray-500 text-white px-4 py-1"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Coming Soon
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-3">{option.icon}</div>
                <CardTitle className="text-xl">{option.name}</CardTitle>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="text-center">
                  {option.isComingSoon ? (
                    <div className="text-2xl font-bold text-gray-400">TBD</div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-cyrus-accent">
                        {option.price} {option.token}
                      </div>
                      <div className="text-sm text-cyrus-textSecondary">
                        Monthly subscription
                      </div>
                    </div>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2">
                  {option.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-cyrus-textSecondary">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {option.isComingSoon ? (
                    <Button
                      disabled
                      className="w-full bg-gray-400 cursor-not-allowed"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Coming Soon
                    </Button>
                  ) : (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(option.id);
                      }}
                      disabled={isProcessing}
                      className={`w-full ${
                        option.isPopular
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                          : "bg-cyrus-accent hover:bg-cyrus-accent/90"
                      }`}
                    >
                      {isProcessing && selectedPlan === option.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          {option.isPopular ? "Get Premium" : "Select Plan"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-6 p-4 bg-cyrus-card/60 rounded-lg">
          <div className="text-center space-y-2">
            <p className="text-sm text-cyrus-textSecondary">
              <strong>VST Token:</strong> Your monthly subscription will be paid
              using VST tokens
            </p>
            <p className="text-xs text-cyrus-textSecondary">
              All payments are processed on the Hedera network for fast, secure
              monthly transactions
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Settings, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface EmailSetupGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailSetupGuide({ open, onOpenChange }: EmailSetupGuideProps) {
  const [, setLocation] = useLocation();

  const handleGoToSettings = () => {
    onOpenChange(false);
    setLocation("/settings");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-email-setup-guide">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Let's Set Up Email Sharing! 📧
          </DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-2">
            <p className="text-base text-gray-700">
              To share reports with colleagues, we'll need to connect your email first.
            </p>
            <p className="text-sm text-gray-600">
              Don't worry — it only takes a minute and we'll guide you through each step!
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            What you'll need:
          </h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Your email address</li>
            <li>• SMTP server details (we'll help you find these)</li>
            <li>• About 2-3 minutes</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={handleGoToSettings}
            className="w-full bg-blue-600 hover:bg-blue-700"
            data-testid="button-go-to-settings"
          >
            Take Me to Settings
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
            data-testid="button-setup-later"
          >
            I'll Set This Up Later
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          💡 Tip: Once set up, you can share reports with just a few clicks!
        </p>
      </DialogContent>
    </Dialog>
  );
}

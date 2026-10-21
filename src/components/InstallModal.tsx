import React, { useState, useEffect } from 'react';
import { Share2, PlusSquare, CheckCircle2, X, Download } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Detect standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Capture Android / Chrome install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setDeferredPrompt(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#2a170d] to-[#170a04] border-t-2 sm:border-2 border-amber-600/60 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-[#f7f2ea] safe-pb animate-sheet-up sm:animate-fade-in">
        {/* iOS Grab Handle for Mobile */}
        <div className="w-10 h-1 rounded-full bg-amber-700/60 mx-auto -mt-1 mb-3 sm:hidden" />
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-amber-950/70 border border-amber-700/50 text-amber-300 hover:text-white hover:bg-amber-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-amber-900/40">
          <img
            src="/icon-192.png"
            alt="ქართული ნარდი"
            className="w-14 h-14 rounded-2xl shadow-lg border border-amber-500/40"
          />
          <div>
            <h3 className="text-lg font-black text-amber-200">
              დაამატე აიფონის ეკრანზე
            </h3>
            <p className="text-xs text-amber-400/80 font-medium">
              Progressive Web App (PWA)
            </p>
          </div>
        </div>

        {isStandalone ? (
          <div className="flex flex-col items-center text-center py-4 gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <h4 className="text-base font-bold text-white">
              აპლიკაცია უკვე დაყენებულია!
            </h4>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              თქვენ უკვე სარგებლობთ სრულეკრანიანი აპლიკაციით. შეგიძლიათ ითამაშოთ ნებისმიერ დროს, თუნდაც ინტერნეტის გარეშე.
            </p>
          </div>
        ) : isIOS ? (
          /* iOS Step-by-Step Instructions */
          <div className="space-y-4">
            <p className="text-xs text-amber-100/90 leading-relaxed">
              აიფონზე აპლიკაციის სახით შესანახად და Safari-ს ჩარჩოების გარეშე სათამაშოდ მიჰყევით ამ 3 მარტივ ნაბიჯს:
            </p>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 bg-[#1e0e07] p-3 rounded-2xl border border-amber-900/50">
                <div className="w-8 h-8 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-300">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-amber-300">ნაბიჯი 1:</span> Safari-ს ქვედა პანელზე დააჭირეთ <span className="font-bold text-white">„გაზიარების“ (Share)</span> ღილაკს.
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 bg-[#1e0e07] p-3 rounded-2xl border border-amber-900/50">
                <div className="w-8 h-8 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-300">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-amber-300">ნაბიჯი 2:</span> ჩამოსაშლელ მენიუში აირჩიეთ <span className="font-bold text-white">„მთავარ ეკრანზე დამატება“ (Add to Home Screen)</span>.
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 bg-[#1e0e07] p-3 rounded-2xl border border-amber-900/50">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-emerald-300">ნაბიჯი 3:</span> ზედა მარჯვენა კუთხეში დააჭირეთ <span className="font-bold text-white">„დამატებას“ (Add)</span>.
                </div>
              </div>
            </div>

            <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-2.5 text-[11px] text-amber-300/80 text-center">
              ✨ ხატულა გამოჩნდება თქვენს აიფონზე და გაიხსნება როგორც ჩვეულებრივი iOS აპლიკაცია!
            </div>
          </div>
        ) : deferredPrompt ? (
          /* Android / Chrome 1-Click Install */
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-xs text-amber-100/90 text-center">
              დააინსტალირეთ ქართული ნარდი პირდაპირ თქვენს მოწყობილობაზე ერთი წკაპით:
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-extrabold shadow-xl flex items-center justify-center gap-2 border border-amber-300/40 transition"
            >
              <Download className="w-5 h-5" />
              აპლიკაციის დამატება (Install)
            </button>
          </div>
        ) : (
          /* General Browser Guide */
          <div className="space-y-3">
            <p className="text-xs text-amber-100/90">
              თქვენი ბრაუზერის მენიუდან (⋮ ან Share) აირჩიეთ <span className="font-bold text-white">„დაამატე მთავარ ეკრანზე“</span> ან <span className="font-bold text-white">„Install App“</span>.
            </p>
            <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-2.5 text-[11px] text-amber-300/80 text-center">
              🎲 აპლიკაცია მუშაობს როგორც მობილურზე, ასევე კომპიუტერზე ოფლაინ რეჟიმში!
            </div>
          </div>
        )}

        {/* Footer OK button */}
        <div className="mt-5 pt-3 border-t border-amber-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-200 font-bold text-xs transition"
          >
            გასაგებია
          </button>
        </div>
      </div>
    </div>
  );
};

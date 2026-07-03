import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Icon } from '@iconify/react';

// Liste courante des indicatifs (avec ISO code)
export const countries = [
  { code: '+225', iso: 'CI', name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: '+33', iso: 'FR', name: "France", flag: "🇫🇷" },
  { code: '+221', iso: 'SN', name: "Sénégal", flag: "🇸🇳" },
  { code: '+223', iso: 'ML', name: "Mali", flag: "🇲🇱" },
  { code: '+226', iso: 'BF', name: "Burkina Faso", flag: "🇧🇫" },
  { code: '+228', iso: 'TG', name: "Togo", flag: "🇹🇬" },
  { code: '+229', iso: 'BJ', name: "Bénin", flag: "🇧🇯" },
  { code: '+237', iso: 'CM', name: "Cameroun", flag: "🇨🇲" },
  { code: '+241', iso: 'GA', name: "Gabon", flag: "🇬🇦" },
  { code: '+242', iso: 'CG', name: "Congo", flag: "🇨🇬" },
  { code: '+243', iso: 'CD', name: "RDC", flag: "🇨🇩" },
  { code: '+1', iso: 'US', name: "USA/Canada", flag: "🇺🇸" },
  { code: '+44', iso: 'GB', name: "Royaume-Uni", flag: "🇬🇧" },
  { code: '+32', iso: 'BE', name: "Belgique", flag: "🇧🇪" },
  { code: '+41', iso: 'CH', name: "Suisse", flag: "🇨🇭" },
  { code: '+227', iso: 'NE', name: "Niger", flag: "🇳🇪" },
  { code: '+245', iso: 'GW', name: "Guinée-Bissau", flag: "🇬🇼" },
  { code: '+224', iso: 'GN', name: "Guinée", flag: "🇬🇳" },
  { code: '+233', iso: 'GH', name: "Ghana", flag: "🇬🇭" },
  { code: '+234', iso: 'NG', name: "Nigeria", flag: "🇳🇬" },
  { code: '+212', iso: 'MA', name: "Maroc", flag: "🇲🇦" },
  { code: '+213', iso: 'DZ', name: "Algérie", flag: "🇩🇿" },
  { code: '+216', iso: 'TN', name: "Tunisie", flag: "🇹🇳" },
].sort((a, b) => a.name.localeCompare(b.name));

const sortedCountries = [
  countries.find(c => c.code === '+225')!,
  ...countries.filter(c => c.code !== '+225')
];

export interface InputPhoneProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  indicatif: string;
  phone: string;
  onPhoneChange: (value: { indicatif: string; phone: string }) => void;
  error?: boolean;
}

export const InputPhone = forwardRef<HTMLInputElement, InputPhoneProps>(
  ({ className, indicatif, phone, onPhoneChange, error, ...props }, ref) => {

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentIndicatif = indicatif || '+225';
    const currentCountry = sortedCountries.find(c => c.code === currentIndicatif) || sortedCountries[0];

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div ref={dropdownRef} className={cn("flex h-10 sm:h-11 w-full rounded-lg border bg-background text-sm transition-all focus-within:ring-1 focus-within:ring-primary focus-within:border-primary relative", error ? "border-red-500 focus-within:ring-red-500" : "border-border", className)}>
        {/* Trigger */}
        <div onClick={() => setIsOpen(!isOpen)} className="relative flex items-center justify-between gap-2 border-r border-border bg-muted/20 px-3 cursor-pointer min-w-[100px] hover:bg-muted/50 transition-colors rounded-l-lg">
          <div className="flex items-center gap-1.5 pointer-events-none">
            <span className="text-base leading-none">{currentCountry.flag}</span>
            <span className="font-bold text-foreground text-[13px]">{currentCountry.code}</span>
          </div>
          <Icon icon="solar:alt-arrow-down-linear" className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-[200px] max-h-[300px] overflow-y-auto rounded-sm border border-border bg-card p-1  z-50">
            {sortedCountries.map((c) => (
              <div key={`${c.code}-${c.iso}`}
                onClick={(e) => { e.stopPropagation(); onPhoneChange({ indicatif: c.code, phone }); setIsOpen(false); }}
                className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-sm cursor-pointer transition-colors", currentIndicatif === c.code ? "bg-primary/10" : "hover:bg-muted/50")}>
                <span className="text-lg leading-none">{c.flag}</span>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className={cn("font-bold", currentIndicatif === c.code ? "text-primary" : "text-foreground")}>{c.iso}</span>
                  <span className={cn("font-medium", currentIndicatif === c.code ? "text-primary/70" : "text-muted-foreground")}>{c.code}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <input {...props} ref={ref} type="tel" value={phone || ''}
          onChange={(e) => { const cleanPhone = e.target.value.replace(/[^\d\s]/g, ''); onPhoneChange({ indicatif: currentIndicatif, phone: cleanPhone }); }}
          className="flex-1 bg-transparent px-3 py-2 outline-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground text-foreground font-medium" placeholder="07 12 34 56 78" />
      </div>
    );
  }
);

InputPhone.displayName = "InputPhone";

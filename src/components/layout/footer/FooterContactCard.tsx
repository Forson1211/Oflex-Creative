import { Phone, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  phone?: string;
  address?: string;
};

function buildMapUrl(address: string) {
  const q = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function normalizeTel(phone: string) {
  // Keep + and digits only for tel: links
  return phone.replace(/[^\d+]/g, "");
}

export function FooterContactCard({ phone, address }: Props) {
  const hasPhone = Boolean(phone && phone.trim());
  const hasAddress = Boolean(address && address.trim());

  if (!hasPhone && !hasAddress) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-sm font-medium text-foreground">Contact</div>
      <p className="text-xs text-muted-foreground mt-1">
        Quick actions for mobile
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2">
        {hasPhone ? (
          <Button asChild size="sm" className="justify-center sm:justify-start">
            <a href={`tel:${normalizeTel(phone!)}`} aria-label="Call phone number">
              <Phone className="w-4 h-4 mr-2" />
              Call
            </a>
          </Button>
        ) : null}

        {hasAddress ? (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="justify-center sm:justify-start"
          >
            <a
              href={buildMapUrl(address!)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open address in maps"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Open Map
            </a>
          </Button>
        ) : null}

        {hasAddress ? (
          <div className="text-xs text-muted-foreground mt-2 text-center sm:text-left break-words">
            {address}
          </div>
        ) : null}
      </div>
    </div>
  );
}

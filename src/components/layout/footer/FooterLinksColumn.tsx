import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export type FooterLinkItem = {
  name: string;
  path: string;
  external?: boolean;
};

type Props = {
  title: string;
  links: FooterLinkItem[];
  align?: "center" | "left";
  showExternalIcon?: boolean;
};

export function FooterLinksColumn({
  title,
  links,
  align = "left",
  showExternalIcon = false,
}: Props) {
  const isCentered = align === "center";

  return (
    <div className={isCentered ? "text-center sm:text-left" : "text-left"}>
      <h4 className="font-semibold text-foreground mb-4">{title}</h4>
      <ul className={isCentered ? "space-y-3" : "space-y-3"}>
        {links.map((link) => (
          <li key={link.name}>
            {link.external ? (
              <a
                href={link.path}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  isCentered
                    ? "text-muted-foreground hover:text-primary transition-colors text-sm inline-flex items-center justify-center gap-1"
                    : "text-muted-foreground hover:text-primary transition-colors text-sm inline-flex items-center gap-1"
                }
              >
                {link.name}
                {showExternalIcon ? <ArrowUpRight className="w-3.5 h-3.5" /> : null}
              </a>
            ) : (
              <Link
                to={link.path}
                className={
                  isCentered
                    ? "text-muted-foreground hover:text-primary transition-colors text-sm inline-flex items-center justify-center gap-1"
                    : "text-muted-foreground hover:text-primary transition-colors text-sm inline-flex items-center gap-1"
                }
              >
                {link.name}
                {showExternalIcon ? <ArrowUpRight className="w-3.5 h-3.5" /> : null}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

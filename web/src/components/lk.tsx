"use client";

export default function SoftwareOneLogo() {
  return (
    <a
      href="https://www.softwareone.com"
      className="hover:opacity-70 transition-all duration-250"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex items-center">
        {/* Using regular img tag for external SVG logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="https://www.softwareone.com/-/media/images/logos/softwareone-logo-blk.svg?iar=0&hash=6A277FF39328B4D79A071F4A9F95F301"
          alt="SoftwareOne"
          width="120"
          height="32"
          className="h-8 w-auto"
        />
      </div>
    </a>
  );
}

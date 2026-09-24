"use client";

import React from "react";

interface CyberLoaderProps {
  fullscreen?: boolean;
  text?: string;
  subtext?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CyberLoader({
  fullscreen = false,
  text = "MEMUAT DATA...",
  subtext = "Menghubungkan ke secure server...",
  size = "md",
  className = "",
}: CyberLoaderProps) {
  return (
    <div
      className={`cyber-loader-container ${fullscreen ? "is-fullscreen" : ""} size-${size} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="cyber-loader-content">
        {/* Concentric Cyber Rings Spinner */}
        <div className="cyber-rings-wrapper">
          <div className="cyber-outer-ring" />
          <div className="cyber-middle-ring" />
          <div className="cyber-inner-core">
            <div className="cyber-core-dot" />
          </div>
        </div>

        {/* Tech Status Indicator */}
        <div className="cyber-loader-info">
          <div className="cyber-tech-badge">
            <span className="cyber-status-pulse" />
            <span>HARAP TUNGGU</span>
          </div>
          {text && <div className="cyber-loader-title">{text}</div>}
          {subtext && <div className="cyber-loader-subtext">{subtext}</div>}
        </div>
      </div>
    </div>
  );
}

export default CyberLoader;
